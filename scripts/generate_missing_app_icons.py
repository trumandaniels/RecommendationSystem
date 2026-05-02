from __future__ import annotations

import argparse
import base64
import json
import os
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_DEMO_DATA_PATH = Path("frontend/src/app/demoData.generated.ts")
DEFAULT_METADATA_PATH = Path(".runtime/app-store-scrape/catalog-official-icons.json")
DEFAULT_OUTPUT_DIR = Path(".runtime/generated-app-icons")
DEFAULT_OUTPUT_METADATA_PATH = Path(".runtime/app-store-scrape/gpt-image-icons.json")
DEFAULT_MODEL = "gpt-image-1"
DEFAULT_SIZE = "1024x1024"
DEFAULT_QUALITY = "low"
DEFAULT_LIMIT = 10
OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate original GPT-image app icons for catalog apps that still do not have "
            "official scraped imagery."
        ),
    )
    parser.add_argument("--demo-data-path", type=Path, default=DEFAULT_DEMO_DATA_PATH)
    parser.add_argument(
        "--metadata-path",
        type=Path,
        action="append",
        default=[],
        help=(
            "Metadata files whose packages should be skipped, such as official icon "
            "enrichment output. May be passed more than once."
        ),
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--output-metadata-path", type=Path, default=DEFAULT_OUTPUT_METADATA_PATH)
    parser.add_argument(
        "--icon-url-mode",
        choices=("data-url", "path"),
        default="data-url",
        help=(
            "Use data-url to embed PNG bytes in metadata, or path to write icon URLs "
            "such as /generated-app-icons/com.example.png."
        ),
    )
    parser.add_argument(
        "--icon-url-prefix",
        default="",
        help="URL prefix used with --icon-url-mode path, for example /generated-app-icons.",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--size", default=DEFAULT_SIZE)
    parser.add_argument("--quality", default=DEFAULT_QUALITY)
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate every missing icon instead of limiting the run.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the packages that would be generated without calling GPT-image.",
    )
    parser.add_argument(
        "--dry-run-list-limit",
        type=int,
        default=20,
        help="Maximum package rows to print during --dry-run.",
    )
    parser.add_argument("--packages", nargs="*", default=[])
    parser.add_argument("--api-key-env", default="OPENAI_API_KEY")
    args = parser.parse_args()

    if args.limit <= 0 and not args.all:
        raise ValueError("--limit must be greater than zero.")
    if not args.demo_data_path.exists():
        raise FileNotFoundError(f"Demo data file not found: {args.demo_data_path}")
    for metadata_path in args.metadata_path:
        if not metadata_path.exists():
            raise FileNotFoundError(f"Metadata file not found: {metadata_path}")
    if args.icon_url_mode == "path" and not args.icon_url_prefix.strip():
        raise ValueError("--icon-url-prefix is required when --icon-url-mode path is used.")
    return args


def load_generated_export(export_path: Path, export_name: str) -> object:
    text = export_path.read_text(encoding="utf-8")
    prefix = f"export const {export_name} = "
    start = text.index(prefix) + len(prefix)
    end = text.index(" as const;", start)
    return json.loads(text[start:end])


def load_metadata_records(path: Path) -> dict[str, dict[str, object]]:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    apps = payload.get("apps")
    if not isinstance(apps, list):
        raise ValueError(f"Metadata file must contain an apps list: {path}")
    records = {}
    for app in apps:
        if not isinstance(app, dict):
            raise ValueError(f"Metadata file contains a non-object app row: {path}")
        package_name = app.get("package_name")
        if isinstance(package_name, str) and package_name:
            records[package_name] = app
    return records


def load_metadata_record_set(paths: list[Path]) -> dict[str, dict[str, object]]:
    records: dict[str, dict[str, object]] = {}
    for path in paths:
        records.update(load_metadata_records(path))
    return records


def candidate_rows(
    catalog: list[list[object]],
    metadata_records: dict[str, dict[str, object]],
    packages: list[str],
    limit: int | None,
) -> list[list[object]]:
    if packages:
        requested = set(packages)
        return [row for row in catalog if str(row[0]) in requested and str(row[0]) not in metadata_records]

    rows = []
    for row in catalog:
        package_name = str(row[0])
        source = str(row[9] or "") if len(row) > 9 else ""
        sample_installs = int(row[8]) if isinstance(row[8], int) else 0
        if package_name in metadata_records or source:
            continue
        rows.append((sample_installs, row))

    rows.sort(key=lambda item: (-item[0], str(item[1][1])))
    if limit is None:
        return [row for _, row in rows]
    return [row for _, row in rows[:limit]]


def safe_filename(package_name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", package_name) + ".png"


def icon_prompt(row: list[object]) -> str:
    title = str(row[1])
    category = str(row[2])
    description = str(row[4])
    return (
        "Create an original mobile app icon, square 1024 by 1024, polished App Store style. "
        "Use simple symbolic artwork, strong silhouette, vibrant but tasteful colors, and no tiny UI text. "
        "Do not imitate or recreate any existing brand logo, trademark, mascot, or copyrighted character. "
        f"App name: {title}. Category: {category}. App description: {description[:600]}"
    )


def icon_url_for_record(
    icon_bytes: bytes,
    output_path: Path,
    icon_url_mode: str,
    icon_url_prefix: str,
) -> str:
    if icon_url_mode == "data-url":
        encoded_icon = base64.b64encode(icon_bytes).decode("ascii")
        return f"data:image/png;base64,{encoded_icon}"

    prefix = icon_url_prefix.strip().rstrip("/")
    return f"{prefix}/{output_path.name}"


def generate_icon_bytes(
    api_key: str,
    model: str,
    size: str,
    quality: str,
    prompt: str,
) -> bytes:
    payload = json.dumps(
        {
            "model": model,
            "prompt": prompt,
            "size": size,
            "quality": quality,
            "n": 1,
        },
    ).encode("utf-8")
    request = Request(
        OPENAI_IMAGES_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=180) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI image request failed with HTTP {exc.code}: {body}") from exc
    except URLError as exc:
        raise RuntimeError(f"OpenAI image request failed: {exc.reason}") from exc

    try:
        encoded_image = response_payload["data"][0]["b64_json"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("OpenAI image response did not contain data[0].b64_json.") from exc
    return base64.b64decode(encoded_image)


def render_metadata(records: list[dict[str, object]]) -> str:
    return json.dumps(
        {
            "generatedAt": None,
            "store": "gpt-image",
            "apps": records,
        },
        indent=2,
        ensure_ascii=False,
    ) + "\n"


def main() -> None:
    args = parse_args()
    catalog = load_generated_export(args.demo_data_path, "APP_CATALOG")
    if not isinstance(catalog, list):
        raise ValueError("APP_CATALOG export must be a list.")
    skip_records = load_metadata_record_set(args.metadata_path)
    existing_records = load_metadata_records(args.output_metadata_path)
    metadata_records = {**skip_records, **existing_records}
    limit = None if args.all else args.limit
    rows = candidate_rows(catalog, metadata_records, args.packages, limit)

    if args.dry_run:
        print(f"Would generate {len(rows)} GPT-image icons.")
        for row in rows[: args.dry_run_list_limit]:
            print(f"{row[0]}\t{row[1]}\t{row[2]}")
        remaining = len(rows) - args.dry_run_list_limit
        if remaining > 0:
            print(f"... {remaining} more")
        return

    api_key = os.environ.get(args.api_key_env)
    if not api_key:
        raise RuntimeError(f"{args.api_key_env} is required to generate GPT-image icons.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    records = existing_records
    for row in rows:
        package_name = str(row[0])
        output_path = args.output_dir / safe_filename(package_name)
        if output_path.exists():
            icon_bytes = output_path.read_bytes()
        else:
            icon_bytes = generate_icon_bytes(
                api_key=api_key,
                model=args.model,
                size=args.size,
                quality=args.quality,
                prompt=icon_prompt(row),
            )
            output_path.write_bytes(icon_bytes)

        records[package_name] = {
            "package_name": package_name,
            "store": "gpt-image",
            "source_url": str(output_path),
            "icon_url": icon_url_for_record(
                icon_bytes,
                output_path,
                args.icon_url_mode,
                args.icon_url_prefix,
            ),
            "short_description": str(row[4]),
        }
        print(f"gpt-image icon: {package_name} -> {output_path}")

    args.output_metadata_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_metadata_path.write_text(
        render_metadata([records[key] for key in sorted(records)]),
        encoding="utf-8",
    )
    print(f"Wrote {len(records)} GPT-image metadata records to {args.output_metadata_path}")


if __name__ == "__main__":
    main()

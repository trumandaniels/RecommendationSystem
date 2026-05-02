from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path

from scrape_app_store_metadata import (
    AppStoreMetadata,
    AppStoreScrapeError,
    embed_icon,
    scrape_package,
)


DEFAULT_DEMO_DATA_PATH = Path("frontend/src/app/demoData.generated.ts")
DEFAULT_EXISTING_METADATA_PATHS = [
    Path(".runtime/app-store-scrape/demo-combined-metadata.json"),
]
DEFAULT_OUTPUT_PATH = Path(".runtime/app-store-scrape/catalog-official-icons.json")
DEFAULT_ERRORS_PATH = Path(".runtime/app-store-scrape/catalog-official-icon-errors.json")
DEFAULT_TIMEOUT_SECONDS = 20.0
DEFAULT_USER_AGENT = (
    "RecommendationSystem official icon enrichment "
    "(local portfolio demo; contact: repository owner)"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Try to fill generated catalog icon gaps from official app-store pages before "
            "falling back to generated images."
        ),
    )
    parser.add_argument("--demo-data-path", type=Path, default=DEFAULT_DEMO_DATA_PATH)
    parser.add_argument(
        "--existing-metadata-path",
        type=Path,
        action="append",
        default=[],
        help="Existing app-store metadata JSON to preserve and skip.",
    )
    parser.add_argument("--output-path", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--errors-path", type=Path, default=DEFAULT_ERRORS_PATH)
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--packages", nargs="*", default=[])
    parser.add_argument(
        "--store",
        choices=("google-play", "myket"),
        action="append",
        default=[],
        help="Official store search order. Defaults to Google Play, then Myket.",
    )
    parser.add_argument("--delay-seconds", type=float, default=0.5)
    parser.add_argument("--timeout-seconds", type=float, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    parser.add_argument(
        "--embed-icons",
        action="store_true",
        help="Download official icons into data URLs so the demo does not depend on remote CDNs.",
    )
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="Write successes plus a failure report instead of failing the whole run.",
    )
    args = parser.parse_args()

    if args.limit <= 0:
        raise ValueError("--limit must be greater than zero.")
    if args.delay_seconds < 0:
        raise ValueError("--delay-seconds must be non-negative.")
    if args.timeout_seconds <= 0:
        raise ValueError("--timeout-seconds must be greater than zero.")
    if not args.demo_data_path.exists():
        raise FileNotFoundError(f"Demo data file not found: {args.demo_data_path}")

    args.existing_metadata_path = args.existing_metadata_path or DEFAULT_EXISTING_METADATA_PATHS
    args.store = args.store or ["google-play", "myket"]
    return args


def load_generated_export(export_path: Path, export_name: str) -> object:
    text = export_path.read_text(encoding="utf-8")
    prefix = f"export const {export_name} = "
    start = text.index(prefix) + len(prefix)
    end = text.index(" as const;", start)
    return json.loads(text[start:end])


def load_existing_records(paths: list[Path]) -> dict[str, dict[str, object]]:
    records: dict[str, dict[str, object]] = {}
    for path in paths:
        if not path.exists():
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        apps = payload.get("apps")
        if not isinstance(apps, list):
            raise ValueError(f"Metadata file must contain an apps list: {path}")
        for app in apps:
            if not isinstance(app, dict):
                raise ValueError(f"Metadata file contains a non-object app row: {path}")
            package_name = app.get("package_name")
            if isinstance(package_name, str) and package_name:
                records[package_name] = app
    return records


def missing_official_icon_packages(
    catalog: list[list[object]],
    existing_records: dict[str, dict[str, object]],
    explicit_packages: list[str],
    limit: int,
) -> list[str]:
    if explicit_packages:
        return [package for package in dict.fromkeys(explicit_packages) if package not in existing_records]

    candidates = []
    for row in catalog:
        package_name = str(row[0])
        source = str(row[9] or "") if len(row) > 9 else ""
        sample_installs = int(row[8]) if isinstance(row[8], int) else 0
        if package_name in existing_records or source:
            continue
        candidates.append((sample_installs, package_name))

    candidates.sort(key=lambda item: (-item[0], item[1]))
    return [package for _, package in candidates[:limit]]


def render_output(records: dict[str, dict[str, object]]) -> str:
    return json.dumps(
        {
            "generatedAt": None,
            "store": "mixed-official",
            "apps": [records[key] for key in sorted(records)],
        },
        ensure_ascii=False,
        indent=2,
    ) + "\n"


def scrape_first_available(
    package_name: str,
    stores: list[str],
    timeout_seconds: float,
    user_agent: str,
    embed_icons: bool,
) -> AppStoreMetadata:
    errors: list[str] = []
    for store in stores:
        try:
            record = scrape_package(package_name, store, timeout_seconds, user_agent)
            return embed_icon(record, timeout_seconds, user_agent) if embed_icons else record
        except AppStoreScrapeError as exc:
            errors.append(f"{store}: {exc}")
    raise AppStoreScrapeError("; ".join(errors))


def main() -> None:
    args = parse_args()
    catalog = load_generated_export(args.demo_data_path, "APP_CATALOG")
    if not isinstance(catalog, list):
        raise ValueError("APP_CATALOG export must be a list.")

    records = load_existing_records(args.existing_metadata_path)
    packages = missing_official_icon_packages(catalog, records, args.packages, args.limit)
    errors: dict[str, str] = {}

    for package_name in packages:
        try:
            record = scrape_first_available(
                package_name,
                args.store,
                args.timeout_seconds,
                args.user_agent,
                args.embed_icons,
            )
            records[package_name] = {
                key: value for key, value in asdict(record).items() if value is not None
            }
            print(f"official icon: {package_name} ({record.store})")
        except AppStoreScrapeError as exc:
            errors[package_name] = str(exc)
            print(f"official icon failed: {package_name}: {exc}", file=sys.stderr)
            if not args.allow_partial:
                raise

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(render_output(records), encoding="utf-8")
    args.errors_path.parent.mkdir(parents=True, exist_ok=True)
    args.errors_path.write_text(json.dumps(errors, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} metadata records to {args.output_path}")
    print(f"Wrote {len(errors)} official icon failures to {args.errors_path}")
    if errors and not args.allow_partial:
        raise RuntimeError(f"Official icon enrichment failed for {len(errors)} package(s).")


if __name__ == "__main__":
    main()

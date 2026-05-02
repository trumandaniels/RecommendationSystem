from __future__ import annotations

import argparse
import base64
import html
import json
import re
import sqlite3
import time
from dataclasses import asdict, dataclass, replace
from datetime import UTC, datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Literal
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


DEFAULT_OUTPUT_PATH = Path(".runtime/app-store-metadata.json")
DEFAULT_DB_PATH = Path("data/myket.db")
DEFAULT_TIMEOUT_SECONDS = 20
DEFAULT_DELAY_SECONDS = 0.75
DEFAULT_USER_AGENT = (
    "RecommendationSystem metadata scraper "
    "(local portfolio enrichment; contact: repository owner)"
)

StoreId = Literal["myket", "google-play"]


class AppStoreScrapeError(RuntimeError):
    """Raised when a package cannot be enriched from the requested store."""


@dataclass(frozen=True)
class AppStoreMetadata:
    package_name: str
    store: StoreId
    source_url: str
    icon_url: str
    short_description: str
    long_description: str | None = None


@dataclass(frozen=True)
class StoredAppStoreMetadata:
    metadata: AppStoreMetadata
    icon_content_type: str
    icon_bytes: bytes
    scraped_at: str


class HeadMetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta_tags: list[dict[str, str]] = []
        self.json_ld_blocks: list[str] = []
        self._inside_json_ld = False
        self._json_ld_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        normalized_attrs = {name.lower(): value or "" for name, value in attrs}
        if tag.lower() == "meta":
            self.meta_tags.append(normalized_attrs)
            return

        if tag.lower() != "script":
            return

        script_type = normalized_attrs.get("type", "").lower()
        if script_type == "application/ld+json":
            self._inside_json_ld = True
            self._json_ld_parts = []

    def handle_data(self, data: str) -> None:
        if self._inside_json_ld:
            self._json_ld_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "script" and self._inside_json_ld:
            self.json_ld_blocks.append("".join(self._json_ld_parts).strip())
            self._inside_json_ld = False
            self._json_ld_parts = []


class FragmentTextParser(HTMLParser):
    BLOCK_TAGS = {"br", "div", "h1", "h2", "h3", "li", "p", "ul"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "br":
            self.parts.append("\n")
        elif tag.lower() == "li":
            self.parts.append("\n- ")

    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self.parts.append(text)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in self.BLOCK_TAGS:
            self.parts.append("\n")

    def text(self) -> str:
        return clean_long_text(" ".join(self.parts))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape app icon URLs and short descriptions from public app-store pages.",
    )
    parser.add_argument(
        "packages",
        nargs="*",
        help="Android package ids to enrich, such as com.instagram.android.",
    )
    parser.add_argument(
        "--packages-file",
        type=Path,
        help="Optional newline-delimited package id file. Blank lines and # comments are ignored.",
    )
    parser.add_argument(
        "--store",
        choices=("myket", "google-play"),
        default="myket",
        help="Store to scrape. Default: myket.",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help=f"JSON output path. Default: {DEFAULT_OUTPUT_PATH}",
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        help=(
            "Optional SQLite database path for storing scraped metadata and icon bytes. "
            f"Use {DEFAULT_DB_PATH} for the local Myket demo database."
        ),
    )
    parser.add_argument(
        "--delay-seconds",
        type=float,
        default=DEFAULT_DELAY_SECONDS,
        help=f"Delay between requests. Default: {DEFAULT_DELAY_SECONDS}",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=DEFAULT_TIMEOUT_SECONDS,
        help=f"HTTP timeout per request. Default: {DEFAULT_TIMEOUT_SECONDS}",
    )
    parser.add_argument(
        "--user-agent",
        default=DEFAULT_USER_AGENT,
        help="HTTP User-Agent header for store requests.",
    )
    parser.add_argument(
        "--embed-icons",
        action="store_true",
        help="Download each icon and replace icon_url with a data URL in the output JSON.",
    )
    args = parser.parse_args()

    if args.delay_seconds < 0:
        raise ValueError("--delay-seconds must be non-negative.")
    if args.timeout_seconds <= 0:
        raise ValueError("--timeout-seconds must be greater than zero.")
    if args.db_path is not None and not args.db_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {args.db_path}")

    packages = parse_package_inputs(args.packages, args.packages_file)
    if not packages:
        raise ValueError("Provide at least one package id or --packages-file.")
    args.packages = packages
    return args


def parse_package_inputs(packages: Iterable[str], packages_file: Path | None) -> list[str]:
    parsed: list[str] = []

    for package_name in packages:
        package_name = package_name.strip()
        if package_name:
            parsed.append(package_name)

    if packages_file is not None:
        if not packages_file.exists():
            raise FileNotFoundError(f"Package file not found: {packages_file}")
        for line_number, line in enumerate(packages_file.read_text(encoding="utf-8").splitlines(), start=1):
            package_name = line.strip()
            if not package_name or package_name.startswith("#"):
                continue
            if "," in package_name:
                package_name = package_name.split(",", 1)[0].strip()
            if not package_name:
                raise ValueError(f"Empty package id parsed from {packages_file}:{line_number}")
            parsed.append(package_name)

    return list(dict.fromkeys(parsed))


def build_source_url(package_name: str, store: StoreId) -> str:
    encoded_package = quote(package_name, safe=".")
    if store == "myket":
        return f"https://myket.ir/app/{encoded_package}"
    if store == "google-play":
        return f"https://play.google.com/store/apps/details?id={encoded_package}&hl=en_US"
    raise ValueError(f"Unsupported store: {store}")


def fetch_html(source_url: str, timeout_seconds: float, user_agent: str) -> str:
    request = Request(
        source_url,
        headers={
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
            "User-Agent": user_agent,
        },
    )
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            content_type = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(content_type)
    except HTTPError as exc:
        raise AppStoreScrapeError(f"HTTP {exc.code} while fetching {source_url}") from exc
    except URLError as exc:
        raise AppStoreScrapeError(f"Network error while fetching {source_url}: {exc.reason}") from exc
    except TimeoutError as exc:
        raise AppStoreScrapeError(f"Timed out while fetching {source_url}") from exc


def fetch_bytes(source_url: str, timeout_seconds: float, user_agent: str) -> tuple[bytes, str]:
    request = Request(
        source_url,
        headers={
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "User-Agent": user_agent,
        },
    )
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            content_type = response.headers.get_content_type() or "application/octet-stream"
            return response.read(), content_type
    except HTTPError as exc:
        raise AppStoreScrapeError(f"HTTP {exc.code} while fetching icon {source_url}") from exc
    except URLError as exc:
        raise AppStoreScrapeError(f"Network error while fetching icon {source_url}: {exc.reason}") from exc
    except TimeoutError as exc:
        raise AppStoreScrapeError(f"Timed out while fetching icon {source_url}") from exc


def embed_icon(record: AppStoreMetadata, timeout_seconds: float, user_agent: str) -> AppStoreMetadata:
    icon_bytes, content_type = fetch_bytes(record.icon_url, timeout_seconds, user_agent)
    if not icon_bytes:
        raise AppStoreScrapeError(f"Icon response was empty for {record.package_name}.")
    encoded_icon = base64.b64encode(icon_bytes).decode("ascii")
    return replace(record, icon_url=f"data:{content_type};base64,{encoded_icon}")


def build_stored_metadata(
    record: AppStoreMetadata,
    timeout_seconds: float,
    user_agent: str,
    scraped_at: str,
) -> StoredAppStoreMetadata:
    icon_bytes, content_type = fetch_bytes(record.icon_url, timeout_seconds, user_agent)
    if not icon_bytes:
        raise AppStoreScrapeError(f"Icon response was empty for {record.package_name}.")
    return StoredAppStoreMetadata(
        metadata=record,
        icon_content_type=content_type,
        icon_bytes=icon_bytes,
        scraped_at=scraped_at,
    )


def ensure_app_store_metadata_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS app_store_metadata (
            app_name TEXT PRIMARY KEY,
            store TEXT NOT NULL,
            source_url TEXT NOT NULL,
            icon_url TEXT NOT NULL,
            icon_content_type TEXT NOT NULL,
            icon_bytes BLOB NOT NULL,
            short_description TEXT NOT NULL,
            long_description TEXT,
            scraped_at TEXT NOT NULL
        );
        """,
    )
    conn.commit()


def store_metadata_records(db_path: Path, records: list[StoredAppStoreMetadata]) -> None:
    with sqlite3.connect(db_path) as conn:
        ensure_app_store_metadata_table(conn)
        conn.executemany(
            """
            INSERT INTO app_store_metadata (
                app_name,
                store,
                source_url,
                icon_url,
                icon_content_type,
                icon_bytes,
                short_description,
                long_description,
                scraped_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(app_name) DO UPDATE SET
                store = excluded.store,
                source_url = excluded.source_url,
                icon_url = excluded.icon_url,
                icon_content_type = excluded.icon_content_type,
                icon_bytes = excluded.icon_bytes,
                short_description = excluded.short_description,
                long_description = excluded.long_description,
                scraped_at = excluded.scraped_at
            """,
            [
                (
                    record.metadata.package_name,
                    record.metadata.store,
                    record.metadata.source_url,
                    record.metadata.icon_url,
                    record.icon_content_type,
                    record.icon_bytes,
                    record.metadata.short_description,
                    record.metadata.long_description,
                    record.scraped_at,
                )
                for record in records
            ],
        )
        conn.commit()


def parse_metadata(
    package_name: str,
    store: StoreId,
    source_url: str,
    html_text: str,
) -> AppStoreMetadata:
    parser = HeadMetadataParser()
    parser.feed(html_text)

    icon_url = first_non_empty(
        meta_content(parser.meta_tags, property_name="og:image"),
        meta_content(parser.meta_tags, name="twitter:image"),
    )
    if not icon_url:
        icon_url = software_application_value(parser.json_ld_blocks, "image")

    short_description = first_non_empty(
        meta_content(parser.meta_tags, property_name="og:description"),
        meta_content(parser.meta_tags, name="description"),
        meta_content(parser.meta_tags, name="twitter:description"),
    )
    if not short_description:
        short_description = software_application_value(parser.json_ld_blocks, "description")

    if not icon_url:
        raise AppStoreScrapeError(f"{store} page did not expose an icon URL for {package_name}.")
    if not short_description:
        raise AppStoreScrapeError(
            f"{store} page did not expose a short description for {package_name}.",
        )

    long_description = extract_long_description(html_text, store, short_description)

    return AppStoreMetadata(
        package_name=package_name,
        store=store,
        source_url=source_url,
        icon_url=icon_url,
        short_description=short_description,
        long_description=long_description,
    )


def meta_content(
    meta_tags: list[dict[str, str]],
    *,
    property_name: str | None = None,
    name: str | None = None,
) -> str | None:
    for tag in meta_tags:
        if property_name is not None and tag.get("property") == property_name:
            return clean_text(tag.get("content", ""))
        if name is not None and tag.get("name") == name:
            return clean_text(tag.get("content", ""))
    return None


def software_application_value(json_ld_blocks: list[str], key: str) -> str | None:
    for block in json_ld_blocks:
        if not block:
            continue
        try:
            payload = json.loads(block)
        except json.JSONDecodeError as exc:
            raise AppStoreScrapeError("App store page exposed invalid JSON-LD metadata.") from exc

        for node in iter_json_ld_nodes(payload):
            node_type = node.get("@type")
            node_types = node_type if isinstance(node_type, list) else [node_type]
            if "SoftwareApplication" not in node_types:
                continue
            value = node.get(key)
            if isinstance(value, str):
                return clean_text(value)
    return None


def iter_json_ld_nodes(payload: object) -> Iterable[dict[str, object]]:
    if isinstance(payload, dict):
        graph = payload.get("@graph")
        if isinstance(graph, list):
            for node in graph:
                if isinstance(node, dict):
                    yield node
        yield payload
    elif isinstance(payload, list):
        for node in payload:
            if isinstance(node, dict):
                yield from iter_json_ld_nodes(node)


def first_non_empty(*values: str | None) -> str | None:
    for value in values:
        if value:
            return value
    return None


def clean_text(value: str) -> str:
    return " ".join(value.split())


def clean_long_text(value: str) -> str:
    lines = [" ".join(line.split()) for line in value.splitlines()]
    return "\n".join(line for line in lines if line)


def fragment_to_text(fragment: str) -> str:
    parser = FragmentTextParser()
    parser.feed(html.unescape(fragment))
    return parser.text()


def extract_long_description(
    html_text: str,
    store: StoreId,
    short_description: str,
) -> str | None:
    if store == "google-play":
        match = re.search(
            r'<div class="bARER" data-g-id="description">(.*?)</div><div class="TKjAsc">',
            html_text,
            flags=re.DOTALL,
        )
    else:
        match = re.search(
            r'<div class="description-wrapper">(.*?)</div></section><div class="left-section banner-wrapper"',
            html_text,
            flags=re.DOTALL,
        )

    if not match:
        return None

    fragment = match.group(1)
    fragment = re.sub(r'<div class="video-wrapper".*?</div>', " ", fragment, flags=re.DOTALL)
    if store == "myket":
        fragment = fragment.split('<p class="faq-header">', 1)[0]

    long_description = fragment_to_text(fragment)
    if len(long_description) <= len(short_description) + 40:
        return None
    return long_description


def scrape_package(
    package_name: str,
    store: StoreId,
    timeout_seconds: float,
    user_agent: str,
) -> AppStoreMetadata:
    source_url = build_source_url(package_name, store)
    html_text = fetch_html(source_url, timeout_seconds, user_agent)
    return parse_metadata(package_name, store, source_url, html_text)


def render_output(store: StoreId, records: list[AppStoreMetadata]) -> str:
    payload = {
        "generatedAt": datetime.now(UTC).isoformat(timespec="seconds"),
        "store": store,
        "apps": [
            {key: value for key, value in asdict(record).items() if value is not None}
            for record in records
        ],
    }
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def main() -> None:
    args = parse_args()

    records: list[AppStoreMetadata] = []
    stored_records: list[StoredAppStoreMetadata] = []
    scraped_at = datetime.now(UTC).isoformat(timespec="seconds")
    for index, package_name in enumerate(args.packages):
        if index > 0 and args.delay_seconds > 0:
            time.sleep(args.delay_seconds)
        record = scrape_package(
            package_name=package_name,
            store=args.store,
            timeout_seconds=args.timeout_seconds,
            user_agent=args.user_agent,
        )
        stored_record = None
        if args.db_path is not None:
            stored_record = build_stored_metadata(
                record,
                args.timeout_seconds,
                args.user_agent,
                scraped_at,
            )
            stored_records.append(stored_record)

        if args.embed_icons and stored_record is not None:
            encoded_icon = base64.b64encode(stored_record.icon_bytes).decode("ascii")
            record = replace(
                record,
                icon_url=f"data:{stored_record.icon_content_type};base64,{encoded_icon}",
            )
        elif args.embed_icons:
            record = embed_icon(record, args.timeout_seconds, args.user_agent)
        records.append(record)

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(render_output(args.store, records), encoding="utf-8")
    print(f"Wrote {len(records)} app metadata records to {args.output_path}")
    if args.db_path is not None:
        store_metadata_records(args.db_path, stored_records)
        print(f"Stored {len(stored_records)} app metadata records in {args.db_path}")


if __name__ == "__main__":
    main()

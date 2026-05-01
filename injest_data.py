import argparse
import csv
import sqlite3
from pathlib import Path


DATA_DIR = Path("data")
DEFAULT_SOURCE_DIR = DATA_DIR / "myket-android-application-market-dataset"
DEFAULT_INTERACTIONS_PATH = DEFAULT_SOURCE_DIR / "myket.csv"
DEFAULT_APP_INFO_PATH = DEFAULT_SOURCE_DIR / "app_info_sample.csv"
DEFAULT_CATEGORIES_PATH = DEFAULT_SOURCE_DIR / "categories.csv"
DEFAULT_DB_PATH = DATA_DIR / "myket.db"
DEFAULT_BATCH_SIZE = 10_000

INTERACTION_COLUMNS = (
    "user_id",
    "app_name",
    "timestamp",
    "state_label",
    "comma_separated_list_of_features",
)
APP_COLUMNS = ("app_name", "installs", "rating", "rating_count", "category_fa", "category_en")
CATEGORY_COLUMNS = ("category_fa", "category_en")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ingest the Myket Android app install dataset into a local SQLite database.",
    )
    parser.add_argument(
        "--interactions-path",
        type=Path,
        default=DEFAULT_INTERACTIONS_PATH,
        help=f"Myket interaction CSV path. Default: {DEFAULT_INTERACTIONS_PATH}",
    )
    parser.add_argument(
        "--app-info-path",
        type=Path,
        default=DEFAULT_APP_INFO_PATH,
        help=f"Myket app metadata CSV path. Default: {DEFAULT_APP_INFO_PATH}",
    )
    parser.add_argument(
        "--categories-path",
        type=Path,
        default=DEFAULT_CATEGORIES_PATH,
        help=f"Myket category CSV path. Default: {DEFAULT_CATEGORIES_PATH}",
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=DEFAULT_DB_PATH,
        help=f"SQLite output path. Default: {DEFAULT_DB_PATH}",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f"Rows to insert per batch. Default: {DEFAULT_BATCH_SIZE}",
    )
    parser.add_argument(
        "--max-rows",
        type=int,
        default=None,
        help="Optional interaction row limit for smoke tests.",
    )
    parser.add_argument(
        "--replace-db",
        action="store_true",
        help="Delete an existing SQLite database before ingesting.",
    )

    args = parser.parse_args()
    for path in (args.interactions_path, args.app_info_path, args.categories_path):
        if not path.exists():
            raise FileNotFoundError(f"Myket input file not found: {path}")
    if args.batch_size <= 0:
        raise ValueError("--batch-size must be greater than 0.")
    if args.max_rows is not None and args.max_rows <= 0:
        raise ValueError("--max-rows must be greater than 0 when provided.")
    if args.db_path.exists() and not args.replace_db:
        raise FileExistsError(
            f"Database already exists at {args.db_path}. Re-run with --replace-db to rebuild it.",
        )
    return args


def ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def recreate_database(path: Path) -> None:
    if path.exists():
        path.unlink()


def require_header(actual: list[str] | None, expected: tuple[str, ...], path: Path) -> None:
    if actual != list(expected):
        raise ValueError(f"Unexpected header in {path}: expected {list(expected)}, got {actual}")


def parse_optional_float(raw: str) -> float | None:
    cleaned = raw.strip()
    if not cleaned:
        return None
    return float(cleaned)


def parse_optional_int(raw: str) -> int | None:
    cleaned = raw.strip()
    if not cleaned:
        return None
    return int(cleaned)


def create_tables(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE apps (
            app_name TEXT PRIMARY KEY,
            installs REAL,
            rating REAL,
            rating_count INTEGER,
            category_fa TEXT,
            category_en TEXT
        );
        """,
    )
    cur.execute(
        """
        CREATE TABLE categories (
            category_fa TEXT PRIMARY KEY,
            category_en TEXT NOT NULL
        );
        """,
    )
    cur.execute(
        """
        CREATE TABLE installs (
            user_id TEXT NOT NULL,
            app_name TEXT NOT NULL,
            timestamp REAL NOT NULL,
            state_label INTEGER NOT NULL
        );
        """,
    )
    cur.execute("CREATE INDEX idx_installs_user_time ON installs(user_id, timestamp);")
    cur.execute("CREATE INDEX idx_installs_app_name ON installs(app_name);")
    cur.execute("CREATE INDEX idx_installs_timestamp ON installs(timestamp);")
    conn.commit()


def ingest_categories(path: Path, conn: sqlite3.Connection) -> int:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        require_header(reader.fieldnames, CATEGORY_COLUMNS, path)
        rows = [(row["category_fa"], row["category_en"]) for row in reader]

    conn.executemany(
        "INSERT INTO categories (category_fa, category_en) VALUES (?, ?)",
        rows,
    )
    return len(rows)


def ingest_apps(path: Path, conn: sqlite3.Connection) -> int:
    rows: list[tuple[str, float | None, float | None, int | None, str, str]] = []
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        require_header(reader.fieldnames, APP_COLUMNS, path)
        for row in reader:
            rows.append(
                (
                    row["app_name"],
                    parse_optional_float(row["installs"]),
                    parse_optional_float(row["rating"]),
                    parse_optional_int(row["rating_count"]),
                    row["category_fa"],
                    row["category_en"],
                ),
            )

    conn.executemany(
        """
        INSERT INTO apps (
            app_name,
            installs,
            rating,
            rating_count,
            category_fa,
            category_en
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    return len(rows)


def flush_install_batch(conn: sqlite3.Connection, rows: list[tuple[str, str, float, int]]) -> None:
    conn.executemany(
        """
        INSERT INTO installs (
            user_id,
            app_name,
            timestamp,
            state_label
        ) VALUES (?, ?, ?, ?)
        """,
        rows,
    )


def ingest_installs(path: Path, conn: sqlite3.Connection, batch_size: int, max_rows: int | None) -> int:
    rows_written = 0
    batch: list[tuple[str, str, float, int]] = []

    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        header = next(reader, None)
        require_header(header, INTERACTION_COLUMNS, path)

        for raw_row in reader:
            if len(raw_row) < 4:
                raise ValueError(f"Interaction row has fewer than 4 columns in {path}: {raw_row}")
            batch.append((raw_row[0], raw_row[1], float(raw_row[2]), int(raw_row[3])))
            rows_written += 1

            if len(batch) >= batch_size:
                flush_install_batch(conn, batch)
                conn.commit()
                batch.clear()
                print(f"Inserted {rows_written:,} installs so far.")

            if max_rows is not None and rows_written >= max_rows:
                break

    if batch:
        flush_install_batch(conn, batch)
        conn.commit()

    return rows_written


def main() -> None:
    args = parse_args()
    ensure_parent_dir(args.db_path)
    recreate_database(args.db_path)

    with sqlite3.connect(args.db_path) as conn:
        create_tables(conn)
        category_count = ingest_categories(args.categories_path, conn)
        app_count = ingest_apps(args.app_info_path, conn)
        install_count = ingest_installs(args.interactions_path, conn, args.batch_size, args.max_rows)

    print(f"Interaction file: {args.interactions_path}")
    print(f"App metadata file: {args.app_info_path}")
    print(f"Category file: {args.categories_path}")
    print(f"SQLite database: {args.db_path}")
    print(f"Categories written: {category_count:,}")
    print(f"Apps written: {app_count:,}")
    print(f"Install interactions written: {install_count:,}")


if __name__ == "__main__":
    main()

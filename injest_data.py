import argparse
import sqlite3
from pathlib import Path

import pandas as pd

DATA_DIR = Path("data")
DEFAULT_INPUT_PATH = DATA_DIR / "2019-Oct.csv"
DEFAULT_DB_PATH = DATA_DIR / "ecommerce.db"
DEFAULT_CHUNK_SIZE = 100_000

RAW_EVENT_COLUMNS = [
    "event_time",
    "event_type",
    "product_id",
    "category_id",
    "category_code",
    "brand",
    "price",
    "user_id",
    "user_session",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ingest a single Kaggle ecommerce CSV into a local SQLite database.",
    )
    parser.add_argument(
        "--input-path",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help=f"Path to a single extracted Kaggle CSV. Default: {DEFAULT_INPUT_PATH}",
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=DEFAULT_DB_PATH,
        help=f"SQLite output path. Default: {DEFAULT_DB_PATH}",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=DEFAULT_CHUNK_SIZE,
        help=f"Rows to process per chunk. Default: {DEFAULT_CHUNK_SIZE}",
    )
    parser.add_argument(
        "--max-chunks",
        type=int,
        default=None,
        help="Optional limit for smoke tests.",
    )
    parser.add_argument(
        "--replace-db",
        action="store_true",
        help="Delete an existing SQLite database before ingesting.",
    )

    args = parser.parse_args()
    if not args.input_path.exists():
        raise FileNotFoundError(
            f"Input CSV not found: {args.input_path}. Extract the Kaggle archive into data/ first.",
        )
    if args.chunk_size <= 0:
        raise ValueError("--chunk-size must be greater than 0.")
    if args.max_chunks is not None and args.max_chunks <= 0:
        raise ValueError("--max-chunks must be greater than 0 when provided.")
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


def create_tables(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE products (
            product_id TEXT PRIMARY KEY,
            category_id TEXT,
            category_code TEXT,
            category_main TEXT,
            category_sub TEXT,
            category_sub2 TEXT,
            brand TEXT,
            price REAL
        );
        """,
    )
    cur.execute(
        """
        CREATE TABLE events (
            event_time TEXT NOT NULL,
            event_type TEXT NOT NULL,
            product_id TEXT NOT NULL,
            category_id TEXT,
            category_code TEXT,
            brand TEXT,
            price REAL,
            user_id TEXT NOT NULL,
            user_session TEXT
        );
        """,
    )
    cur.execute("CREATE INDEX idx_events_user_id ON events(user_id);")
    cur.execute("CREATE INDEX idx_events_product_id ON events(product_id);")
    cur.execute("CREATE INDEX idx_events_event_time ON events(event_time);")
    conn.commit()


def enrich_categories(chunk: pd.DataFrame) -> pd.DataFrame:
    enriched = chunk.copy()
    category_parts = enriched["category_code"].fillna("").str.split(".", n=2, expand=True)
    enriched["category_main"] = category_parts[0].replace("", pd.NA)
    enriched["category_sub"] = category_parts[1].replace("", pd.NA)
    enriched["category_sub2"] = category_parts[2].replace("", pd.NA)
    return enriched


def write_products(chunk: pd.DataFrame, conn: sqlite3.Connection) -> int:
    product_frame = chunk[
        [
            "product_id",
            "category_id",
            "category_code",
            "category_main",
            "category_sub",
            "category_sub2",
            "brand",
            "price",
        ]
    ].drop_duplicates(subset=["product_id"])
    product_rows = product_frame.where(pd.notna(product_frame), None)

    conn.executemany(
        """
        INSERT OR IGNORE INTO products (
            product_id,
            category_id,
            category_code,
            category_main,
            category_sub,
            category_sub2,
            brand,
            price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        list(product_rows.itertuples(index=False, name=None)),
    )
    return len(product_rows)


def write_events(chunk: pd.DataFrame, conn: sqlite3.Connection) -> int:
    event_frame = chunk[RAW_EVENT_COLUMNS]
    event_rows = event_frame.where(pd.notna(event_frame), None)
    event_rows.to_sql("events", conn, if_exists="append", index=False)
    return len(event_rows)


def ingest_csv(
    input_path: Path,
    db_path: Path,
    chunk_size: int,
    max_chunks: int | None,
) -> tuple[int, int, int]:
    rows_written = 0
    product_rows_seen = 0
    chunks_processed = 0

    with sqlite3.connect(db_path) as conn:
        create_tables(conn)
        reader = pd.read_csv(input_path, chunksize=chunk_size, low_memory=False)
        for chunk in reader:
            enriched_chunk = enrich_categories(chunk)
            product_rows_seen += write_products(enriched_chunk, conn)
            rows_written += write_events(enriched_chunk, conn)
            conn.commit()

            chunks_processed += 1
            print(
                f"Processed chunk {chunks_processed}: "
                f"{rows_written:,} events written so far.",
            )

            if max_chunks is not None and chunks_processed >= max_chunks:
                break

    return rows_written, product_rows_seen, chunks_processed


def main() -> None:
    args = parse_args()
    ensure_parent_dir(args.db_path)
    recreate_database(args.db_path)

    rows_written, product_rows_seen, chunks_processed = ingest_csv(
        input_path=args.input_path,
        db_path=args.db_path,
        chunk_size=args.chunk_size,
        max_chunks=args.max_chunks,
    )

    print(f"Input file: {args.input_path}")
    print(f"SQLite database: {args.db_path}")
    print(f"Chunks processed: {chunks_processed}")
    print(f"Event rows written: {rows_written:,}")
    print(f"Distinct product rows attempted: {product_rows_seen:,}")


if __name__ == "__main__":
    main()

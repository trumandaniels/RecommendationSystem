import pandas as pd
import sqlite3
import os
from pathlib import Path

data_dir = Path('data')

files = [
    data_dir / '2019-Oct.csv.gz',
    data_dir / '2019-Nov.csv.gz',
    data_dir / '2019-Dec.csv.gz',
    data_dir / '2020-Jan.csv.gz',
    data_dir / '2020-Feb.csv.gz',
    data_dir / '2020-Mar.csv.gz',
    data_dir / '2020-Apr.csv.gz',
    data_dir / '2020-May.csv.gz',
]

db_path = data_dir / 'ecommerce.db'

df = pd.read_csv(files[0], compression='gzip', low_memory=False)

print(df.groupby('product_id')['price'].nunique().head(20))

def create_tables(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        product_id TEXT PRIMARY KEY,
        category_main TEXT,
        category_sub TEXT,
        category_sub2 TEXT,
        brand TEXT,
        price REAL
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS events (
        event_id TEXT,
        event_timestamp TEXT,
        user_id TEXT,
        product_id TEXT,
        price REAL,
        category_main TEXT,
        category_sub TEXT,
        brand TEXT,
    );
    """)
    conn.commit()

def process_chunk(chunk: pd.DataFrame, conn: sqlite3.Connection):
    # 1) Split "category" into 3 levels: main, sub1, sub2
    cats = chunk["category"].str.split(r"\.", n=2, expand=True)
    chunk["category_main"] = cats[0]
    chunk["category_sub"]  = cats[1]
    chunk["category_sub2"] = cats[2]

    # 2) Extract products and upsert
    prods = chunk[
        ["product_id", "category_main", "category_sub", "category_sub2", "brand", "price"]
    ].drop_duplicates(subset=["product_id"])

    # Insert-or-ignore into products table
    ps = [
        (
            row.product_id,
            row.category_main,
            row.category_sub,
            row.category_sub2,
            row.brand,
            float(row.price),
        )
        for row in prods.itertuples(index=False)
    ]
    conn.executemany(
        """
        INSERT OR IGNORE INTO products
        (product_id, category_main, category_sub, category_sub2, brand, price)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ps
    )

    ev = chunk["event_id", "event_time", "user_id", "product_id", "event_type"]
    ev.to_sql("events", conn, if_exists="append", index=False)

    # commit per chunk
    conn.commit()

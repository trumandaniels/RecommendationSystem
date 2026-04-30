import argparse
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Iterable
from urllib.parse import quote


DEFAULT_DB_PATH = Path("data/ecommerce.db")
DEFAULT_OUTPUT_PATH = Path("frontend/src/app/demoData.generated.ts")
PURCHASE_EVENT = "purchase"
MODEL_IDS = ("popularity", "item_item")
GRADIENTS = [
    ("#0f172a", "#1d4ed8"),
    ("#164e63", "#0891b2"),
    ("#14532d", "#16a34a"),
    ("#7c2d12", "#ea580c"),
    ("#581c87", "#c026d3"),
    ("#312e81", "#6366f1"),
    ("#3f3f46", "#71717a"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export real popularity and item-item demo data from SQLite into the frontend.",
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=DEFAULT_DB_PATH,
        help=f"SQLite input path. Default: {DEFAULT_DB_PATH}",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help=f"TypeScript output path. Default: {DEFAULT_OUTPUT_PATH}",
    )
    args = parser.parse_args()

    if not args.db_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {args.db_path}")

    return args


def title_case(raw: str | None, fallback: str) -> str:
    if raw is None:
        return fallback
    cleaned = raw.replace("_", " ").replace("-", " ").strip()
    if not cleaned:
        return fallback
    return cleaned.title()


def category_label(category_code: str | None) -> str:
    if not category_code:
        return "Unknown category"
    return " / ".join(title_case(part, "Unknown") for part in category_code.split("."))


def category_leaf(category_code: str | None) -> str:
    if not category_code:
        return "Product"
    return title_case(category_code.split(".")[-1], "Product")


def brand_label(brand: str | None) -> str:
    return title_case(brand, "Unknown Brand")


def format_price(price: float | None) -> str:
    if price is None:
        return "Unknown"
    return f"${price:,.2f}"


def format_count(value: int) -> str:
    return f"{value:,}"


def format_event_time(event_time: str) -> str:
    parsed = datetime.strptime(event_time, "%Y-%m-%d %H:%M:%S UTC")
    return parsed.strftime("%H:%M UTC")


def build_product_title(product_id: str, brand: str | None, category_code: str | None) -> str:
    return f"{brand_label(brand)} {category_leaf(category_code)} #{product_id}"


def gradient_for_product(product_id: str) -> tuple[str, str]:
    seed = sum(ord(char) for char in product_id)
    return GRADIENTS[seed % len(GRADIENTS)]


def build_product_image(product_id: str, brand: str | None, category_code: str | None, price: float | None) -> str:
    start, end = gradient_for_product(product_id)
    lines = [
        brand_label(brand).upper()[:18],
        category_leaf(category_code).upper()[:18],
        f"ID {product_id}"[:20],
        format_price(price),
    ]
    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{start}" />
      <stop offset="100%" stop-color="{end}" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="32" fill="url(#g)" />
  <rect x="20" y="20" width="280" height="280" rx="24" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
  <text x="36" y="92" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">{lines[0]}</text>
  <text x="36" y="128" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#e2e8f0">{lines[1]}</text>
  <text x="36" y="220" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">{lines[2]}</text>
  <text x="36" y="258" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#dbeafe">{lines[3]}</text>
</svg>
""".strip()
    return f"data:image/svg+xml,{quote(svg)}"


def fetch_rows(conn: sqlite3.Connection, query: str, params: Iterable[object] = ()) -> list[sqlite3.Row]:
    cur = conn.execute(query, tuple(params))
    return cur.fetchall()


def select_demo_session_id(conn: sqlite3.Connection) -> str:
    queries = [
        """
        WITH session_stats AS (
            SELECT
                e.user_session,
                COUNT(DISTINCT e.product_id) AS distinct_items,
                COUNT(
                    DISTINCT CASE
                        WHEN p.category_code LIKE 'electronics.%'
                         AND p.brand IS NOT NULL
                         AND p.price IS NOT NULL
                        THEN e.product_id
                    END
                ) AS usable_items
            FROM events e
            JOIN products p ON p.product_id = e.product_id
            WHERE e.event_type = ?
              AND e.user_session IS NOT NULL
            GROUP BY e.user_session
        )
        SELECT user_session
        FROM session_stats
        WHERE distinct_items = 4
          AND distinct_items = usable_items
        ORDER BY user_session ASC
        LIMIT 1
        """,
        """
        WITH session_stats AS (
            SELECT
                e.user_session,
                COUNT(DISTINCT e.product_id) AS distinct_items,
                COUNT(
                    DISTINCT CASE
                        WHEN p.category_code LIKE 'electronics.%'
                         AND p.brand IS NOT NULL
                         AND p.price IS NOT NULL
                        THEN e.product_id
                    END
                ) AS usable_items
            FROM events e
            JOIN products p ON p.product_id = e.product_id
            WHERE e.event_type = ?
              AND e.user_session IS NOT NULL
            GROUP BY e.user_session
        )
        SELECT user_session
        FROM session_stats
        WHERE distinct_items BETWEEN 3 AND 5
          AND distinct_items = usable_items
        ORDER BY distinct_items DESC, user_session ASC
        LIMIT 1
        """,
    ]

    for query in queries:
        rows = fetch_rows(conn, query, (PURCHASE_EVENT,))
        if rows:
            return str(rows[0]["user_session"])

    raise RuntimeError("Could not find a purchase session with enough usable metadata for the demo.")


def fetch_purchase_counts(conn: sqlite3.Connection, product_ids: list[str]) -> dict[str, int]:
    if not product_ids:
        return {}

    placeholders = ", ".join("?" for _ in product_ids)
    rows = fetch_rows(
        conn,
        f"""
        SELECT product_id, COUNT(*) AS purchase_volume
        FROM events
        WHERE event_type = ?
          AND product_id IN ({placeholders})
        GROUP BY product_id
        """,
        (PURCHASE_EVENT, *product_ids),
    )
    return {str(row["product_id"]): int(row["purchase_volume"]) for row in rows}


def fetch_product_metadata(conn: sqlite3.Connection, product_ids: list[str]) -> dict[str, dict[str, object]]:
    if not product_ids:
        return {}

    placeholders = ", ".join("?" for _ in product_ids)
    rows = fetch_rows(
        conn,
        f"""
        SELECT product_id, brand, category_code, price
        FROM products
        WHERE product_id IN ({placeholders})
        """,
        product_ids,
    )
    return {
        str(row["product_id"]): {
            "product_id": str(row["product_id"]),
            "brand": row["brand"],
            "category_code": row["category_code"],
            "price": float(row["price"]) if row["price"] is not None else None,
        }
        for row in rows
    }


def fetch_session_items(conn: sqlite3.Connection, session_id: str) -> list[dict[str, object]]:
    rows = fetch_rows(
        conn,
        """
        SELECT
            e.product_id,
            MIN(e.event_time) AS first_event_time,
            p.brand,
            p.category_code,
            p.price
        FROM events e
        JOIN products p ON p.product_id = e.product_id
        WHERE e.event_type = ?
          AND e.user_session = ?
        GROUP BY e.product_id, p.brand, p.category_code, p.price
        ORDER BY first_event_time ASC, e.product_id ASC
        """,
        (PURCHASE_EVENT, session_id),
    )

    session_items: list[dict[str, object]] = []
    for row in rows:
        session_items.append(
            {
                "product_id": str(row["product_id"]),
                "event_time": str(row["first_event_time"]),
                "brand": row["brand"],
                "category_code": row["category_code"],
                "price": float(row["price"]) if row["price"] is not None else None,
            },
        )
    return session_items


def fetch_popularity_candidates(conn: sqlite3.Connection, excluded_ids: list[str], limit: int) -> list[dict[str, int]]:
    placeholders = ", ".join("?" for _ in excluded_ids)
    where_clause = "AND product_id NOT IN (" + placeholders + ")" if excluded_ids else ""
    rows = fetch_rows(
        conn,
        f"""
        SELECT product_id, COUNT(*) AS purchase_volume
        FROM events
        WHERE event_type = ?
          {where_clause}
        GROUP BY product_id
        ORDER BY purchase_volume DESC, product_id ASC
        LIMIT ?
        """,
        (PURCHASE_EVENT, *excluded_ids, limit),
    )
    return [
        {"product_id": str(row["product_id"]), "purchase_volume": int(row["purchase_volume"])}
        for row in rows
    ]


def fetch_item_item_candidates(
    conn: sqlite3.Connection,
    seed_ids: list[str],
    excluded_ids: list[str],
    limit: int,
) -> list[dict[str, int]]:
    values_clause = ", ".join("(?)" for _ in seed_ids)
    excluded_clause = ", ".join("?" for _ in excluded_ids)
    rows = fetch_rows(
        conn,
        f"""
        WITH purchase_items AS (
            SELECT DISTINCT user_session, product_id
            FROM events
            WHERE event_type = ?
              AND user_session IS NOT NULL
        ),
        seed_items(product_id) AS (
            VALUES {values_clause}
        ),
        candidate_pairs AS (
            SELECT
                seed.product_id AS seed_product_id,
                other.product_id AS candidate_product_id,
                seed.user_session
            FROM purchase_items seed
            JOIN purchase_items other
              ON other.user_session = seed.user_session
             AND other.product_id != seed.product_id
            WHERE seed.product_id IN (SELECT product_id FROM seed_items)
              AND other.product_id NOT IN ({excluded_clause})
        )
        SELECT
            candidate_product_id AS product_id,
            COUNT(*) AS pair_sessions,
            COUNT(DISTINCT user_session) AS co_sessions,
            COUNT(DISTINCT seed_product_id) AS matched_seed_items
        FROM candidate_pairs
        GROUP BY candidate_product_id
        ORDER BY co_sessions DESC, matched_seed_items DESC, pair_sessions DESC, candidate_product_id ASC
        LIMIT ?
        """,
        (PURCHASE_EVENT, *seed_ids, *excluded_ids, limit),
    )
    return [
        {
            "product_id": str(row["product_id"]),
            "pair_sessions": int(row["pair_sessions"]),
            "co_sessions": int(row["co_sessions"]),
            "matched_seed_items": int(row["matched_seed_items"]),
        }
        for row in rows
    ]


def category_fit_score(category_code: str | None, session_categories: set[str]) -> int:
    if not category_code:
        return 20
    if category_code in session_categories:
        return 100
    category_main = category_code.split(".", 1)[0]
    if any(existing.split(".", 1)[0] == category_main for existing in session_categories):
        return 70
    return 25


def build_product_detail(
    meta: dict[str, object],
    purchase_volume: int,
    session_role: str,
) -> dict[str, object]:
    product_id = str(meta["product_id"])
    brand = meta["brand"]
    category_code = meta["category_code"]
    price = meta["price"]
    return {
        "id": product_id,
        "title": build_product_title(product_id, brand, category_code),
        "category": category_label(category_code if isinstance(category_code, str) else None),
        "image": build_product_image(product_id, brand if isinstance(brand, str) else None, category_code if isinstance(category_code, str) else None, price if isinstance(price, float) else None),
        "subtitle": (
            f"Recorded as {brand_label(brand if isinstance(brand, str) else None)} in "
            f"{category_label(category_code if isinstance(category_code, str) else None)} "
            f"at a listed price of {format_price(price if isinstance(price, float) else None)}."
        ),
        "description": (
            f"The source dataset does not include product titles or product photos, so this demo labels "
            f"item {product_id} from the recorded brand, category, and price fields. "
            f"Observed purchase volume in the October 2019 extract: {format_count(purchase_volume)}."
        ),
        "attributes": [
            f"Product {product_id}",
            brand_label(brand if isinstance(brand, str) else None),
            category_leaf(category_code if isinstance(category_code, str) else None),
            format_price(price if isinstance(price, float) else None),
        ],
        "facts": [
            {"label": "Purchases", "value": format_count(purchase_volume)},
            {"label": "Brand", "value": brand_label(brand if isinstance(brand, str) else None)},
            {"label": "Category", "value": category_label(category_code if isinstance(category_code, str) else None)},
            {"label": "Session role", "value": session_role},
        ],
    }


def build_history_entry(meta: dict[str, object], event_time: str) -> dict[str, object]:
    product_id = str(meta["product_id"])
    brand = meta["brand"]
    category_code = meta["category_code"]
    price = meta["price"]
    return {
        "id": product_id,
        "title": build_product_title(product_id, brand if isinstance(brand, str) else None, category_code if isinstance(category_code, str) else None),
        "category": category_label(category_code if isinstance(category_code, str) else None),
        "time": format_event_time(event_time),
        "image": build_product_image(product_id, brand if isinstance(brand, str) else None, category_code if isinstance(category_code, str) else None, price if isinstance(price, float) else None),
    }


def build_popularity_recommendations(
    candidates: list[dict[str, int]],
    product_metadata: dict[str, dict[str, object]],
    session_categories: set[str],
    session_brands: set[str],
) -> list[dict[str, object]]:
    top_purchase_volume = max(candidate["purchase_volume"] for candidate in candidates)
    recommendations: list[dict[str, object]] = []

    for candidate in candidates:
        meta = product_metadata[candidate["product_id"]]
        category_code = meta["category_code"] if isinstance(meta["category_code"], str) else None
        brand = meta["brand"] if isinstance(meta["brand"], str) else None
        category_fit = category_fit_score(category_code, session_categories)
        brand_fit = 100 if brand and brand in session_brands else 35
        tags = [{"label": "Top purchases", "type": "popularity"}]
        if category_fit >= 70:
            tags.append({"label": "Same category", "type": "category"})

        recommendations.append(
            {
                "id": candidate["product_id"],
                "title": build_product_title(candidate["product_id"], brand, category_code),
                "image": build_product_image(candidate["product_id"], brand, category_code, meta["price"] if isinstance(meta["price"], float) else None),
                "explanation": (
                    f"Purchased {format_count(candidate['purchase_volume'])} times overall. "
                    f"Brand {brand_label(brand)} appears in {category_label(category_code)} "
                    f"at a listed price of {format_price(meta['price'] if isinstance(meta['price'], float) else None)}."
                ),
                "score": format_count(candidate["purchase_volume"]),
                "scoreLabel": "Purchases",
                "signals": [
                    {
                        "label": "Volume idx",
                        "value": round(candidate["purchase_volume"] / top_purchase_volume * 100),
                        "color": "bg-emerald-500",
                    },
                    {
                        "label": "Category fit",
                        "value": category_fit,
                        "color": "bg-cyan-500" if category_fit >= 70 else "bg-zinc-300",
                    },
                    {
                        "label": "Brand fit",
                        "value": brand_fit,
                        "color": "bg-amber-500" if brand_fit == 100 else "bg-zinc-300",
                    },
                ],
                "tags": tags,
            },
        )

    return recommendations


def build_item_item_recommendations(
    candidates: list[dict[str, int]],
    product_metadata: dict[str, dict[str, object]],
    session_categories: set[str],
    session_size: int,
) -> list[dict[str, object]]:
    top_co_sessions = max(candidate["co_sessions"] for candidate in candidates)
    recommendations: list[dict[str, object]] = []

    for candidate in candidates:
        meta = product_metadata[candidate["product_id"]]
        category_code = meta["category_code"] if isinstance(meta["category_code"], str) else None
        brand = meta["brand"] if isinstance(meta["brand"], str) else None
        category_fit = category_fit_score(category_code, session_categories)
        overlap_ratio = round(candidate["matched_seed_items"] / session_size * 100)
        tags = [
            {
                "label": f"{candidate['matched_seed_items']}/{session_size} seed overlap",
                "type": "coview",
            },
        ]
        if category_fit >= 70:
            tags.append({"label": "Same category", "type": "category"})

        recommendations.append(
            {
                "id": candidate["product_id"],
                "title": build_product_title(candidate["product_id"], brand, category_code),
                "image": build_product_image(candidate["product_id"], brand, category_code, meta["price"] if isinstance(meta["price"], float) else None),
                "explanation": (
                    f"Co-purchased in {format_count(candidate['co_sessions'])} sessions with "
                    f"{candidate['matched_seed_items']} of the {session_size} products in the selected October session."
                ),
                "score": format_count(candidate["co_sessions"]),
                "scoreLabel": "Co-sessions",
                "signals": [
                    {
                        "label": "Co-session idx",
                        "value": round(candidate["co_sessions"] / top_co_sessions * 100),
                        "color": "bg-blue-500",
                    },
                    {
                        "label": "Seed overlap",
                        "value": overlap_ratio,
                        "color": "bg-indigo-500",
                    },
                    {
                        "label": "Category fit",
                        "value": category_fit,
                        "color": "bg-cyan-500" if category_fit >= 70 else "bg-zinc-300",
                    },
                ],
                "tags": tags,
            },
        )

    return recommendations


def render_typescript_module(module_data: dict[str, object]) -> str:
    lines = [
        "// Generated by scripts/export_demo_data.py. Do not edit by hand.",
        "",
    ]
    for export_name in (
        "DEMO_META",
        "HISTORY",
        "PRODUCT_DETAILS",
        "RECOMMENDATIONS",
        "HOW_IT_WORKS_STEPS",
        "MODEL_EXPLANATIONS",
    ):
        payload = json.dumps(module_data[export_name], indent=2)
        lines.append(f"export const {export_name} = {payload} as const;")
        lines.append("")
    lines.append("export default {")
    for export_name in (
        "DEMO_META",
        "HISTORY",
        "PRODUCT_DETAILS",
        "RECOMMENDATIONS",
        "HOW_IT_WORKS_STEPS",
        "MODEL_EXPLANATIONS",
    ):
        lines.append(f"  {export_name},")
    lines.append("} as const;")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    args = parse_args()

    with sqlite3.connect(args.db_path) as conn:
        conn.row_factory = sqlite3.Row

        session_id = select_demo_session_id(conn)
        session_items = fetch_session_items(conn, session_id)
        session_product_ids = [str(item["product_id"]) for item in session_items]

        popularity_candidates = fetch_popularity_candidates(conn, session_product_ids, limit=5)
        item_item_candidates = fetch_item_item_candidates(
            conn,
            seed_ids=session_product_ids,
            excluded_ids=session_product_ids,
            limit=5,
        )

        all_product_ids = session_product_ids + [
            candidate["product_id"] for candidate in popularity_candidates
        ] + [
            candidate["product_id"] for candidate in item_item_candidates
        ]
        unique_product_ids = list(dict.fromkeys(all_product_ids))
        product_metadata = fetch_product_metadata(conn, unique_product_ids)
        purchase_counts = fetch_purchase_counts(conn, unique_product_ids)

    session_categories = {
        str(product_metadata[product_id]["category_code"])
        for product_id in session_product_ids
        if isinstance(product_metadata[product_id]["category_code"], str)
    }
    session_brands = {
        str(product_metadata[product_id]["brand"])
        for product_id in session_product_ids
        if isinstance(product_metadata[product_id]["brand"], str)
    }

    history = [
        build_history_entry(product_metadata[str(item["product_id"])], str(item["event_time"]))
        for item in session_items
    ]

    product_details: dict[str, dict[str, object]] = {}
    for index, product_id in enumerate(session_product_ids, start=1):
        product_details[product_id] = build_product_detail(
            product_metadata[product_id],
            purchase_counts.get(product_id, 0),
            session_role=f"Session purchase {index} of {len(session_product_ids)}",
        )

    for product_id in (
        [candidate["product_id"] for candidate in popularity_candidates]
        + [candidate["product_id"] for candidate in item_item_candidates]
    ):
        if product_id in product_details:
            continue
        product_details[product_id] = build_product_detail(
            product_metadata[product_id],
            purchase_counts.get(product_id, 0),
            session_role="Recommended candidate",
        )

    recommendations = {
        "popularity": build_popularity_recommendations(
            popularity_candidates,
            product_metadata,
            session_categories,
            session_brands,
        ),
        "item_item": build_item_item_recommendations(
            item_item_candidates,
            product_metadata,
            session_categories,
            len(session_product_ids),
        ),
    }

    module_data = {
        "DEMO_META": {
            "datasetLabel": "October 2019 purchase export",
            "sessionId": session_id,
            "sessionProductCount": len(session_product_ids),
            "note": (
                "Labels and thumbnails are derived from product_id, brand, category_code, and price "
                "because the source dataset does not include product titles or product photos."
            ),
        },
        "HISTORY": history,
        "PRODUCT_DETAILS": product_details,
        "RECOMMENDATIONS": recommendations,
        "HOW_IT_WORKS_STEPS": [
            {
                "title": "Replay one real purchase session",
                "body": (
                    f"The left rail replays {len(session_product_ids)} products from a real October 2019 "
                    "purchase session stored in the local SQLite export."
                ),
            },
            {
                "title": "Compare two ranking methods",
                "body": (
                    "Popularity ranks products by total purchase volume, while Item-Item CF ranks products "
                    "by how often they were co-purchased with this session's products."
                ),
            },
            {
                "title": "Surface real evidence",
                "body": (
                    "Each recommendation shows recorded purchase counts, co-session counts, brand/category fit, "
                    "and price metadata from the underlying dataset."
                ),
            },
        ],
        "MODEL_EXPLANATIONS": [
            {
                "id": "popularity",
                "title": "Popularity",
                "eyebrow": "Purchase volume",
                "summary": (
                    "A global baseline that sorts products by total purchase count across the October 2019 extract."
                ),
                "signals": ["Purchase count", "Category fit", "Brand fit"],
            },
            {
                "id": "item_item",
                "title": "Item-Item CF",
                "eyebrow": "Co-purchase graph",
                "summary": (
                    "A behavioral model that ranks products by how often they appear in the same purchase sessions "
                    "as the products in the selected session."
                ),
                "signals": ["Co-session count", "Seed overlap", "Category fit"],
            },
        ],
    }

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(render_typescript_module(module_data), encoding="utf-8")

    print(f"Selected session: {session_id}")
    print(f"Session products: {len(session_product_ids)}")
    print(f"Wrote frontend data: {args.output_path}")


if __name__ == "__main__":
    main()

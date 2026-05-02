import argparse
import base64
import html
import json
import re
import sqlite3
from pathlib import Path
from typing import Iterable
from urllib.parse import quote


DEFAULT_DB_PATH = Path("data/myket.db")
DEFAULT_OUTPUT_PATH = Path("frontend/src/app/demoData.generated.ts")
HISTORY_LIMIT = 6
RECOMMENDATION_LIMIT = 5
AppStoreMetadata = dict[str, dict[str, str]]
GENERIC_PACKAGE_PARTS = {
    "android",
    "app",
    "apps",
    "application",
    "com",
    "free",
    "game",
    "games",
    "ir",
    "mobile",
    "net",
    "org",
}
GRADIENTS = [
    ("#0f172a", "#1d4ed8"),
    ("#164e63", "#0891b2"),
    ("#14532d", "#16a34a"),
    ("#7c2d12", "#ea580c"),
    ("#581c87", "#c026d3"),
    ("#312e81", "#6366f1"),
    ("#3f3f46", "#71717a"),
]
ENGLISH_DESCRIPTION_OVERRIDES = {
    "ir.tv.off": (
        "Dataset package from the selected user's install history. Its public store page is no "
        "longer available, so the demo keeps the interaction record and uses a generated app tile."
    ),
    "com.farakav.anten": (
        "Anten streams Iranian TV channels and major sports matches live on Android."
    ),
    "com.incytel.mencherz": (
        "Mencherz brings the classic board game online with competitive multiplayer matches."
    ),
    "com.ParsisGames.AirCombat": (
        "Air Combat is a modern fighter-jet dogfighting game with online battles and fast aerial action."
    ),
    "com.StudioBadbadak.Khastegaran": (
        "A Persian adventure game built around a chaotic village courtship story, puzzles, and comic situations."
    ),
    "com.digikala": (
        "Digikala is an online shopping app for browsing products, ordering goods, and receiving delivery at home."
    ),
    "com.instagram.android": (
        "Instagram lets people share photos, stories, reels, and messages with friends and communities."
    ),
    "ir.resaneh1.iptv": (
        "Rubika is an Iranian super-app for messaging, media, entertainment, and everyday digital services."
    ),
    "com.tencent.ig": (
        "PUBG Mobile is a battle royale game where players compete online to be the last survivor."
    ),
    "com.ForgeGames.SpecialForcesGroup2": (
        "Special Forces Group 2 is a mobile first-person shooter with counter-terror style multiplayer action."
    ),
    "ir.nomogame.ClutchGame": (
        "Clutch is a Persian racing game with local language menus and competitive driving challenges."
    ),
    "ir.medu.shad": (
        "Shad is Iran's official education platform for virtual classes and school communication."
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export real Myket install-history and app recommendation demo data.",
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
    parser.add_argument(
        "--app-store-metadata-path",
        type=Path,
        help=(
            "Optional JSON from scripts/scrape_app_store_metadata.py. When provided, every "
            "exported app must have icon_url and short_description metadata."
        ),
    )
    parser.add_argument(
        "--app-store-metadata-db-path",
        type=Path,
        help=(
            "Optional SQLite database containing app_store_metadata rows from "
            "scripts/scrape_app_store_metadata.py. When provided, every exported app must have "
            "stored icon bytes and description metadata."
        ),
    )
    parser.add_argument(
        "--allow-synthetic-placeholders",
        action="store_true",
        help=(
            "Allow synthetic icons/descriptions for exported apps missing from the app-store "
            "metadata file."
        ),
    )
    args = parser.parse_args()

    if not args.db_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {args.db_path}")
    if args.app_store_metadata_path is not None and not args.app_store_metadata_path.exists():
        raise FileNotFoundError(f"App store metadata not found: {args.app_store_metadata_path}")
    if (
        args.app_store_metadata_db_path is not None
        and not args.app_store_metadata_db_path.exists()
    ):
        raise FileNotFoundError(
            f"App store metadata SQLite database not found: {args.app_store_metadata_db_path}",
        )
    if args.app_store_metadata_path is not None and args.app_store_metadata_db_path is not None:
        raise ValueError("Use either --app-store-metadata-path or --app-store-metadata-db-path, not both.")

    return args


def fetch_rows(conn: sqlite3.Connection, query: str, params: Iterable[object] = ()) -> list[sqlite3.Row]:
    cur = conn.execute(query, tuple(params))
    return cur.fetchall()


def select_demo_user_id(conn: sqlite3.Connection) -> str:
    rows = fetch_rows(
        conn,
        """
        WITH ranked_installs AS (
            SELECT
                i.user_id,
                i.app_name,
                a.category_en,
                ROW_NUMBER() OVER (
                    PARTITION BY i.user_id
                    ORDER BY i.timestamp ASC, i.app_name ASC
                ) AS install_rank
            FROM installs i
            JOIN apps a ON a.app_name = i.app_name
        )
        SELECT
            user_id,
            COUNT(*) AS install_count,
            COUNT(DISTINCT category_en) AS category_count
        FROM ranked_installs
        WHERE install_rank <= ?
        GROUP BY user_id
        HAVING install_count >= ?
           AND category_count >= 4
        ORDER BY category_count DESC, user_id ASC
        LIMIT 1
        """,
        (HISTORY_LIMIT, HISTORY_LIMIT),
    )
    if not rows:
        raise RuntimeError("Could not find a Myket user with enough categorized installs for the demo.")
    return str(rows[0]["user_id"])


def fetch_user_history(conn: sqlite3.Connection, user_id: str) -> list[dict[str, object]]:
    rows = fetch_rows(
        conn,
        """
        SELECT
            i.user_id,
            i.app_name,
            i.timestamp,
            a.installs,
            a.rating,
            a.rating_count,
            a.category_en
        FROM installs i
        JOIN apps a ON a.app_name = i.app_name
        WHERE i.user_id = ?
        ORDER BY i.timestamp ASC, i.app_name ASC
        LIMIT ?
        """,
        (user_id, HISTORY_LIMIT),
    )
    return [dict(row) for row in rows]


def fetch_interaction_counts(conn: sqlite3.Connection, app_names: list[str]) -> dict[str, int]:
    if not app_names:
        return {}

    placeholders = ", ".join("?" for _ in app_names)
    rows = fetch_rows(
        conn,
        f"""
        SELECT app_name, COUNT(*) AS install_interactions
        FROM installs
        WHERE app_name IN ({placeholders})
        GROUP BY app_name
        """,
        app_names,
    )
    return {str(row["app_name"]): int(row["install_interactions"]) for row in rows}


def fetch_app_metadata(conn: sqlite3.Connection, app_names: list[str]) -> dict[str, dict[str, object]]:
    if not app_names:
        return {}

    placeholders = ", ".join("?" for _ in app_names)
    rows = fetch_rows(
        conn,
        f"""
        SELECT app_name, installs, rating, rating_count, category_en
        FROM apps
        WHERE app_name IN ({placeholders})
        """,
        app_names,
    )
    return {str(row["app_name"]): dict(row) for row in rows}


def load_app_store_metadata_from_json(
    path: Path | None,
    app_names: list[str],
    allow_synthetic_placeholders: bool,
) -> tuple[AppStoreMetadata, list[str]]:
    if path is None:
        return {}, []

    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"App store metadata must be a JSON object: {path}")

    apps = payload.get("apps")
    if not isinstance(apps, list):
        raise ValueError(f"App store metadata must include an apps list: {path}")

    parsed: AppStoreMetadata = {}
    for index, app_payload in enumerate(apps):
        if not isinstance(app_payload, dict):
            raise ValueError(f"App store metadata apps[{index}] must be an object.")

        package_name = require_string(app_payload, "package_name", index)
        parsed[package_name] = {
            "icon_url": require_string(app_payload, "icon_url", index),
            "short_description": require_string(app_payload, "short_description", index),
            "source_url": require_string(app_payload, "source_url", index),
            "store": require_string(app_payload, "store", index),
        }
        long_description = app_payload.get("long_description")
        if isinstance(long_description, str) and long_description.strip():
            parsed[package_name]["long_description"] = long_description.strip()

    missing = [app_name for app_name in app_names if app_name not in parsed]
    if missing and not allow_synthetic_placeholders:
        raise ValueError(
            "App store metadata is missing exported apps: "
            + ", ".join(sorted(missing)),
        )

    return parsed, missing


def load_app_store_metadata_from_db(
    path: Path | None,
    app_names: list[str],
    allow_synthetic_placeholders: bool,
) -> tuple[AppStoreMetadata, list[str]]:
    if path is None:
        return {}, []
    if not app_names:
        return {}, []

    placeholders = ", ".join("?" for _ in app_names)
    with sqlite3.connect(path) as conn:
        conn.row_factory = sqlite3.Row
        table_exists = fetch_rows(
            conn,
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name = 'app_store_metadata'
            """,
        )
        if not table_exists:
            raise ValueError(f"SQLite database does not contain app_store_metadata: {path}")

        rows = fetch_rows(
            conn,
            f"""
            SELECT
                app_name,
                store,
                source_url,
                icon_url,
                icon_content_type,
                icon_bytes,
                short_description,
                long_description
            FROM app_store_metadata
            WHERE app_name IN ({placeholders})
            """,
            app_names,
        )

    parsed: AppStoreMetadata = {}
    for row in rows:
        app_name = require_db_string(row, "app_name")
        content_type = require_db_string(row, "icon_content_type")
        icon_bytes = row["icon_bytes"]
        if not isinstance(icon_bytes, bytes) or not icon_bytes:
            raise ValueError(f"app_store_metadata.icon_bytes must be non-empty for {app_name}.")

        parsed[app_name] = {
            "icon_url": f"data:{content_type};base64,{base64.b64encode(icon_bytes).decode('ascii')}",
            "short_description": require_db_string(row, "short_description"),
            "source_url": require_db_string(row, "source_url"),
            "store": require_db_string(row, "store"),
        }
        long_description = row["long_description"]
        if isinstance(long_description, str) and long_description.strip():
            parsed[app_name]["long_description"] = long_description.strip()

    missing = [app_name for app_name in app_names if app_name not in parsed]
    if missing and not allow_synthetic_placeholders:
        raise ValueError(
            "SQLite app store metadata is missing exported apps: "
            + ", ".join(sorted(missing)),
        )

    return parsed, missing


def require_db_string(row: sqlite3.Row, key: str) -> str:
    value = row[key]
    if not isinstance(value, str) or not value.strip():
        app_name = row["app_name"] if "app_name" in row.keys() else "unknown app"
        raise ValueError(f"app_store_metadata.{key} must be non-empty for {app_name}.")
    return value.strip()


def require_string(payload: dict[str, object], key: str, index: int) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"App store metadata apps[{index}].{key} must be a non-empty string.")
    return value.strip()


def fetch_popularity_candidates(conn: sqlite3.Connection, excluded_apps: list[str]) -> list[dict[str, object]]:
    placeholders = ", ".join("?" for _ in excluded_apps)
    where_clause = f"AND i.app_name NOT IN ({placeholders})" if excluded_apps else ""
    rows = fetch_rows(
        conn,
        f"""
        SELECT
            i.app_name,
            COUNT(*) AS install_interactions
        FROM installs i
        JOIN apps a ON a.app_name = i.app_name
        WHERE 1 = 1
          {where_clause}
        GROUP BY i.app_name
        ORDER BY install_interactions DESC, i.app_name ASC
        LIMIT ?
        """,
        (*excluded_apps, RECOMMENDATION_LIMIT),
    )
    return [dict(row) for row in rows]


def fetch_item_item_candidates(
    conn: sqlite3.Connection,
    seed_apps: list[str],
    excluded_apps: list[str],
) -> list[dict[str, object]]:
    seed_values = ", ".join("(?)" for _ in seed_apps)
    excluded_placeholders = ", ".join("?" for _ in excluded_apps)
    rows = fetch_rows(
        conn,
        f"""
        WITH seed_apps(app_name) AS (
            VALUES {seed_values}
        ),
        seed_users AS (
            SELECT DISTINCT user_id, app_name AS seed_app
            FROM installs
            WHERE app_name IN (SELECT app_name FROM seed_apps)
        ),
        candidate_pairs AS (
            SELECT
                other.app_name AS candidate_app,
                seed.seed_app,
                other.user_id
            FROM seed_users seed
            JOIN installs other ON other.user_id = seed.user_id
            JOIN apps a ON a.app_name = other.app_name
            WHERE other.app_name NOT IN ({excluded_placeholders})
        )
        SELECT
            candidate_app AS app_name,
            COUNT(*) AS pair_count,
            COUNT(DISTINCT user_id) AS co_users,
            COUNT(DISTINCT seed_app) AS matched_seed_apps
        FROM candidate_pairs
        GROUP BY candidate_app
        ORDER BY co_users DESC, matched_seed_apps DESC, pair_count DESC, candidate_app ASC
        LIMIT ?
        """,
        (*seed_apps, *excluded_apps, RECOMMENDATION_LIMIT),
    )
    return [dict(row) for row in rows]


def split_package_part(part: str) -> list[str]:
    spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", part)
    spaced = re.sub(r"([A-Za-z])(\d)", r"\1 \2", spaced)
    spaced = re.sub(r"(\d)([A-Za-z])", r"\1 \2", spaced)
    return [piece for piece in re.split(r"[^A-Za-z0-9]+", spaced) if piece]


def app_title(app_name: str) -> str:
    parts = []
    for raw_part in app_name.split("."):
        cleaned = raw_part.strip("_-").lower()
        if not cleaned or cleaned in GENERIC_PACKAGE_PARTS:
            continue
        parts.extend(split_package_part(raw_part))

    selected = parts[:3] if parts else [app_name]
    return " ".join(piece.upper() if len(piece) <= 3 else piece.title() for piece in selected)


def format_count(value: int | float | None) -> str:
    if value is None:
        return "Unknown"
    return f"{int(value):,}"


def format_rating(value: float | None) -> str:
    if value is None:
        return "No rating"
    return f"{value:.2f}"


def format_timestamp(value: float) -> str:
    return f"t+{value:,.0f}"


def category_fit_score(category: str | None, history_categories: set[str]) -> int:
    if category is None:
        return 20
    return 100 if category in history_categories else 35


def rating_score(rating: float | None) -> int:
    if rating is None:
        return 20
    return max(0, min(100, round(rating / 5 * 100)))


def gradient_for_app(app_name: str) -> tuple[str, str]:
    seed = sum(ord(char) for char in app_name)
    return GRADIENTS[seed % len(GRADIENTS)]


def build_app_image(app_name: str, category: str | None, rating: float | None) -> str:
    title = app_title(app_name)
    start, end = gradient_for_app(app_name)
    lines = [
        title.upper()[:18],
        (category or "Unknown category").upper()[:18],
        app_name.split(".")[-1].upper()[:20],
        f"{format_rating(rating)} rating",
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
  <text x="36" y="92" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#f8fafc">{html.escape(lines[0])}</text>
  <text x="36" y="128" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#e2e8f0">{html.escape(lines[1])}</text>
  <text x="36" y="220" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#ffffff">{html.escape(lines[2])}</text>
  <text x="36" y="258" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#dbeafe">{html.escape(lines[3])}</text>
</svg>
""".strip()
    return f"data:image/svg+xml,{quote(svg)}"


def app_image(
    app_name: str,
    category: str | None,
    rating: float | None,
    app_store_metadata: AppStoreMetadata,
) -> str:
    if app_name in app_store_metadata:
        return app_store_metadata[app_name]["icon_url"]
    return build_app_image(app_name, category, rating)


def app_description(
    app_name: str,
    category: str,
    installs: float | None,
    interaction_count: int,
    app_store_metadata: AppStoreMetadata,
) -> str:
    if app_name in ENGLISH_DESCRIPTION_OVERRIDES:
        return ENGLISH_DESCRIPTION_OVERRIDES[app_name]
    if app_name in app_store_metadata:
        metadata = app_store_metadata[app_name]
        return metadata.get("long_description", metadata["short_description"])
    return ""


def app_store_facts(app_name: str, app_store_metadata: AppStoreMetadata) -> list[dict[str, str]]:
    if app_name not in app_store_metadata:
        return []

    source = app_store_metadata[app_name]
    return [
        {"label": "Presentation source", "value": source["store"]},
        {"label": "Store page", "value": source["source_url"]},
    ]


def build_app_detail(
    meta: dict[str, object],
    interaction_count: int,
    history_role: str,
    app_store_metadata: AppStoreMetadata,
) -> dict[str, object]:
    app_name = str(meta["app_name"])
    title = app_title(app_name)
    category = str(meta["category_en"]) if meta["category_en"] is not None else "Unknown category"
    rating = float(meta["rating"]) if meta["rating"] is not None else None
    installs = float(meta["installs"]) if meta["installs"] is not None else None
    rating_count = int(meta["rating_count"]) if meta["rating_count"] is not None else None
    return {
        "id": app_name,
        "title": title,
        "category": category,
        "image": app_image(app_name, category, rating, app_store_metadata),
        "description": app_description(app_name, category, installs, interaction_count, app_store_metadata),
        "attributes": [
            app_name,
            category,
            f"{format_rating(rating)} rating",
            f"{format_count(installs)} installs",
        ],
        "facts": [
            {"label": "Sample installs", "value": format_count(interaction_count)},
            {"label": "Store installs", "value": format_count(installs)},
            {"label": "Rating count", "value": format_count(rating_count)},
            {"label": "History role", "value": history_role},
        ]
        + app_store_facts(app_name, app_store_metadata),
    }


def build_history_entry(
    meta: dict[str, object],
    timestamp: float,
    app_store_metadata: AppStoreMetadata,
) -> dict[str, object]:
    app_name = str(meta["app_name"])
    category = str(meta["category_en"]) if meta["category_en"] is not None else "Unknown category"
    rating = float(meta["rating"]) if meta["rating"] is not None else None
    return {
        "id": app_name,
        "title": app_title(app_name),
        "category": category,
        "time": format_timestamp(timestamp),
        "image": app_image(app_name, category, rating, app_store_metadata),
    }


def build_popularity_recommendations(
    candidates: list[dict[str, object]],
    app_metadata: dict[str, dict[str, object]],
    history_categories: set[str],
    app_store_metadata: AppStoreMetadata,
) -> list[dict[str, object]]:
    top_count = max(int(candidate["install_interactions"]) for candidate in candidates)
    recommendations: list[dict[str, object]] = []

    for candidate in candidates:
        app_name = str(candidate["app_name"])
        meta = app_metadata[app_name]
        category = str(meta["category_en"]) if meta["category_en"] is not None else None
        rating = float(meta["rating"]) if meta["rating"] is not None else None
        installs = float(meta["installs"]) if meta["installs"] is not None else None
        install_interactions = int(candidate["install_interactions"])
        fit = category_fit_score(category, history_categories)
        tags = [{"label": "Top installs", "type": "popularity"}]
        if fit == 100:
            tags.append({"label": "Same category", "type": "category"})

        recommendations.append(
            {
                "id": app_name,
                "title": app_title(app_name),
                "image": app_image(app_name, category, rating, app_store_metadata),
                "explanation": (
                    f"Installed {format_count(install_interactions)} times in the Myket sample. "
                    f"Metadata places it in {category or 'Unknown category'} with "
                    f"{format_count(installs)} approximate store installs."
                ),
                "score": format_count(install_interactions),
                "scoreLabel": "Sample installs",
                "signals": [
                    {
                        "label": "Install idx",
                        "value": round(install_interactions / top_count * 100),
                        "color": "bg-emerald-500",
                    },
                    {
                        "label": "Category fit",
                        "value": fit,
                        "color": "bg-cyan-500" if fit == 100 else "bg-zinc-300",
                    },
                    {
                        "label": "Rating",
                        "value": rating_score(rating),
                        "color": "bg-amber-500",
                    },
                ],
                "tags": tags,
            },
        )

    return recommendations


def build_item_item_recommendations(
    candidates: list[dict[str, object]],
    app_metadata: dict[str, dict[str, object]],
    history_categories: set[str],
    history_size: int,
    app_store_metadata: AppStoreMetadata,
) -> list[dict[str, object]]:
    top_co_users = max(int(candidate["co_users"]) for candidate in candidates)
    recommendations: list[dict[str, object]] = []

    for candidate in candidates:
        app_name = str(candidate["app_name"])
        meta = app_metadata[app_name]
        category = str(meta["category_en"]) if meta["category_en"] is not None else None
        rating = float(meta["rating"]) if meta["rating"] is not None else None
        co_users = int(candidate["co_users"])
        matched_seed_apps = int(candidate["matched_seed_apps"])
        fit = category_fit_score(category, history_categories)
        tags = [
            {
                "label": f"{matched_seed_apps}/{history_size} seed overlap",
                "type": "coview",
            },
        ]
        if fit == 100:
            tags.append({"label": "Same category", "type": "category"})

        recommendations.append(
            {
                "id": app_name,
                "title": app_title(app_name),
                "image": app_image(app_name, category, rating, app_store_metadata),
                "explanation": (
                    f"Installed by {format_count(co_users)} users who also installed apps from this "
                    f"user's history, matching {matched_seed_apps} of the {history_size} seed apps."
                ),
                "score": format_count(co_users),
                "scoreLabel": "Co-users",
                "signals": [
                    {
                        "label": "Co-user idx",
                        "value": round(co_users / top_co_users * 100),
                        "color": "bg-blue-500",
                    },
                    {
                        "label": "Seed overlap",
                        "value": round(matched_seed_apps / history_size * 100),
                        "color": "bg-indigo-500",
                    },
                    {
                        "label": "Category fit",
                        "value": fit,
                        "color": "bg-cyan-500" if fit == 100 else "bg-zinc-300",
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
        "APP_DETAILS",
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
        "APP_DETAILS",
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

        user_id = select_demo_user_id(conn)
        history_rows = fetch_user_history(conn, user_id)
        history_app_names = [str(row["app_name"]) for row in history_rows]
        popularity_candidates = fetch_popularity_candidates(conn, history_app_names)
        item_item_candidates = fetch_item_item_candidates(conn, history_app_names, history_app_names)

        candidate_app_names = [
            str(candidate["app_name"])
            for candidate in popularity_candidates + item_item_candidates
        ]
        all_app_names = list(dict.fromkeys(history_app_names + candidate_app_names))
        app_metadata = fetch_app_metadata(conn, all_app_names)
        interaction_counts = fetch_interaction_counts(conn, all_app_names)

    if args.app_store_metadata_db_path is not None:
        app_store_metadata, synthetic_placeholder_apps = load_app_store_metadata_from_db(
            args.app_store_metadata_db_path,
            all_app_names,
            args.allow_synthetic_placeholders,
        )
    else:
        app_store_metadata, synthetic_placeholder_apps = load_app_store_metadata_from_json(
            args.app_store_metadata_path,
            all_app_names,
            args.allow_synthetic_placeholders,
        )
    history_categories = {
        str(app_metadata[app_name]["category_en"])
        for app_name in history_app_names
        if app_metadata[app_name]["category_en"] is not None
    }
    history = [
        build_history_entry(
            app_metadata[str(row["app_name"])],
            float(row["timestamp"]),
            app_store_metadata,
        )
        for row in history_rows
    ]

    app_details: dict[str, dict[str, object]] = {}
    for index, app_name in enumerate(history_app_names, start=1):
        app_details[app_name] = build_app_detail(
            app_metadata[app_name],
            interaction_counts.get(app_name, 0),
            history_role=f"User install {index} of {len(history_app_names)}",
            app_store_metadata=app_store_metadata,
        )

    for app_name in candidate_app_names:
        if app_name in app_details:
            continue
        app_details[app_name] = build_app_detail(
            app_metadata[app_name],
            interaction_counts.get(app_name, 0),
            history_role="Recommended candidate",
            app_store_metadata=app_store_metadata,
        )

    recommendations = {
        "popularity": build_popularity_recommendations(
            popularity_candidates,
            app_metadata,
            history_categories,
            app_store_metadata,
        ),
        "item_item": build_item_item_recommendations(
            item_item_candidates,
            app_metadata,
            history_categories,
            len(history_app_names),
            app_store_metadata,
        ),
    }

    module_data = {
        "DEMO_META": {
            "datasetLabel": "Myket Android app install interactions",
            "sessionId": user_id,
            "historyAppCount": len(history_app_names),
            "syntheticPlaceholderAppCount": len(synthetic_placeholder_apps),
            "note": (
                "This demo uses anonymized user-app install events from Myket. App ranking evidence "
                "comes from the local interaction dataset. Public app-store metadata supplies app "
                "descriptions where available. Icons are embedded when available; otherwise the demo "
                "uses deterministic dataset-backed icon tiles so the presentation remains self-contained."
                if app_store_metadata
                else (
                    "This demo uses anonymized user-app install events from Myket. App cards are derived "
                    "from package name, category, install-count, and rating metadata because the dataset "
                    "does not include app icons or marketing screenshots."
                )
            ),
        },
        "HISTORY": history,
        "APP_DETAILS": app_details,
        "RECOMMENDATIONS": recommendations,
        "HOW_IT_WORKS_STEPS": [
            {
                "title": "Replay one real install history",
                "body": (
                    f"The left rail replays {len(history_app_names)} app installs from one anonymized "
                    "Myket user in timestamp order."
                ),
            },
            {
                "title": "Compare two ranking methods",
                "body": (
                    "Popularity ranks apps by total installs in the sample, while Item-Item CF ranks "
                    "apps by how often they were installed by users who also installed this user's apps."
                ),
            },
            {
                "title": "Keep the graph path open",
                "body": (
                    "The underlying data is a user-app-time interaction graph, which maps directly to "
                    "PyTorch Geometric for a future LightGCN or graph-embedding inference layer."
                ),
            },
        ],
        "MODEL_EXPLANATIONS": [
            {
                "id": "popularity",
                "title": "Popularity",
                "eyebrow": "Install volume",
                "summary": (
                    "A global baseline that sorts Android apps by total install interactions across "
                    "the Myket sample."
                ),
                "signals": ["Sample installs", "Category fit", "Rating"],
            },
            {
                "id": "item_item",
                "title": "Item-Item CF",
                "eyebrow": "Co-install graph",
                "summary": (
                    "A behavioral model that ranks apps by how often they appear in the same users' "
                    "install histories as the selected user's apps."
                ),
                "signals": ["Co-user count", "Seed overlap", "Category fit"],
            },
        ],
    }

    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(render_typescript_module(module_data), encoding="utf-8")

    print(f"Selected user: {user_id}")
    print(f"Install-history apps: {len(history_app_names)}")
    print(f"History categories: {', '.join(sorted(history_categories))}")
    if synthetic_placeholder_apps:
        print(f"Synthetic placeholders: {', '.join(sorted(synthetic_placeholder_apps))}")
    print(f"Wrote frontend data: {args.output_path}")


if __name__ == "__main__":
    main()

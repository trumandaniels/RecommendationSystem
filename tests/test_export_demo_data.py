from __future__ import annotations

import base64
import importlib.util
import sqlite3
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = REPO_ROOT / "scripts" / "export_demo_data.py"
MODULE_SPEC = importlib.util.spec_from_file_location("export_demo_data", MODULE_PATH)
if MODULE_SPEC is None or MODULE_SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
exporter = importlib.util.module_from_spec(MODULE_SPEC)
sys.modules[MODULE_SPEC.name] = exporter
MODULE_SPEC.loader.exec_module(exporter)


class LoadAppStoreMetadataFromDbTests(unittest.TestCase):
    def test_loads_icon_bytes_as_data_url(self) -> None:
        db_path = REPO_ROOT / ".runtime" / "test-export-metadata.sqlite"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        if db_path.exists():
            db_path.unlink()
        self.addCleanup(lambda: db_path.exists() and db_path.unlink())

        icon_bytes = b"real-icon-bytes"
        with sqlite3.connect(db_path) as conn:
            conn.execute(
                """
                CREATE TABLE app_store_metadata (
                    app_name TEXT PRIMARY KEY,
                    store TEXT NOT NULL,
                    source_url TEXT NOT NULL,
                    icon_url TEXT NOT NULL,
                    icon_content_type TEXT NOT NULL,
                    icon_bytes BLOB NOT NULL,
                    short_description TEXT NOT NULL,
                    long_description TEXT,
                    scraped_at TEXT NOT NULL
                )
                """,
            )
            conn.execute(
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
                """,
                (
                    "com.example.app",
                    "myket",
                    "https://myket.ir/app/com.example.app",
                    "https://cdn.example/icon.png",
                    "image/png",
                    icon_bytes,
                    "Short description.",
                    "Long description.",
                    "2026-05-01T00:00:00+00:00",
                ),
            )

        parsed, missing = exporter.load_app_store_metadata_from_db(
            db_path,
            ["com.example.app"],
            allow_synthetic_placeholders=False,
        )

        self.assertEqual(missing, [])
        expected_icon = f"data:image/png;base64,{base64.b64encode(icon_bytes).decode('ascii')}"
        self.assertEqual(parsed["com.example.app"]["icon_url"], expected_icon)
        self.assertEqual(parsed["com.example.app"]["short_description"], "Short description.")
        self.assertEqual(parsed["com.example.app"]["long_description"], "Long description.")

    def test_requires_complete_database_metadata_without_explicit_placeholder_approval(self) -> None:
        db_path = REPO_ROOT / ".runtime" / "test-export-missing-metadata.sqlite"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        if db_path.exists():
            db_path.unlink()
        self.addCleanup(lambda: db_path.exists() and db_path.unlink())

        with sqlite3.connect(db_path) as conn:
            conn.execute(
                """
                CREATE TABLE app_store_metadata (
                    app_name TEXT PRIMARY KEY,
                    store TEXT NOT NULL,
                    source_url TEXT NOT NULL,
                    icon_url TEXT NOT NULL,
                    icon_content_type TEXT NOT NULL,
                    icon_bytes BLOB NOT NULL,
                    short_description TEXT NOT NULL,
                    long_description TEXT,
                    scraped_at TEXT NOT NULL
                )
                """,
            )

        with self.assertRaisesRegex(ValueError, "missing exported apps"):
            exporter.load_app_store_metadata_from_db(
                db_path,
                ["com.example.missing"],
                allow_synthetic_placeholders=False,
            )


if __name__ == "__main__":
    unittest.main()

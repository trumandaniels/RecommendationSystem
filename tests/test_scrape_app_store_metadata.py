from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = REPO_ROOT / "scripts" / "scrape_app_store_metadata.py"
MODULE_SPEC = importlib.util.spec_from_file_location("scrape_app_store_metadata", MODULE_PATH)
if MODULE_SPEC is None or MODULE_SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
scraper = importlib.util.module_from_spec(MODULE_SPEC)
sys.modules[MODULE_SPEC.name] = scraper
MODULE_SPEC.loader.exec_module(scraper)


class ParseMetadataTests(unittest.TestCase):
    def test_parses_myket_open_graph_metadata(self) -> None:
        html_text = """
<!doctype html>
<html>
  <head>
    <meta property="og:description" content="Install the current app from Myket.">
    <meta property="og:image" content="https://cdn.example/icon-large.png">
  </head>
</html>
""".strip()

        metadata = scraper.parse_metadata(
            package_name="com.example.app",
            store="myket",
            source_url="https://myket.ir/app/com.example.app",
            html_text=html_text,
        )

        self.assertEqual(metadata.icon_url, "https://cdn.example/icon-large.png")
        self.assertEqual(metadata.short_description, "Install the current app from Myket.")

    def test_parses_google_play_description_and_icon_metadata(self) -> None:
        html_text = """
<!doctype html>
<html>
  <head>
    <meta name="description" property="og:description" content="Create and share things.">
    <meta property="og:image" content="https://play.example/icon.png">
  </head>
</html>
""".strip()

        metadata = scraper.parse_metadata(
            package_name="com.example.play",
            store="google-play",
            source_url="https://play.google.com/store/apps/details?id=com.example.play&hl=en_US",
            html_text=html_text,
        )

        self.assertEqual(metadata.icon_url, "https://play.example/icon.png")
        self.assertEqual(metadata.short_description, "Create and share things.")

    def test_uses_software_application_json_ld_when_meta_tags_are_absent(self) -> None:
        html_text = """
<!doctype html>
<html>
  <head>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "image": "https://cdn.example/json-icon.png",
        "description": "A short JSON-LD description."
      }
    </script>
  </head>
</html>
""".strip()

        metadata = scraper.parse_metadata(
            package_name="com.example.jsonld",
            store="myket",
            source_url="https://myket.ir/app/com.example.jsonld",
            html_text=html_text,
        )

        self.assertEqual(metadata.icon_url, "https://cdn.example/json-icon.png")
        self.assertEqual(metadata.short_description, "A short JSON-LD description.")

    def test_rejects_missing_description(self) -> None:
        html_text = """
<!doctype html>
<html>
  <head>
    <meta property="og:image" content="https://cdn.example/icon-large.png">
  </head>
</html>
""".strip()

        with self.assertRaisesRegex(scraper.AppStoreScrapeError, "short description"):
            scraper.parse_metadata(
                package_name="com.example.missing",
                store="myket",
                source_url="https://myket.ir/app/com.example.missing",
                html_text=html_text,
            )

    def test_parses_package_inputs_from_args_and_file(self) -> None:
        packages_file = REPO_ROOT / ".runtime" / "test-packages.txt"
        packages_file.parent.mkdir(parents=True, exist_ok=True)
        packages_file.write_text(
            "# comment\ncom.example.two\ncom.example.one,ignored-column\n",
            encoding="utf-8",
        )
        self.addCleanup(packages_file.unlink)

        packages = scraper.parse_package_inputs(["com.example.one"], packages_file)

        self.assertEqual(packages, ["com.example.one", "com.example.two"])


if __name__ == "__main__":
    unittest.main()

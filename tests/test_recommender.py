from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from recommender import (
    ARTIFACT_TYPE,
    ARTIFACT_VERSION,
    InstallEdge,
    RecommenderError,
    PyGItemItemScorer,
    parse_training_config,
    sample_negative_apps,
    validate_artifact_payload,
)


class TrainingConfigTests(unittest.TestCase):
    def test_requires_existing_database_path(self) -> None:
        with self.assertRaises(FileNotFoundError):
            parse_training_config(
                db_path=Path(".runtime/missing-myket-test.db"),
                output_path=Path(".runtime/models/test.pt"),
                max_users=10,
                max_apps=10,
                max_edges=100,
                min_user_history=2,
                embedding_dim=8,
                layers=1,
                epochs=1,
                learning_rate=0.01,
                weight_decay=0.0,
                seed=13,
            )

    def test_rejects_non_positive_graph_bounds(self) -> None:
        db_path = Path(".runtime/test-empty-config.db")
        db_path.parent.mkdir(parents=True, exist_ok=True)
        db_path.touch()
        self.addCleanup(lambda: db_path.exists() and db_path.unlink())

        with self.assertRaisesRegex(ValueError, "--max-users"):
            parse_training_config(
                db_path=db_path,
                output_path=Path(".runtime/models/test.pt"),
                max_users=0,
                max_apps=10,
                max_edges=100,
                min_user_history=2,
                embedding_dim=8,
                layers=1,
                epochs=1,
                learning_rate=0.01,
                weight_decay=0.0,
                seed=13,
            )


class NegativeSamplingTests(unittest.TestCase):
    def test_samples_apps_not_already_installed_by_user(self) -> None:
        edges = [InstallEdge(user_index=0, app_index=0), InstallEdge(user_index=1, app_index=1)]
        positives = {(0, 0), (1, 1)}
        import random

        negatives = sample_negative_apps(edges, app_count=3, positive_pairs=positives, rng=random.Random(4))

        self.assertEqual(len(negatives), len(edges))
        for edge, negative_app in zip(edges, negatives):
            self.assertNotIn((edge.user_index, negative_app), positives)

    def test_raises_when_user_has_every_selected_app(self) -> None:
        edges = [InstallEdge(user_index=0, app_index=0)]
        positives = {(0, 0)}
        import random

        with self.assertRaises(RecommenderError):
            sample_negative_apps(edges, app_count=1, positive_pairs=positives, rng=random.Random(4))


class ArtifactValidationTests(unittest.TestCase):
    def test_requires_artifact_type(self) -> None:
        with self.assertRaisesRegex(ValueError, "artifact_type"):
            validate_artifact_payload(
                {
                    "artifact_type": "other",
                    "artifact_version": ARTIFACT_VERSION,
                    "app_names": ["com.example.seed"],
                    "app_metadata": {},
                    "user_histories": {},
                    "app_embeddings": object(),
                },
            )

    def test_requires_app_names(self) -> None:
        with self.assertRaisesRegex(ValueError, "app_names"):
            validate_artifact_payload(
                {
                    "artifact_type": ARTIFACT_TYPE,
                    "artifact_version": ARTIFACT_VERSION,
                    "app_metadata": {},
                    "user_histories": {},
                    "app_embeddings": object(),
                },
            )


@unittest.skipUnless(importlib.util.find_spec("torch"), "torch is not installed")
class ScorerTests(unittest.TestCase):
    def test_recommends_highest_scoring_uninstalled_app(self) -> None:
        import torch

        payload = {
            "artifact_type": ARTIFACT_TYPE,
            "artifact_version": ARTIFACT_VERSION,
            "app_names": ["com.example.seed", "com.example.candidate", "com.example.installed"],
            "app_metadata": {
                "com.example.seed": {"category_en": "Tool", "install_interactions": 10},
                "com.example.candidate": {"category_en": "Tool", "install_interactions": 8},
                "com.example.installed": {"category_en": "Game", "install_interactions": 7},
            },
            "user_histories": {"u1": ["com.example.seed", "com.example.installed"]},
            "app_embeddings": torch.tensor(
                [
                    [1.0, 0.0],
                    [0.9, 0.0],
                    [0.8, 0.0],
                ],
            ),
        }

        scorer = PyGItemItemScorer(payload, torch)
        recommendations = scorer.recommend_for_apps(
            ["com.example.seed", "com.example.installed"],
            limit=1,
        )

        self.assertEqual([recommendation.app_name for recommendation in recommendations], ["com.example.candidate"])


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import argparse
from pathlib import Path

from recommender import (
    DEFAULT_DB_PATH,
    DEFAULT_EMBEDDING_DIM,
    DEFAULT_EPOCHS,
    DEFAULT_LAYERS,
    DEFAULT_LEARNING_RATE,
    DEFAULT_MAX_APPS,
    DEFAULT_MAX_EDGES,
    DEFAULT_MAX_USERS,
    DEFAULT_MIN_USER_HISTORY,
    DEFAULT_MODEL_PATH,
    DEFAULT_SEED,
    DEFAULT_WEIGHT_DECAY,
    PyGItemItemConfig,
    fetch_installed_apps_for_user,
    load_pyg_item_item_scorer,
    parse_training_config,
    require_positive_int,
    train_pyg_item_item_model,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train and score local Myket app recommendation models.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    train_parser = subparsers.add_parser(
        "train-pyg-item-item",
        help="Train a lightweight PyTorch Geometric item-item graph recommender.",
    )
    train_parser.add_argument("--db-path", type=Path, default=DEFAULT_DB_PATH)
    train_parser.add_argument("--output-path", type=Path, default=DEFAULT_MODEL_PATH)
    train_parser.add_argument("--max-users", type=int, default=DEFAULT_MAX_USERS)
    train_parser.add_argument("--max-apps", type=int, default=DEFAULT_MAX_APPS)
    train_parser.add_argument("--max-edges", type=int, default=DEFAULT_MAX_EDGES)
    train_parser.add_argument("--min-user-history", type=int, default=DEFAULT_MIN_USER_HISTORY)
    train_parser.add_argument("--embedding-dim", type=int, default=DEFAULT_EMBEDDING_DIM)
    train_parser.add_argument("--layers", type=int, default=DEFAULT_LAYERS)
    train_parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    train_parser.add_argument("--learning-rate", type=float, default=DEFAULT_LEARNING_RATE)
    train_parser.add_argument("--weight-decay", type=float, default=DEFAULT_WEIGHT_DECAY)
    train_parser.add_argument("--seed", type=int, default=DEFAULT_SEED)

    recommend_parser = subparsers.add_parser(
        "recommend-pyg-item-item",
        help="Score apps from a saved PyG item-item model artifact.",
    )
    recommend_parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    recommend_parser.add_argument("--db-path", type=Path, default=DEFAULT_DB_PATH)
    recommend_parser.add_argument("--user-id")
    recommend_parser.add_argument(
        "--installed-app",
        action="append",
        default=[],
        help="Installed app/package id. May be provided multiple times instead of --user-id.",
    )
    recommend_parser.add_argument("--limit", type=int, default=10)

    return parser.parse_args()


def training_config_from_args(args: argparse.Namespace) -> PyGItemItemConfig:
    return parse_training_config(
        db_path=args.db_path,
        output_path=args.output_path,
        max_users=args.max_users,
        max_apps=args.max_apps,
        max_edges=args.max_edges,
        min_user_history=args.min_user_history,
        embedding_dim=args.embedding_dim,
        layers=args.layers,
        epochs=args.epochs,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
        seed=args.seed,
    )


def run_train(args: argparse.Namespace) -> None:
    summary = train_pyg_item_item_model(training_config_from_args(args))
    print(f"Model artifact: {summary.model_path}")
    print(f"Users: {summary.user_count:,}")
    print(f"Apps: {summary.app_count:,}")
    print(f"Positive install edges: {summary.positive_edge_count:,}")
    print(f"Graph edges: {summary.graph_edge_count:,}")
    print(f"Epoch losses: {', '.join(f'{loss:.4f}' for loss in summary.losses)}")


def installed_apps_from_args(args: argparse.Namespace) -> list[str]:
    if args.user_id and args.installed_app:
        raise ValueError("Use either --user-id or --installed-app, not both.")
    if args.user_id:
        return fetch_installed_apps_for_user(args.db_path, args.user_id)
    if args.installed_app:
        return args.installed_app
    raise ValueError("Provide --user-id or at least one --installed-app.")


def run_recommend(args: argparse.Namespace) -> None:
    limit = require_positive_int(args.limit, "--limit")
    scorer = load_pyg_item_item_scorer(args.model_path)
    installed_apps = installed_apps_from_args(args)
    recommendations = scorer.recommend_for_apps(installed_apps, limit)
    print(f"Input installed apps: {len(installed_apps):,}")
    print(f"Recommendations: {len(recommendations):,}")
    for rank, recommendation in enumerate(recommendations, start=1):
        category = recommendation.metadata.get("category_en") or "Unknown category"
        interactions = recommendation.metadata.get("install_interactions")
        print(
            f"{rank}. {recommendation.app_name} "
            f"score={recommendation.score:.4f} "
            f"category={category} "
            f"sample_installs={interactions}"
        )


def main() -> None:
    args = parse_args()
    if args.command == "train-pyg-item-item":
        run_train(args)
    elif args.command == "recommend-pyg-item-item":
        run_recommend(args)
    else:
        raise ValueError(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()

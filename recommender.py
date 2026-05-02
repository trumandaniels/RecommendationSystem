from __future__ import annotations

import random
import sqlite3
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ARTIFACT_TYPE = "pyg_item_item_recommender"
ARTIFACT_VERSION = 1
DEFAULT_DB_PATH = Path("data/myket.db")
DEFAULT_MODEL_PATH = Path(".runtime/models/pyg-item-item.pt")
DEFAULT_MAX_USERS = 2_000
DEFAULT_MAX_APPS = 2_000
DEFAULT_MAX_EDGES = 100_000
DEFAULT_MIN_USER_HISTORY = 2
DEFAULT_EMBEDDING_DIM = 32
DEFAULT_LAYERS = 2
DEFAULT_EPOCHS = 5
DEFAULT_LEARNING_RATE = 0.01
DEFAULT_WEIGHT_DECAY = 1e-5
DEFAULT_SEED = 13


class RecommenderError(RuntimeError):
    """Base error for model training and scoring failures."""


class MissingPyGDependencyError(RecommenderError):
    """Raised when the PyTorch Geometric model path is requested without PyG."""


@dataclass(frozen=True)
class PyGItemItemConfig:
    db_path: Path = DEFAULT_DB_PATH
    output_path: Path = DEFAULT_MODEL_PATH
    max_users: int = DEFAULT_MAX_USERS
    max_apps: int = DEFAULT_MAX_APPS
    max_edges: int = DEFAULT_MAX_EDGES
    min_user_history: int = DEFAULT_MIN_USER_HISTORY
    embedding_dim: int = DEFAULT_EMBEDDING_DIM
    layers: int = DEFAULT_LAYERS
    epochs: int = DEFAULT_EPOCHS
    learning_rate: float = DEFAULT_LEARNING_RATE
    weight_decay: float = DEFAULT_WEIGHT_DECAY
    seed: int = DEFAULT_SEED


@dataclass(frozen=True)
class AppRecord:
    app_name: str
    installs: float | None
    rating: float | None
    rating_count: int | None
    category_en: str | None
    install_interactions: int


@dataclass(frozen=True)
class InstallEdge:
    user_index: int
    app_index: int


@dataclass(frozen=True)
class GraphDataset:
    user_ids: list[str]
    app_records: list[AppRecord]
    edges: list[InstallEdge]
    user_histories: dict[str, list[str]]


@dataclass(frozen=True)
class TrainingSummary:
    model_path: Path
    user_count: int
    app_count: int
    positive_edge_count: int
    graph_edge_count: int
    losses: list[float]


def require_training_dependencies() -> tuple[Any, Any, Any, Any]:
    try:
        import torch
        import torch.nn.functional as functional
        from torch import nn
        from torch_geometric.nn import LGConv
    except ModuleNotFoundError as exc:
        raise MissingPyGDependencyError(
            "PyTorch Geometric training requires torch and torch-geometric. "
            "Install dependencies with Socket Firewall, for example: "
            "sfw pip install -r requirements.txt",
        ) from exc
    return torch, functional, nn, LGConv


def require_positive_int(value: int, name: str) -> int:
    if value <= 0:
        raise ValueError(f"{name} must be greater than 0.")
    return value


def require_non_negative_float(value: float, name: str) -> float:
    if value < 0:
        raise ValueError(f"{name} must be greater than or equal to 0.")
    return value


def parse_training_config(
    *,
    db_path: Path,
    output_path: Path,
    max_users: int,
    max_apps: int,
    max_edges: int,
    min_user_history: int,
    embedding_dim: int,
    layers: int,
    epochs: int,
    learning_rate: float,
    weight_decay: float,
    seed: int,
) -> PyGItemItemConfig:
    if not db_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {db_path}")
    require_positive_int(max_users, "--max-users")
    require_positive_int(max_apps, "--max-apps")
    require_positive_int(max_edges, "--max-edges")
    require_positive_int(min_user_history, "--min-user-history")
    require_positive_int(embedding_dim, "--embedding-dim")
    require_positive_int(layers, "--layers")
    require_positive_int(epochs, "--epochs")
    require_non_negative_float(learning_rate, "--learning-rate")
    require_non_negative_float(weight_decay, "--weight-decay")
    return PyGItemItemConfig(
        db_path=db_path,
        output_path=output_path,
        max_users=max_users,
        max_apps=max_apps,
        max_edges=max_edges,
        min_user_history=min_user_history,
        embedding_dim=embedding_dim,
        layers=layers,
        epochs=epochs,
        learning_rate=learning_rate,
        weight_decay=weight_decay,
        seed=seed,
    )


def fetch_rows(
    conn: sqlite3.Connection,
    query: str,
    params: Iterable[object] = (),
) -> list[sqlite3.Row]:
    cur = conn.execute(query, tuple(params))
    return cur.fetchall()


def placeholders(values: Iterable[object]) -> str:
    return ", ".join("?" for _ in values)


def parse_app_record(row: sqlite3.Row) -> AppRecord:
    app_name = row["app_name"]
    if not isinstance(app_name, str) or not app_name.strip():
        raise ValueError("app_name must be a non-empty string.")
    install_interactions = int(row["install_interactions"])
    if install_interactions <= 0:
        raise ValueError(f"install_interactions must be positive for {app_name}.")
    return AppRecord(
        app_name=app_name,
        installs=float(row["installs"]) if row["installs"] is not None else None,
        rating=float(row["rating"]) if row["rating"] is not None else None,
        rating_count=int(row["rating_count"]) if row["rating_count"] is not None else None,
        category_en=str(row["category_en"]) if row["category_en"] is not None else None,
        install_interactions=install_interactions,
    )


def load_graph_dataset(config: PyGItemItemConfig) -> GraphDataset:
    with sqlite3.connect(config.db_path) as conn:
        conn.row_factory = sqlite3.Row
        app_rows = fetch_rows(
            conn,
            """
            WITH app_counts AS (
                SELECT app_name, COUNT(DISTINCT user_id) AS install_interactions
                FROM installs
                GROUP BY app_name
            )
            SELECT
                app_counts.app_name,
                apps.installs,
                apps.rating,
                apps.rating_count,
                apps.category_en,
                app_counts.install_interactions
            FROM app_counts
            LEFT JOIN apps ON apps.app_name = app_counts.app_name
            ORDER BY app_counts.install_interactions DESC, app_counts.app_name ASC
            LIMIT ?
            """,
            (config.max_apps,),
        )
        app_records = [parse_app_record(row) for row in app_rows]
        if len(app_records) < 2:
            raise RecommenderError("Training requires at least two app nodes.")

        app_names = [record.app_name for record in app_records]
        app_lookup = {app_name: index for index, app_name in enumerate(app_names)}
        app_filter = placeholders(app_names)

        user_rows = fetch_rows(
            conn,
            f"""
            SELECT user_id, COUNT(DISTINCT app_name) AS history_size
            FROM installs
            WHERE app_name IN ({app_filter})
            GROUP BY user_id
            HAVING history_size >= ?
            ORDER BY history_size DESC, user_id ASC
            LIMIT ?
            """,
            (*app_names, config.min_user_history, config.max_users),
        )
        user_ids = [str(row["user_id"]) for row in user_rows]
        if len(user_ids) < 2:
            raise RecommenderError("Training requires at least two users with enough selected apps.")

        user_lookup = {user_id: index for index, user_id in enumerate(user_ids)}
        user_filter = placeholders(user_ids)
        edge_rows = fetch_rows(
            conn,
            f"""
            SELECT user_id, app_name, MIN(timestamp) AS first_installed_at
            FROM installs
            WHERE user_id IN ({user_filter})
              AND app_name IN ({app_filter})
            GROUP BY user_id, app_name
            ORDER BY user_id ASC, first_installed_at ASC, app_name ASC
            LIMIT ?
            """,
            (*user_ids, *app_names, config.max_edges),
        )

    edges: list[InstallEdge] = []
    user_histories = {user_id: [] for user_id in user_ids}
    for row in edge_rows:
        user_id = str(row["user_id"])
        app_name = str(row["app_name"])
        if user_id not in user_lookup:
            raise ValueError(f"Install edge references an unknown user: {user_id}")
        if app_name not in app_lookup:
            raise ValueError(f"Install edge references an unknown app: {app_name}")
        edges.append(InstallEdge(user_index=user_lookup[user_id], app_index=app_lookup[app_name]))
        user_histories[user_id].append(app_name)

    if not edges:
        raise RecommenderError("Training graph has no install edges.")

    users_with_edges = {edge.user_index for edge in edges}
    if len(users_with_edges) < 2:
        raise RecommenderError("Training requires install edges for at least two users.")

    return GraphDataset(
        user_ids=user_ids,
        app_records=app_records,
        edges=edges,
        user_histories=user_histories,
    )


def sample_negative_apps(
    edges: list[InstallEdge],
    app_count: int,
    positive_pairs: set[tuple[int, int]],
    rng: random.Random,
) -> list[int]:
    negatives: list[int] = []
    max_attempts = app_count * 2
    for edge in edges:
        for _ in range(max_attempts):
            candidate = rng.randrange(app_count)
            if (edge.user_index, candidate) not in positive_pairs:
                negatives.append(candidate)
                break
        else:
            raise RecommenderError(
                "Could not sample a negative app because a selected user installed every selected app.",
            )
    return negatives


def app_record_payload(records: list[AppRecord]) -> dict[str, dict[str, object]]:
    return {
        record.app_name: {
            "installs": record.installs,
            "rating": record.rating,
            "rating_count": record.rating_count,
            "category_en": record.category_en,
            "install_interactions": record.install_interactions,
        }
        for record in records
    }


def serializable_config(config: PyGItemItemConfig) -> dict[str, object]:
    payload = asdict(config)
    payload["db_path"] = str(config.db_path)
    payload["output_path"] = str(config.output_path)
    return payload


def train_pyg_item_item_model(config: PyGItemItemConfig) -> TrainingSummary:
    torch, functional, nn, LGConv = require_training_dependencies()
    dataset = load_graph_dataset(config)
    rng = random.Random(config.seed)
    torch.manual_seed(config.seed)

    user_count = len(dataset.user_ids)
    app_count = len(dataset.app_records)
    app_offset = user_count
    source_nodes = [edge.user_index for edge in dataset.edges]
    target_nodes = [app_offset + edge.app_index for edge in dataset.edges]
    edge_index = torch.tensor(
        [source_nodes + target_nodes, target_nodes + source_nodes],
        dtype=torch.long,
    )
    positive_user_nodes = torch.tensor(source_nodes, dtype=torch.long)
    positive_app_nodes = torch.tensor(target_nodes, dtype=torch.long)
    positive_pairs = {(edge.user_index, edge.app_index) for edge in dataset.edges}

    class LightGCNItemItem(nn.Module):
        def __init__(self, node_count: int) -> None:
            super().__init__()
            self.embedding = nn.Embedding(node_count, config.embedding_dim)
            self.convs = nn.ModuleList(LGConv(normalize=True) for _ in range(config.layers))
            nn.init.xavier_uniform_(self.embedding.weight)

        def forward(self) -> Any:
            x = self.embedding.weight
            out = x
            for conv in self.convs:
                x = conv(x, edge_index)
                out = out + x
            return out / (len(self.convs) + 1)

    model = LightGCNItemItem(user_count + app_count)
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )
    losses: list[float] = []
    for _ in range(config.epochs):
        model.train()
        negative_apps = sample_negative_apps(dataset.edges, app_count, positive_pairs, rng)
        negative_app_nodes = torch.tensor(
            [app_offset + app_index for app_index in negative_apps],
            dtype=torch.long,
        )
        optimizer.zero_grad()
        embeddings = model()
        positive_scores = (embeddings[positive_user_nodes] * embeddings[positive_app_nodes]).sum(dim=1)
        negative_scores = (embeddings[positive_user_nodes] * embeddings[negative_app_nodes]).sum(dim=1)
        loss = -functional.logsigmoid(positive_scores - negative_scores).mean()
        loss.backward()
        optimizer.step()
        losses.append(float(loss.detach().cpu()))

    model.eval()
    with torch.no_grad():
        final_embeddings = model().detach().cpu()

    artifact = {
        "artifact_type": ARTIFACT_TYPE,
        "artifact_version": ARTIFACT_VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "config": serializable_config(config),
        "training": {
            "epochs": config.epochs,
            "losses": losses,
            "user_count": user_count,
            "app_count": app_count,
            "positive_edge_count": len(dataset.edges),
            "graph_edge_count": len(dataset.edges) * 2,
        },
        "user_ids": dataset.user_ids,
        "app_names": [record.app_name for record in dataset.app_records],
        "app_metadata": app_record_payload(dataset.app_records),
        "user_histories": dataset.user_histories,
        "user_embeddings": final_embeddings[:user_count],
        "app_embeddings": final_embeddings[user_count:],
    }

    config.output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(artifact, config.output_path)
    return TrainingSummary(
        model_path=config.output_path,
        user_count=user_count,
        app_count=app_count,
        positive_edge_count=len(dataset.edges),
        graph_edge_count=len(dataset.edges) * 2,
        losses=losses,
    )


def validate_artifact_payload(payload: dict[str, object]) -> None:
    if payload.get("artifact_type") != ARTIFACT_TYPE:
        raise ValueError(f"Unsupported artifact_type: {payload.get('artifact_type')!r}")
    if payload.get("artifact_version") != ARTIFACT_VERSION:
        raise ValueError(f"Unsupported artifact_version: {payload.get('artifact_version')!r}")
    for key in ("app_names", "app_metadata", "user_histories", "app_embeddings"):
        if key not in payload:
            raise ValueError(f"Model artifact is missing {key}.")
    app_names = payload["app_names"]
    if not isinstance(app_names, list) or not all(isinstance(name, str) for name in app_names):
        raise ValueError("Model artifact app_names must be a list of strings.")
    if not app_names:
        raise ValueError("Model artifact must contain at least one app embedding.")


@dataclass(frozen=True)
class Recommendation:
    app_name: str
    score: float
    metadata: dict[str, object]


class PyGItemItemScorer:
    def __init__(self, payload: dict[str, object], torch_module: Any) -> None:
        validate_artifact_payload(payload)
        self._torch = torch_module
        self.app_names = list(payload["app_names"])
        self.app_metadata = dict(payload["app_metadata"])
        self.user_histories = dict(payload["user_histories"])
        self.app_embeddings = payload["app_embeddings"].detach().cpu()
        if self.app_embeddings.ndim != 2:
            raise ValueError("Model artifact app_embeddings must be a 2D tensor.")
        if self.app_embeddings.shape[0] != len(self.app_names):
            raise ValueError("Model artifact app_embeddings row count must match app_names.")
        self._app_lookup = {app_name: index for index, app_name in enumerate(self.app_names)}

    def recommend_for_apps(self, installed_apps: list[str], limit: int) -> list[Recommendation]:
        require_positive_int(limit, "--limit")
        known_indexes = [
            self._app_lookup[app_name]
            for app_name in installed_apps
            if app_name in self._app_lookup
        ]
        if not known_indexes:
            raise RecommenderError(
                "None of the installed apps are present in the model artifact.",
            )

        installed_set = set(installed_apps)
        profile = self.app_embeddings[known_indexes].mean(dim=0)
        scores = self.app_embeddings @ profile
        ranked_indexes = self._torch.argsort(scores, descending=True)

        recommendations: list[Recommendation] = []
        for raw_index in ranked_indexes.tolist():
            app_name = self.app_names[int(raw_index)]
            if app_name in installed_set:
                continue
            metadata = self.app_metadata.get(app_name)
            if not isinstance(metadata, dict):
                raise ValueError(f"Model artifact metadata missing for {app_name}.")
            recommendations.append(
                Recommendation(
                    app_name=app_name,
                    score=float(scores[int(raw_index)].item()),
                    metadata=metadata,
                ),
            )
            if len(recommendations) >= limit:
                break
        return recommendations

    def recommend_for_user_id(self, user_id: str, limit: int) -> list[Recommendation]:
        history = self.user_histories.get(user_id)
        if not isinstance(history, list) or not all(isinstance(app, str) for app in history):
            raise RecommenderError(f"User {user_id} is not present in the model artifact.")
        return self.recommend_for_apps(history, limit)


def load_pyg_item_item_scorer(model_path: Path) -> PyGItemItemScorer:
    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found: {model_path}")
    try:
        import torch
    except ModuleNotFoundError as exc:
        raise MissingPyGDependencyError(
            "PyG item-item scoring requires torch to load the model artifact.",
        ) from exc
    payload = torch.load(model_path, map_location="cpu", weights_only=False)
    if not isinstance(payload, dict):
        raise ValueError("Model artifact must be a dictionary payload.")
    return PyGItemItemScorer(payload, torch)


def fetch_installed_apps_for_user(db_path: Path, user_id: str) -> list[str]:
    if not db_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {db_path}")
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = fetch_rows(
            conn,
            """
            SELECT app_name
            FROM installs
            WHERE user_id = ?
            GROUP BY app_name
            ORDER BY MIN(timestamp) ASC, app_name ASC
            """,
            (user_id,),
        )
    apps = [str(row["app_name"]) for row in rows]
    if not apps:
        raise RecommenderError(f"No install history found for user {user_id}.")
    return apps

# RecommendationSystem

Deployed Website available at https://trumandaniels.dev/recommendation-system/

Portfolio recommendation-system demo built around real user-app install
interactions from the
[Myket Android Application Install Dataset](https://github.com/erfanloghmani/myket-android-application-market-dataset).

The product story is:

> Given the apps a user has installed, recommend the next apps they are likely
> to install.

The frontend compares two recommendation strategies:

- **Popularity:** globally most-installed apps in the Myket interaction sample.
- **Item-Item CF:** apps often installed by users who also installed the
  selected user's apps.

The Myket data is a user-app-time interaction graph, so it also gives this
project a working PyTorch Geometric training path for a lightweight
LightGCN-style item-item scorer.

## Local Data

The source dataset is kept under ignored `data/` paths:

```text
data/myket-android-application-market-dataset/
data/myket.db
```

To rebuild the SQLite database and generated frontend data:

```bash
python3 injest_data.py --replace-db
python3 scripts/export_demo_data.py
```

## PyTorch Geometric Scoring

Install the pinned model dependencies:

```bash
sfw .venv/bin/pip install -r requirements.txt
```

Train a bounded CPU-friendly graph model:

```bash
.venv/bin/python train_models.py train-pyg-item-item \
  --max-users 2000 \
  --max-apps 2000 \
  --max-edges 100000 \
  --epochs 5 \
  --output-path .runtime/models/pyg-item-item.pt
```

Score from an existing user's install history:

```bash
.venv/bin/python train_models.py recommend-pyg-item-item \
  --model-path .runtime/models/pyg-item-item.pt \
  --user-id -1152799605 \
  --limit 10
```

## Frontend

```bash
cd frontend
npm run dev
```

For a production check:

```bash
cd frontend
npm run build
```

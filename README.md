# RecommendationSystem

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
project a natural path toward PyTorch Geometric inference with LightGCN or
graph embeddings.

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

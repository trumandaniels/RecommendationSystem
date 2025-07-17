# RecommendationSystem

## Dataset: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store
Extract the dataset to a folder named `data` in the root directory. "data/2019-Dec.csv.gz" becomes "data/2019-Dec.csv"

/RecommendationSystem
|
|-- app.py                # Main Flask application
|-- models/               # Your trained PyTorch models (.pth files)
|   |-- matrix_factorization.pth
|   |-- gnn_model.pth
|
|-- data/                 # Processed data for models
|
|-- recommender.py        # The core recommendation logic
|-- train_models.py       # (Offline) Script to train and save your models

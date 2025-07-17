# Core recommmendation logic for the Recommendation System

"""
Popularity-Based:

Offline: Calculate the most frequently purchased/clicked items from your historical data.

Real-time: Simply return the top N items from that pre-computed list. This is your baseline.

Content-Based Filtering:

Offline: For each item, create a vector representing its content (e.g., using TF-IDF on product descriptions or one-hot encoding of categories).

Real-time: Get the content vectors for items in the user's history. Average these vectors to create a "session profile vector." Find the items whose content vectors are most similar (using cosine similarity) to this profile vector.

Collaborative Filtering (Item-Item):

Offline: Build an item-item similarity matrix. For any two items, the similarity is how often they were co-purchased or co-rated by the same users.

Real-time: For the last item the user clicked, look up its most similar items in the matrix and recommend them.

Matrix Factorization (PyTorch):

Offline (train_models.py): Train a classic matrix factorization model (like Funk SVD) on your user-item interaction data. This learns low-dimensional embedding vectors for every user and every item. Save the learned item embeddings.

Real-time: You don't have a pre-trained embedding for the new anonymous user. So, you do this:

Get the item embeddings for all items in the user's history.

Average these embeddings to create a "session embedding vector." This vector represents the user's current taste.

Calculate the cosine similarity between this session embedding and all other item embeddings.

Recommend the items with the highest similarity.

Graph Neural Networks (PyTorch Geometric):

Offline (train_models.py): This is your most advanced model.

Represent your entire product catalog and user interactions as a bipartite graph (users and items are nodes, clicks/purchases are edges).

Train a GNN (like LightGCN or GraphSAGE) on this graph. The goal is to learn powerful embeddings for all item nodes that capture not just content but also the structure of user behavior.

Save the learned item embeddings from the GNN.

Real-time: The logic is identical to Matrix Factorization. You average the GNN embeddings of items in the user's history to create a session vector and find the most similar items. The GNN embeddings are often more powerful and lead to better recommendations.

Ensemble:

Real-time: Run several of the above models (e.g., Content-Based, MF, and GNN). Each model produces a list of recommendations with scores. Combine these scores using a weighted average (e.g., final_score = 0.5*gnn_score + 0.3*mf_score + 0.2*content_score) and return the top N items by the final score.
"""
# Recommendation strategy notes for the Myket app-install demo.

"""
The project now centers on implicit-feedback app recommendations:

    Given a user's app install history, recommend the next apps they are likely
    to install.

Popularity baseline:

Offline: Count install interactions per app across the Myket sample.
Inference: Exclude apps already in the user's history and return the top apps by
sample install count.

Item-item collaborative filtering:

Offline or query time: Build app-app similarity from shared installers. Two apps
are related when many users installed both of them.
Inference: For a selected user's history, rank candidate apps by the number of
users who installed both the candidate and one or more seed apps from that
history.

Semantic text similarity:

Offline or client-side: Embed each app's name and description with a compact
text model. The current hosted demo uses a small deterministic n-gram embedding
so it stays static-hostable without downloading a large transformer bundle.
Inference: Use the currently selected app as the query vector, then rank every
other store app by cosine similarity to that app's name-and-description vector.

PyTorch matrix factorization:

Offline: Train user and app embeddings from the implicit user-app interaction
matrix. The current Myket data shape is already appropriate for this because it
has user identifiers, app identifiers, and install timestamps.
Inference: Average the embeddings for apps in the selected user's history, then
rank unseen apps by cosine similarity or dot product.

PyTorch Geometric / graph recommender:

Offline: Represent the dataset as a bipartite graph with user nodes, app nodes,
and timestamped install edges. Train a graph recommender such as LightGCN or a
related embedding model.
Inference: Use learned app embeddings, or user/app embeddings when available,
to rank apps that are close to the selected user's install-history profile.

Portfolio positioning:

Popularity and item-item CF make the demo easy to understand immediately. PyG is
the natural advanced-model path because the source data is already a temporal
user-app graph.
"""

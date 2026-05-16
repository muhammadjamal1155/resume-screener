import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def calculate_semantic_scores(
    job_embedding: np.ndarray,
    resume_embeddings: np.ndarray,
) -> np.ndarray:
    """Return normalized cosine similarity scores between 0 and 1."""
    scores = cosine_similarity(job_embedding, resume_embeddings)[0]
    return (scores + 1) / 2

import pandas as pd
import numpy as np

from sentence_transformers import SentenceTransformer


# load resumes
df = pd.read_csv(
    'processed_resumes.csv'
)


# load embedding model
model = SentenceTransformer(
    'all-MiniLM-L6-v2'
)


# generate embeddings once
embeddings = model.encode(
    df['cleaned_text'].tolist(),
    show_progress_bar=True
)


# save embeddings
np.save(
    'resume_embeddings.npy',
    embeddings
)

print("Embeddings saved successfully")
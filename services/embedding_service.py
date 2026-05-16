from pathlib import Path
from typing import Iterable, List

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

from services.preprocessing_service import preprocess_text


BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
PROCESSED_RESUMES_PATH = MODELS_DIR / "processed_resumes.csv"
EMBEDDINGS_PATH = MODELS_DIR / "resume_embeddings.npy"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


class EmbeddingService:
    def __init__(self):
        self.model = self._load_sentence_transformer()

    def encode(self, texts: Iterable[str]) -> np.ndarray:
        cleaned_texts = [preprocess_text(text) for text in texts]

        if self.model is not None:
            return np.asarray(self.model.encode(cleaned_texts))

        # Local fallback keeps the API usable before the transformer is cached.
        vectorizer = TfidfVectorizer(stop_words="english")
        return vectorizer.fit_transform(cleaned_texts).toarray()

    def encode_query_and_documents(
        self,
        query: str,
        documents: List[str],
    ) -> tuple[np.ndarray, np.ndarray]:
        cleaned = [preprocess_text(query), *[preprocess_text(doc) for doc in documents]]

        if self.model is not None:
            embeddings = np.asarray(self.model.encode(cleaned))
        else:
            vectorizer = TfidfVectorizer(stop_words="english")
            embeddings = vectorizer.fit_transform(cleaned).toarray()

        return embeddings[0:1], embeddings[1:]

    def load_resume_embeddings(self) -> np.ndarray | None:
        if not EMBEDDINGS_PATH.exists():
            return None
        return np.load(EMBEDDINGS_PATH)

    def generate_dataset_embeddings(self) -> tuple[np.ndarray, int]:
        if self.model is None:
            raise RuntimeError(
                "SentenceTransformer is not available locally. Install/cache "
                "all-MiniLM-L6-v2 before generating reusable resume embeddings."
            )

        df = pd.read_csv(PROCESSED_RESUMES_PATH)
        text_column = "cleaned_text" if "cleaned_text" in df.columns else "Text"
        embeddings = self.encode(df[text_column].fillna("").tolist())
        np.save(EMBEDDINGS_PATH, embeddings)
        return embeddings, len(df)

    def ensure_dataset_embeddings(self) -> np.ndarray:
        embeddings = self.load_resume_embeddings()
        if embeddings is not None:
            return embeddings
        embeddings, _ = self.generate_dataset_embeddings()
        return embeddings

    def _load_sentence_transformer(self):
        try:
            from sentence_transformers import SentenceTransformer

            return SentenceTransformer(EMBEDDING_MODEL_NAME, local_files_only=True)
        except Exception:
            return None

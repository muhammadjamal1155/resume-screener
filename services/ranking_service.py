from typing import List

import joblib
import pandas as pd

from services.embedding_service import EmbeddingService, MODELS_DIR, PROCESSED_RESUMES_PATH
from services.preprocessing_service import preprocess_text
from services.resume_parser import guess_candidate_name
from services.similarity_service import calculate_semantic_scores
from services.skill_matching_service import (
    calculate_skill_match_score,
    extract_required_skills,
    matched_skills,
    normalize_skills,
)


MODEL_PATH = MODELS_DIR / "model.pkl"


class RankingService:
    def __init__(self, embedding_service: EmbeddingService | None = None):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        self.model = joblib.load(MODEL_PATH)
        self.embedding_service = embedding_service or EmbeddingService()

    def rank_uploaded_resumes(
        self,
        job_description: str,
        resumes: List[dict],
        top_n: int = 10,
        required_skills: List[str] | None = None,
    ) -> dict:
        self._validate(job_description, resumes)
        required_skills = self._required_skills(job_description, required_skills)
        top_n = max(1, min(int(top_n), len(resumes)))

        resume_texts = [resume["text"] for resume in resumes]
        job_embedding, resume_embeddings = self.embedding_service.encode_query_and_documents(
            job_description,
            resume_texts,
        )
        semantic_scores = calculate_semantic_scores(job_embedding, resume_embeddings)

        return self._build_response(
            resumes=resumes,
            resume_texts=resume_texts,
            semantic_scores=semantic_scores,
            required_skills=required_skills,
            top_n=top_n,
        )

    def rank_dataset_resumes(
        self,
        job_description: str,
        top_n: int = 10,
        required_skills: List[str] | None = None,
    ) -> dict:
        if not job_description.strip():
            raise ValueError("job_description is required")

        df = pd.read_csv(PROCESSED_RESUMES_PATH)
        text_column = "cleaned_text" if "cleaned_text" in df.columns else "Text"
        resume_texts = df[text_column].fillna("").tolist()
        top_n = max(1, min(int(top_n), len(df)))
        required_skills = self._required_skills(job_description, required_skills)

        if self.embedding_service.model is not None:
            resume_embeddings = self.embedding_service.ensure_dataset_embeddings()
            job_embedding = self.embedding_service.encode([job_description])
        else:
            job_embedding, resume_embeddings = self.embedding_service.encode_query_and_documents(
                job_description,
                resume_texts,
            )

        semantic_scores = calculate_semantic_scores(job_embedding, resume_embeddings)

        resumes = []
        for _, row in df.iterrows():
            resumes.append(
                {
                    "candidate_name": row.get("Name", ""),
                    "category": row.get("Category", ""),
                    "text": row.get(text_column, ""),
                    "source_file": "",
                }
            )

        return self._build_response(
            resumes=resumes,
            resume_texts=resume_texts,
            semantic_scores=semantic_scores,
            required_skills=required_skills,
            top_n=top_n,
        )

    def _build_response(
        self,
        resumes: List[dict],
        resume_texts: List[str],
        semantic_scores,
        required_skills: List[str],
        top_n: int,
    ) -> dict:
        skill_scores = [
            calculate_skill_match_score(text, required_skills)
            for text in resume_texts
        ]

        features = pd.DataFrame(
            {
                "semantic_score": semantic_scores,
                "skill_match_score": skill_scores,
            }
        )
        predictions = self.model.predict(features)
        probabilities = self.model.predict_proba(features)[:, 1]

        ranked = []
        for index, resume in enumerate(resumes):
            final_score = (
                semantic_scores[index] * 0.4
                + skill_scores[index] * 0.2
                + probabilities[index] * 0.4
            )

            ranked.append(
                {
                    "rank": 0,
                    "candidate_name": resume.get("candidate_name")
                    or guess_candidate_name(resume_texts[index]),
                    "category": resume.get("category", ""),
                    "semantic_score": round(float(semantic_scores[index]), 4),
                    "skill_match_score": round(float(skill_scores[index]), 4),
                    "ml_prediction": int(predictions[index]),
                    "ml_probability": round(float(probabilities[index] * 100), 2),
                    "final_percentage": round(float(final_score * 100), 2),
                    "matched_skills": matched_skills(resume_texts[index], required_skills),
                    "source_file": resume.get("source_file", ""),
                }
            )

        ranked.sort(key=lambda item: item["final_percentage"], reverse=True)
        for index, item in enumerate(ranked, start=1):
            item["rank"] = index

        return {
            "job_required_skills": required_skills,
            "requested_top_n": top_n,
            "total_resumes_screened": len(resumes),
            "results": ranked[:top_n],
        }

    def _required_skills(
        self,
        job_description: str,
        required_skills: List[str] | None,
    ) -> List[str]:
        skills = normalize_skills(required_skills)
        return skills or extract_required_skills(preprocess_text(job_description))

    def _validate(self, job_description: str, resumes: List[dict]) -> None:
        if not job_description.strip():
            raise ValueError("job_description is required")
        if not resumes:
            raise ValueError("At least one resume is required")
        for resume in resumes:
            if not str(resume.get("text", "")).strip():
                raise ValueError("Every resume must include extractable text")

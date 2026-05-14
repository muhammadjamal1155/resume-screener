from pathlib import Path
import re

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

COMMON_SKILLS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "node",
    "express",
    "django",
    "flask",
    "fastapi",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "terraform",
    "git",
    "linux",
    "machine learning",
    "deep learning",
    "nlp",
    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "html",
    "css",
    "tailwind",
    "rest api",
    "graphql",
    "ci/cd",
]


class ResumeScreener:
    def __init__(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        self.model = joblib.load(MODEL_PATH)
        self.embedding_model = self._load_embedding_model()

    def screen(self, job_description, resumes, top_n=10, required_skills=None):
        if not job_description or not job_description.strip():
            raise ValueError("job_description is required")

        if not resumes:
            raise ValueError("At least one resume is required")

        top_n = max(1, min(int(top_n), len(resumes)))
        required_skills = self._normalize_skills(
            required_skills or self.extract_required_skills(job_description)
        )

        resume_texts = [self._resume_text(resume) for resume in resumes]
        semantic_scores = self.semantic_scores(job_description, resume_texts)
        skill_scores = [
            self.calculate_skill_match(text, required_skills)
            for text in resume_texts
        ]

        features = pd.DataFrame(
            {
                "semantic_score": semantic_scores,
                "skill_match_score": skill_scores,
            }
        )

        predictions = self.model.predict(features)
        probabilities = self.model.predict_proba(features)[:, 1] * 100

        ranked = []
        for index, resume in enumerate(resumes):
            final_score = (
                semantic_scores[index] * 0.4
                + skill_scores[index] * 0.2
                + (probabilities[index] / 100) * 0.4
            )

            ranked.append(
                {
                    "rank": 0,
                    "candidate_name": resume.get("name")
                    or self.extract_candidate_name(resume_texts[index]),
                    "email": resume.get("email", ""),
                    "phone": resume.get("phone", ""),
                    "semantic_score": round(float(semantic_scores[index]), 4),
                    "skill_match_score": round(float(skill_scores[index]), 4),
                    "ml_prediction": int(predictions[index]),
                    "ml_probability": round(float(probabilities[index]), 2),
                    "final_percentage": round(float(final_score * 100), 2),
                    "matched_skills": self.matched_skills(
                        resume_texts[index],
                        required_skills,
                    ),
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

    def extract_required_skills(self, job_description):
        text = job_description.lower()
        return [
            skill
            for skill in COMMON_SKILLS
            if self._contains_skill(text, skill)
        ]

    def semantic_scores(self, job_description, resume_texts):
        if self.embedding_model is not None:
            jd_embedding = self.embedding_model.encode([job_description])
            resume_embeddings = self.embedding_model.encode(resume_texts)
            return (cosine_similarity(jd_embedding, resume_embeddings)[0] + 1) / 2

        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform([job_description, *resume_texts])
        return cosine_similarity(matrix[0:1], matrix[1:]).ravel()

    def calculate_skill_match(self, resume_text, required_skills):
        if not required_skills:
            return 0.0

        matched = self.matched_skills(resume_text, required_skills)
        return len(matched) / len(required_skills)

    def matched_skills(self, resume_text, required_skills):
        text = resume_text.lower()
        return [
            skill
            for skill in required_skills
            if self._contains_skill(text, skill)
        ]

    def extract_candidate_name(self, resume_text):
        for line in resume_text.splitlines():
            line = line.strip()
            if line:
                return line[:80]
        return "Unknown Candidate"

    def _resume_text(self, resume):
        text = resume.get("text", "")
        if not text or not text.strip():
            raise ValueError("Every resume must include non-empty text")
        return text

    def _normalize_skills(self, skills):
        normalized = []
        for skill in skills:
            skill = str(skill).strip().lower()
            if skill and skill not in normalized:
                normalized.append(skill)
        return normalized

    def _contains_skill(self, text, skill):
        pattern = r"(?<![a-z0-9+#.])" + re.escape(skill.lower()) + r"(?![a-z0-9+#.])"
        return re.search(pattern, text) is not None

    def _load_embedding_model(self):
        try:
            from sentence_transformers import SentenceTransformer

            return SentenceTransformer(
                EMBEDDING_MODEL_NAME,
                local_files_only=True,
            )
        except Exception:
            return None

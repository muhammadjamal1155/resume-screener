import re
from typing import Iterable, List


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


def extract_required_skills(job_description: str) -> List[str]:
    text = job_description.lower()
    return [skill for skill in COMMON_SKILLS if contains_skill(text, skill)]


def normalize_skills(skills: Iterable[str] | None) -> List[str]:
    normalized = []
    for skill in skills or []:
        skill = str(skill).strip().lower()
        if skill and skill not in normalized:
            normalized.append(skill)
    return normalized


def matched_skills(resume_text: str, required_skills: Iterable[str]) -> List[str]:
    text = str(resume_text).lower()
    return [skill for skill in required_skills if contains_skill(text, skill)]


def calculate_skill_match_score(
    resume_text: str,
    required_skills: Iterable[str],
) -> float:
    required_skills = list(required_skills)
    if not required_skills:
        return 0.0
    return len(matched_skills(resume_text, required_skills)) / len(required_skills)


def contains_skill(text: str, skill: str) -> bool:
    pattern = r"(?<![a-z0-9+#.])" + re.escape(skill.lower()) + r"(?![a-z0-9+#.])"
    return re.search(pattern, text) is not None

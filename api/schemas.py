from typing import List, Optional

from pydantic import BaseModel, Field


class ResumeTextInput(BaseModel):
    candidate_name: Optional[str] = Field(default=None, examples=["Ayesha Khan"])
    category: Optional[str] = Field(default="", examples=["Machine Learning"])
    email: Optional[str] = Field(default="", examples=["ayesha@example.com"])
    phone: Optional[str] = Field(default="", examples=["03001234567"])
    text: str = Field(..., min_length=1)


class ScreenTextRequest(BaseModel):
    job_description: str = Field(..., min_length=1)
    top_n: int = Field(default=10, ge=1)
    required_skills: Optional[List[str]] = None
    resumes: List[ResumeTextInput] = Field(..., min_length=1)


class CandidateResult(BaseModel):
    rank: int
    candidate_name: str
    category: str
    semantic_score: float
    skill_match_score: float
    ml_prediction: int
    ml_probability: float
    final_percentage: float
    matched_skills: List[str]
    source_file: str = ""


class ScreenResponse(BaseModel):
    job_required_skills: List[str]
    requested_top_n: int
    total_resumes_screened: int
    results: List[CandidateResult]


class EmbeddingResponse(BaseModel):
    message: str
    total_resumes: int
    embeddings_path: str

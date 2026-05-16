from functools import lru_cache
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from api.schemas import EmbeddingResponse, ScreenResponse, ScreenTextRequest
from database.database import save_uploaded_resume
from services.embedding_service import EMBEDDINGS_PATH, EmbeddingService
from services.ranking_service import RankingService
from services.resume_parser import extract_text_from_file, guess_candidate_name, save_upload_file


router = APIRouter()


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()


@lru_cache(maxsize=1)
def get_ranking_service() -> RankingService:
    return RankingService(get_embedding_service())


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/screen/text", response_model=ScreenResponse)
def screen_text_resumes(request: ScreenTextRequest):
    try:
        resumes = [resume.model_dump() for resume in request.resumes]
        for resume in resumes:
            resume["candidate_name"] = resume.pop("candidate_name", None)
        return get_ranking_service().rank_uploaded_resumes(
            job_description=request.job_description,
            resumes=resumes,
            top_n=request.top_n,
            required_skills=request.required_skills,
        )
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/screen/upload", response_model=ScreenResponse)
def screen_uploaded_resumes(
    job_description: str = Form(...),
    top_n: int = Form(10),
    files: List[UploadFile] = File(...),
    required_skills: Optional[str] = Form(None),
):
    try:
        resumes = []
        for upload in files:
            saved_path = save_upload_file(upload)
            save_uploaded_resume(upload.filename or saved_path.name, str(saved_path))
            text = extract_text_from_file(saved_path)
            resumes.append(
                {
                    "candidate_name": guess_candidate_name(
                        text,
                        fallback=upload.filename or "Unknown Candidate",
                    ),
                    "category": "",
                    "text": text,
                    "source_file": upload.filename or saved_path.name,
                }
            )

        skills = parse_required_skills(required_skills)
        return get_ranking_service().rank_uploaded_resumes(
            job_description=job_description,
            resumes=resumes,
            top_n=top_n,
            required_skills=skills,
        )
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/screen/dataset", response_model=ScreenResponse)
def screen_dataset_resumes(
    job_description: str,
    top_n: int = 10,
    required_skills: Optional[str] = None,
):
    try:
        return get_ranking_service().rank_dataset_resumes(
            job_description=job_description,
            top_n=top_n,
            required_skills=parse_required_skills(required_skills),
        )
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/embeddings/generate", response_model=EmbeddingResponse)
def generate_resume_embeddings():
    try:
        _, total = get_embedding_service().generate_dataset_embeddings()
        return {
            "message": "Resume embeddings generated successfully",
            "total_resumes": total,
            "embeddings_path": str(EMBEDDINGS_PATH),
        }
    except RuntimeError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


def parse_required_skills(required_skills: Optional[str]) -> Optional[List[str]]:
    if not required_skills:
        return None
    return [skill.strip() for skill in required_skills.split(",") if skill.strip()]

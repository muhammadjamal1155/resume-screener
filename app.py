from functools import lru_cache
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from models.resume_screener import ResumeScreener


app = FastAPI(
    title="Resume Screener API",
    description="Ranks applicant resumes against a job description.",
    version="1.0.0",
)


class ResumeInput(BaseModel):
    name: Optional[str] = Field(default=None, examples=["Ayesha Khan"])
    email: Optional[str] = Field(default="", examples=["ayesha@example.com"])
    phone: Optional[str] = Field(default="", examples=["03001234567"])
    text: str = Field(..., min_length=1)


class ScreenRequest(BaseModel):
    job_description: str = Field(..., min_length=1)
    top_n: int = Field(default=10, ge=1)
    required_skills: Optional[List[str]] = None
    resumes: List[ResumeInput] = Field(..., min_length=1)


@lru_cache(maxsize=1)
def get_screener():
    return ResumeScreener()


@app.get("/")
def root():
    return {
        "message": "Resume Screener API is running",
        "docs": "/docs",
        "screen_endpoint": "/screen",
    }


@app.post("/screen")
def screen_resumes(request: ScreenRequest):
    try:
        screener = get_screener()
        return screener.screen(
            job_description=request.job_description,
            resumes=[resume.model_dump() for resume in request.resumes],
            top_n=request.top_n,
            required_skills=request.required_skills,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

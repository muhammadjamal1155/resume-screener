from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from database.database import init_db


app = FastAPI(
    title="AI Recruitment Intelligence System",
    description="AI-powered resume screening and candidate ranking backend.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {
        "message": "AI Recruitment Intelligence System backend is running",
        "docs": "/docs",
        "health": "/api/health",
    }


app.include_router(router, prefix="/api", tags=["Resume Screening"])

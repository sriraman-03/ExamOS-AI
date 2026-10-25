from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database.db import engine, Base
from app.models import models  # noqa: F401 ensures models are registered before create_all

from app.api import auth, subjects, documents, chat, study, quiz, weakness, planner, revision, analytics, pyq, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ExamOS AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak stack traces to the client.
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our end. Please try again."})


app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(study.router)
app.include_router(quiz.router)
app.include_router(weakness.router)
app.include_router(planner.router)
app.include_router(revision.router)
app.include_router(analytics.router)
app.include_router(pyq.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"name": "ExamOS AI", "status": "running", "demo_mode": settings.DEMO_MODE}


@app.get("/api/health")
def health():
    return {"status": "ok", "demo_mode": settings.DEMO_MODE}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User
from app.models.schemas import StudyRequest
from app.utils.security import get_current_user
from app.rag.retriever import retrieve_top_chunks
from app.ai.generators import study_explanation
from app.config import settings

router = APIRouter(prefix="/api/study", tags=["study"])


@router.post("")
def study(payload: StudyRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chunks = retrieve_top_chunks(db, current_user.id, payload.topic, payload.subject_id, top_k=4)
    text = study_explanation(payload.topic, payload.difficulty, payload.action, chunks)
    return {"topic": payload.topic, "action": payload.action, "response": text, "demo_mode": settings.DEMO_MODE}

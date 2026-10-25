from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User
from app.models.schemas import RevisionRequest, RevisionOut
from app.utils.security import get_current_user
from app.rag.retriever import retrieve_top_chunks
from app.ai.generators import generate_revision_sheet

router = APIRouter(prefix="/api/revision", tags=["revision"])


@router.post("", response_model=RevisionOut)
def revise(payload: RevisionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chunks = retrieve_top_chunks(db, current_user.id, payload.topic, payload.subject_id, top_k=6)
    data = generate_revision_sheet(payload.topic, chunks)
    data.setdefault("topic", payload.topic)
    return RevisionOut(**data)

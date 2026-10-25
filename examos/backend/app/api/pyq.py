from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, Document, DocumentChunk
from app.models.schemas import PyqAnalysisOut
from app.utils.security import get_current_user
from app.ai.generators import analyze_pyq

router = APIRouter(prefix="/api/pyq", tags=["pyq"])


@router.get("/{document_id}/analyze", response_model=PyqAnalysisOut)
def analyze(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.doc_type != "pyq":
        raise HTTPException(status_code=400, detail="This document is not tagged as a previous-year question paper.")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="This document hasn't finished processing yet.")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
    full_text = "\n\n".join(c.content for c in chunks)

    # Use other ready documents' filenames/topics as a light topic hint list when available
    known_topics = list({d.filename.rsplit(".", 1)[0] for d in db.query(Document).filter(
        Document.user_id == current_user.id, Document.status == "ready"
    ).all()})

    result = analyze_pyq(full_text, known_topics)
    return PyqAnalysisOut(
        frequent_topics=result if isinstance(result, list) else [],
        note="These topics appeared frequently in the uploaded papers. This is not a prediction of exact future questions.",
    )

from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, ChatMessage
from app.models.schemas import ChatRequest, ChatResponse, ChatSource
from app.utils.security import get_current_user
from app.rag.retriever import retrieve_top_chunks
from app.ai.generators import answer_question
from app.config import settings

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/ask", response_model=ChatResponse)
def ask(payload: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    top_chunks = retrieve_top_chunks(db, current_user.id, payload.message, payload.subject_id, top_k=5)
    answer = answer_question(payload.message, top_chunks)

    sources = [
        ChatSource(
            document=c["document"].filename,
            chunk_index=c["chunk"].chunk_index,
            snippet=c["chunk"].content[:180] + ("..." if len(c["chunk"].content) > 180 else ""),
        )
        for c in top_chunks[:3]
    ]

    db.add(ChatMessage(user_id=current_user.id, subject_id=payload.subject_id, role="user", content=payload.message))
    db.add(ChatMessage(
        user_id=current_user.id, subject_id=payload.subject_id, role="assistant", content=answer,
        sources=[s.model_dump() for s in sources],
    ))
    db.commit()

    return ChatResponse(answer=answer, sources=sources, demo_mode=settings.DEMO_MODE)


@router.get("/history")
def get_history(subject_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if subject_id:
        q = q.filter(ChatMessage.subject_id == subject_id)
    messages = q.order_by(ChatMessage.created_at.asc()).all()
    return [
        {"id": m.id, "role": m.role, "content": m.content, "sources": m.sources, "created_at": m.created_at.isoformat()}
        for m in messages
    ]


@router.delete("/history")
def clear_history(subject_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if subject_id:
        q = q.filter(ChatMessage.subject_id == subject_id)
    q.delete()
    db.commit()
    return {"message": "Chat history cleared."}

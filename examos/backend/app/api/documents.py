import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, Document, DocumentChunk
from app.models.schemas import DocumentOut
from app.utils.security import get_current_user
from app.rag.document_processor import extract_text_from_pdf, clean_text, chunk_text, DocumentProcessingError
from app.config import settings

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_DOC_TYPES = {"notes", "syllabus", "textbook", "pyq"}


@router.get("", response_model=List[DocumentOut])
def list_documents(subject_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Document).filter(Document.user_id == current_user.id)
    if subject_id:
        q = q.filter(Document.subject_id == subject_id)
    return q.order_by(Document.uploaded_at.desc()).all()


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("notes"),
    subject_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now.")
    if doc_type not in ALLOWED_DOC_TYPES:
        doc_type = "notes"

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_MB:
        raise HTTPException(status_code=400, detail=f"File is too large. Max size is {settings.MAX_UPLOAD_MB}MB.")
    if size_mb == 0:
        raise HTTPException(status_code=400, detail="This file is empty.")

    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(filepath, "wb") as f:
        f.write(contents)

    document = Document(
        user_id=current_user.id,
        subject_id=subject_id,
        filename=file.filename,
        doc_type=doc_type,
        filepath=filepath,
        status="processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        raw_text = extract_text_from_pdf(filepath)
        text = clean_text(raw_text)
        chunks = chunk_text(text)
        if not chunks:
            raise DocumentProcessingError("No usable text content found after cleaning.")

        for i, chunk in enumerate(chunks):
            db.add(DocumentChunk(document_id=document.id, user_id=current_user.id, chunk_index=i, content=chunk))

        document.status = "ready"
        document.num_chunks = len(chunks)
        db.commit()
        db.refresh(document)
    except DocumentProcessingError as e:
        document.status = "failed"
        document.error_message = str(e)
        db.commit()
        db.refresh(document)
    except Exception:
        document.status = "failed"
        document.error_message = "Something went wrong while processing this document. Please try again."
        db.commit()
        db.refresh(document)

    return document


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        if os.path.exists(document.filepath):
            os.remove(document.filepath)
    except OSError:
        pass
    db.delete(document)
    db.commit()
    return {"message": "Document deleted."}

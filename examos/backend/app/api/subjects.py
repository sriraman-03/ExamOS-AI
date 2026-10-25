from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import User, Subject
from app.models.schemas import SubjectCreate, SubjectOut
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


@router.get("", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Subject).filter(Subject.user_id == current_user.id).all()


@router.post("", response_model=SubjectOut)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = Subject(user_id=current_user.id, name=payload.name.strip(), exam_date=payload.exam_date)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted."}

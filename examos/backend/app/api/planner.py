from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, StudyPlan, StudyTask
from app.models.schemas import PlannerRequest, StudyPlanOut, TaskStatusUpdate
from app.utils.security import get_current_user
from app.ai.generators import generate_study_plan

router = APIRouter(prefix="/api/planner", tags=["planner"])


def _to_plan_out(plan: StudyPlan) -> StudyPlanOut:
    total = len(plan.tasks)
    done = len([t for t in plan.tasks if t.status == "completed"])
    completion = round((done / total) * 100, 1) if total else 0.0
    return StudyPlanOut(
        id=plan.id,
        subject_id=plan.subject_id,
        exam_date=plan.exam_date,
        hours_per_day=plan.hours_per_day,
        tasks=plan.tasks,
        completion_percent=completion,
    )


@router.post("/generate", response_model=StudyPlanOut)
def generate(payload: PlannerRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    day_plans = generate_study_plan(
        payload.subject_name, payload.exam_date, payload.hours_per_day,
        payload.prep_level, payload.weak_topics, payload.all_topics,
    )

    plan = StudyPlan(
        user_id=current_user.id, subject_id=payload.subject_id,
        exam_date=payload.exam_date, hours_per_day=payload.hours_per_day,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    for day in day_plans:
        for task in day.get("tasks", []):
            db.add(StudyTask(
                plan_id=plan.id,
                day_number=day["day_number"],
                start_time=task.get("start_time"),
                end_time=task.get("end_time"),
                topic=task.get("topic", "Study"),
                task_type=task.get("task_type", "study"),
            ))
    db.commit()
    db.refresh(plan)
    return _to_plan_out(plan)


@router.get("", response_model=List[StudyPlanOut])
def list_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plans = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).order_by(StudyPlan.created_at.desc()).all()
    return [_to_plan_out(p) for p in plans]


@router.patch("/tasks/{task_id}")
def update_task_status(task_id: int, payload: TaskStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = (
        db.query(StudyTask)
        .join(StudyPlan, StudyTask.plan_id == StudyPlan.id)
        .filter(StudyTask.id == task_id, StudyPlan.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if payload.status not in {"not_started", "in_progress", "completed"}:
        raise HTTPException(status_code=400, detail="Invalid status.")
    task.status = payload.status
    db.commit()
    return {"message": "Task updated."}

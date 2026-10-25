import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, Subject, TopicPerformance, QuizAttempt, StudyPlan, StudyTask
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    topics = db.query(TopicPerformance).filter(TopicPerformance.user_id == current_user.id).all()
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()

    overall_progress = round(sum(t.accuracy for t in topics) / len(topics), 1) if topics else 0.0

    upcoming_exam = None
    today = datetime.date.today()
    soonest = None
    for s in subjects:
        if s.exam_date:
            try:
                d = datetime.date.fromisoformat(s.exam_date)
                if d >= today and (soonest is None or d < soonest[1]):
                    soonest = (s, d)
            except ValueError:
                continue
    if soonest:
        upcoming_exam = {
            "subject": soonest[0].name,
            "exam_date": soonest[0].exam_date,
            "days_remaining": (soonest[1] - today).days,
        }

    weakest = sorted(topics, key=lambda t: t.accuracy)[:1]
    recommendation = None
    if weakest:
        w = weakest[0]
        recommendation = {
            "title": f"Revise {w.topic}",
            "reason": f"Your recent accuracy is {w.last_accuracy:.0f}%.",
        }

    plan = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).order_by(StudyPlan.created_at.desc()).first()
    todays_tasks = []
    if plan:
        days_elapsed = 1
        try:
            exam_dt = datetime.date.fromisoformat(plan.exam_date) if plan.exam_date else None
        except ValueError:
            exam_dt = None
        first_day_tasks = db.query(StudyTask).filter(StudyTask.plan_id == plan.id, StudyTask.day_number == 1).all()
        todays_tasks = [{"topic": t.topic, "type": t.task_type, "status": t.status} for t in first_day_tasks]

    recent_performance = [
        {"date": a.submitted_at.strftime("%Y-%m-%d"), "accuracy": a.accuracy}
        for a in sorted(attempts, key=lambda a: a.submitted_at)[-5:]
    ]

    return {
        "greeting_name": current_user.name,
        "subjects": [{"id": s.id, "name": s.name, "exam_date": s.exam_date} for s in subjects],
        "upcoming_exam": upcoming_exam,
        "overall_progress": overall_progress,
        "weak_topics": [{"topic": t.topic, "accuracy": t.accuracy} for t in sorted(topics, key=lambda t: t.accuracy)[:3]],
        "recommendation": recommendation,
        "todays_plan": todays_tasks,
        "recent_performance": recent_performance,
    }

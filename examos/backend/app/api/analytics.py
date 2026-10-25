from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, QuizAttempt, Quiz, TopicPerformance
from app.models.schemas import AnalyticsOut, TopicPerformanceOut
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsOut)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.submitted_at.asc())
        .all()
    )
    topics = db.query(TopicPerformance).filter(TopicPerformance.user_id == current_user.id).all()

    total_quizzes = len(attempts)
    questions_attempted = sum(a.total_questions for a in attempts)
    total_correct = sum(a.correct_count for a in attempts)
    overall_accuracy = round((total_correct / questions_attempted) * 100, 1) if questions_attempted else 0.0
    average_score = round(sum(a.accuracy for a in attempts) / total_quizzes, 1) if total_quizzes else 0.0

    strong_topics = sorted([t for t in topics if t.classification == "strong"], key=lambda t: -t.accuracy)
    weak_topics = sorted([t for t in topics if t.classification == "weak"], key=lambda t: t.accuracy)

    score_history = [
        {"attempt": i + 1, "date": a.submitted_at.strftime("%Y-%m-%d"), "accuracy": a.accuracy}
        for i, a in enumerate(attempts)
    ]
    topic_accuracy = [{"topic": t.topic, "accuracy": t.accuracy} for t in topics]

    total_wrong = sum(a.wrong_count for a in attempts)
    correct_vs_incorrect = {"correct": total_correct, "incorrect": total_wrong}

    return AnalyticsOut(
        overall_accuracy=overall_accuracy,
        total_quizzes=total_quizzes,
        questions_attempted=questions_attempted,
        average_score=average_score,
        strong_topics=[TopicPerformanceOut.model_validate(t) for t in strong_topics],
        weak_topics=[TopicPerformanceOut.model_validate(t) for t in weak_topics],
        score_history=score_history,
        topic_accuracy=topic_accuracy,
        correct_vs_incorrect=correct_vs_incorrect,
    )

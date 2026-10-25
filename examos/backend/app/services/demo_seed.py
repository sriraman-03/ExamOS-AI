import datetime
from sqlalchemy.orm import Session
from app.models.models import Subject, TopicPerformance, Quiz, Question, QuizAttempt, Answer

DEMO_TOPICS = [
    ("OSI Model", 82.0),
    ("TCP/IP", 89.0),
    ("Routing", 68.0),
    ("Transport Layer", 71.0),
    ("Congestion Control", 43.0),
    ("Network Security", 76.0),
]


def classify(accuracy: float) -> str:
    if accuracy >= 75:
        return "strong"
    if accuracy >= 50:
        return "moderate"
    return "weak"


def seed_demo_data(db: Session, user_id: int):
    exam_date = (datetime.date.today() + datetime.timedelta(days=14)).isoformat()
    subject = Subject(user_id=user_id, name="Computer Networks", exam_date=exam_date)
    db.add(subject)
    db.commit()
    db.refresh(subject)

    for topic, accuracy in DEMO_TOPICS:
        db.add(TopicPerformance(
            user_id=user_id, subject_id=subject.id, topic=topic,
            attempts=10, correct=int(accuracy / 10), accuracy=accuracy,
            last_accuracy=accuracy, classification=classify(accuracy),
        ))

    # A couple of sample past quiz attempts so Analytics has a trend line
    base_date = datetime.datetime.utcnow() - datetime.timedelta(days=10)
    for i, acc in enumerate([55.0, 62.0, 70.0]):
        quiz = Quiz(user_id=user_id, subject_id=subject.id, topic="TCP/IP", difficulty="medium", question_type="mcq")
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        total = 10
        correct = int(total * acc / 100)
        attempt = QuizAttempt(
            quiz_id=quiz.id, user_id=user_id, total_questions=total,
            correct_count=correct, wrong_count=total - correct, unanswered_count=0,
            accuracy=acc, submitted_at=base_date + datetime.timedelta(days=i * 4),
        )
        db.add(attempt)
    db.commit()

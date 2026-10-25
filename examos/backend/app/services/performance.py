from sqlalchemy.orm import Session
from app.models.models import TopicPerformance


def classify(accuracy: float) -> str:
    if accuracy >= 75:
        return "strong"
    if accuracy >= 50:
        return "moderate"
    return "weak"


def update_topic_performance(db: Session, user_id: int, subject_id, topic: str, correct: int, total: int):
    if total <= 0:
        return
    row = (
        db.query(TopicPerformance)
        .filter(TopicPerformance.user_id == user_id, TopicPerformance.topic == topic)
        .first()
    )
    if not row:
        row = TopicPerformance(user_id=user_id, subject_id=subject_id, topic=topic, attempts=0, correct=0)
        db.add(row)

    row.attempts += total
    row.correct += correct
    row.accuracy = round((row.correct / row.attempts) * 100, 1) if row.attempts else 0.0
    row.last_accuracy = round((correct / total) * 100, 1)
    row.classification = classify(row.accuracy)
    db.commit()


def next_adaptive_difficulty(current: str, accuracy_percent: float) -> str:
    order = ["easy", "medium", "hard"]
    idx = order.index(current) if current in order else 1
    if accuracy_percent >= 80 and idx < len(order) - 1:
        idx += 1
    elif accuracy_percent < 50 and idx > 0:
        idx -= 1
    return order[idx]

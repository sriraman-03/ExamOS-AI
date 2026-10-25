from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import User, TopicPerformance
from app.models.schemas import WeaknessReportOut, TopicPerformanceOut
from app.utils.security import get_current_user
from app.ai.generators import weakness_recommendations

router = APIRouter(prefix="/api/weakness", tags=["weakness"])


@router.get("", response_model=WeaknessReportOut)
def get_weakness_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(TopicPerformance)
        .filter(TopicPerformance.user_id == current_user.id)
        .order_by(TopicPerformance.accuracy.asc())
        .all()
    )
    recs = weakness_recommendations(rows)
    return WeaknessReportOut(
        topics=[TopicPerformanceOut.model_validate(r) for r in rows],
        recommendations=[r for r in recs if r.strip()],
    )

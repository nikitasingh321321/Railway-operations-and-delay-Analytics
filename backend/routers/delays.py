from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import DelayEvent
from schemas import DelayBucket, DelayByHour, DelayCause, MonthlyTrend
from typing import Optional, List
from datetime import datetime, date

router = APIRouter(prefix="/api/delays", tags=["delays"])


def _base_query(db: Session, start_date: Optional[str], end_date: Optional[str]):
    q = db.query(DelayEvent)
    if start_date:
        q = q.filter(DelayEvent.recorded_at >= datetime.fromisoformat(start_date))
    if end_date:
        q = q.filter(DelayEvent.recorded_at <= datetime.fromisoformat(end_date + "T23:59:59"))
    return q


@router.get("/distribution", response_model=List[DelayBucket])
def delay_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    events = _base_query(db, start_date, end_date).all()
    buckets = {"0-5 min": 0, "5-15 min": 0, "15-30 min": 0, "30-60 min": 0, "60+ min": 0}
    for e in events:
        if (e.status or "") == "cancelled":
            continue
        d = e.delay_minutes or 0
        if d <= 5:
            buckets["0-5 min"] += 1
        elif d <= 15:
            buckets["5-15 min"] += 1
        elif d <= 30:
            buckets["15-30 min"] += 1
        elif d <= 60:
            buckets["30-60 min"] += 1
        else:
            buckets["60+ min"] += 1
    return [DelayBucket(bucket=k, count=v) for k, v in buckets.items()]


@router.get("/by-hour", response_model=List[DelayByHour])
def delay_by_hour(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    events = _base_query(db, start_date, end_date).all()
    hour_data: dict[int, list[float]] = {h: [] for h in range(24)}
    for e in events:
        if e.recorded_at and (e.status or "") != "cancelled":
            hour_data[e.recorded_at.hour].append(e.delay_minutes or 0)
    return [
        DelayByHour(hour=h, avg_delay=round(sum(v) / len(v), 2) if v else 0.0)
        for h, v in sorted(hour_data.items())
    ]


@router.get("/causes", response_model=List[DelayCause])
def delay_causes(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    events = _base_query(db, start_date, end_date).all()
    cause_counts: dict[str, int] = {}
    for e in events:
        if (e.status or "") == "cancelled":
            continue
        cause = e.delay_cause or "Unknown"
        cause_counts[cause] = cause_counts.get(cause, 0) + 1
    return [DelayCause(cause=k, count=v) for k, v in sorted(cause_counts.items(), key=lambda x: -x[1])]


@router.get("/monthly-trends", response_model=List[MonthlyTrend])
def monthly_trends(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    events = _base_query(db, start_date, end_date).all()
    month_data: dict[str, dict] = {}
    for e in events:
        if not e.recorded_at:
            continue
        key = e.recorded_at.strftime("%Y-%m")
        if key not in month_data:
            month_data[key] = {"delays": [], "total": 0, "cancelled": 0}
        month_data[key]["total"] += 1
        if (e.status or "") == "cancelled":
            month_data[key]["cancelled"] += 1
        else:
            month_data[key]["delays"].append(e.delay_minutes or 0)

    result = []
    for month, data in sorted(month_data.items()):
        delays = data["delays"]
        avg = round(sum(delays) / len(delays), 2) if delays else 0.0
        # Format month as "Jan 2024"
        try:
            label = datetime.strptime(month, "%Y-%m").strftime("%b %Y")
        except Exception:
            label = month
        result.append(MonthlyTrend(
            month=label,
            avg_delay=avg,
            total_events=data["total"],
            cancelled=data["cancelled"],
        ))
    return result

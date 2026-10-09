from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from database import get_db
from models import DelayEvent, Stop
from schemas import StationSummary, StationDailyDelay
from typing import Optional, List
from datetime import datetime, date, timedelta

router = APIRouter(prefix="/api/stations", tags=["stations"])


@router.get("/summary", response_model=List[StationSummary])
def stations_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(DelayEvent)
    if start_date:
        q = q.filter(DelayEvent.recorded_at >= datetime.fromisoformat(start_date))
    if end_date:
        q = q.filter(DelayEvent.recorded_at <= datetime.fromisoformat(end_date + "T23:59:59"))

    events = q.all()
    stops = {s.stop_id: s for s in db.query(Stop).all()}

    agg: dict[str, dict] = {}
    for e in events:
        sid = e.stop_id
        if sid not in agg:
            agg[sid] = {"delays": [], "days": {}, "delayed": 0, "cancelled": 0}
        st = e.status or "on_time"
        if st == "delayed":
            agg[sid]["delayed"] += 1
            agg[sid]["delays"].append(e.delay_minutes or 0)
        elif st == "cancelled":
            agg[sid]["cancelled"] += 1
        else:
            agg[sid]["delays"].append(e.delay_minutes or 0)
        day_str = e.recorded_at.strftime("%Y-%m-%d") if e.recorded_at else "unknown"
        agg[sid]["days"].setdefault(day_str, []).append(e.delay_minutes or 0)

    result = []
    for sid, data in agg.items():
        stop = stops.get(sid)
        stop_name = stop.stop_name if stop else sid

        if search and search.lower() not in stop_name.lower() and search.lower() not in sid.lower():
            continue

        delays = data["delays"]
        avg_delay = round(sum(delays) / len(delays), 2) if delays else 0.0
        on_time_count = sum(1 for d in delays if d <= 5)
        on_time_pct = round(on_time_count / len(delays) * 100, 1) if delays else 0.0
        day_avgs = {day: sum(ds) / len(ds) for day, ds in data["days"].items()}
        worst_day = max(day_avgs, key=lambda k: day_avgs[k]) if day_avgs else None
        total_events = len(delays) + data["cancelled"]

        result.append(StationSummary(
            stop_id=sid,
            stop_name=stop_name,
            avg_delay=avg_delay,
            on_time_pct=on_time_pct,
            worst_day=worst_day,
            total_events=total_events,
            delayed=data["delayed"],
            cancelled=data["cancelled"],
        ))

    return sorted(result, key=lambda s: -s.avg_delay)


@router.get("/{stop_id}/detail", response_model=List[StationDailyDelay])
def station_detail(
    stop_id: str = Path(...),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=30)
    events = (
        db.query(DelayEvent)
        .filter(DelayEvent.stop_id == stop_id, DelayEvent.recorded_at >= cutoff)
        .all()
    )
    day_data: dict[str, list[float]] = {}
    for e in events:
        if (e.status or "") == "cancelled":
            continue
        day = e.recorded_at.strftime("%Y-%m-%d") if e.recorded_at else "unknown"
        day_data.setdefault(day, []).append(e.delay_minutes or 0)

    return [
        StationDailyDelay(date=day, avg_delay=round(sum(ds) / len(ds), 2))
        for day, ds in sorted(day_data.items())
    ]

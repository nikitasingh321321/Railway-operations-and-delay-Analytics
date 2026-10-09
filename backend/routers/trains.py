from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import DelayEvent, Route, Trip, Stop
from schemas import TrainSummary
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/trains", tags=["trains"])


@router.get("/summary", response_model=List[TrainSummary])
def trains_summary(
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

    # Build route lookup
    routes = {r.route_id: r for r in db.query(Route).all()}
    trips  = {t.trip_id: t for t in db.query(Trip).all()}
    stops  = {s.stop_id: s for s in db.query(Stop).all()}

    # Aggregate per route
    agg: dict[str, dict] = {}
    for e in events:
        trip = trips.get(e.trip_id)
        if not trip:
            continue
        rid = trip.route_id or e.trip_id
        if rid not in agg:
            agg[rid] = {"on_time": 0, "delayed": 0, "cancelled": 0, "delays": [], "station_delays": {}}
        st = e.status or "on_time"
        if st == "on_time":
            agg[rid]["on_time"] += 1
        elif st == "delayed":
            agg[rid]["delayed"] += 1
            agg[rid]["delays"].append(e.delay_minutes or 0)
            sname = stops.get(e.stop_id)
            skey = sname.stop_name if sname else e.stop_id
            agg[rid]["station_delays"].setdefault(skey, []).append(e.delay_minutes or 0)
        elif st == "cancelled":
            agg[rid]["cancelled"] += 1

    result = []
    for rid, data in agg.items():
        route = routes.get(rid)
        train_number = route.route_short_name if route else rid
        train_name   = route.route_long_name  if route else rid

        # Apply search filter
        if search:
            s = search.lower()
            if s not in (train_number or "").lower() and s not in (train_name or "").lower():
                continue

        total = data["on_time"] + data["delayed"] + data["cancelled"]
        delays = data["delays"]
        avg_delay = round(sum(delays) / len(delays), 2) if delays else 0.0
        non_cancelled = data["on_time"] + data["delayed"]
        on_time_pct = round(data["on_time"] / non_cancelled * 100, 1) if non_cancelled else 0.0

        worst_station = None
        if data["station_delays"]:
            worst_station = max(
                data["station_delays"],
                key=lambda k: sum(data["station_delays"][k]) / len(data["station_delays"][k])
            )

        result.append(TrainSummary(
            route_id=rid,
            train_number=train_number or rid,
            train_name=train_name or rid,
            total_events=total,
            on_time=data["on_time"],
            delayed=data["delayed"],
            cancelled=data["cancelled"],
            avg_delay=avg_delay,
            on_time_pct=on_time_pct,
            worst_station=worst_station,
        ))

    return sorted(result, key=lambda x: -x.avg_delay)

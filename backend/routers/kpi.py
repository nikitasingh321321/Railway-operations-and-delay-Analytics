from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import DelayEvent, Trip, Route
from schemas import KPISummary
from datetime import datetime, date
from typing import Optional

router = APIRouter(prefix="/api/kpi", tags=["kpi"])


@router.get("/summary", response_model=KPISummary)
def kpi_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(DelayEvent)

    if start_date:
        query = query.filter(DelayEvent.recorded_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(DelayEvent.recorded_at <= datetime.fromisoformat(end_date + "T23:59:59"))

    if not start_date and not end_date:
        today = date.today()
        query = query.filter(
            DelayEvent.recorded_at >= datetime(today.year, today.month, today.day)
        )

    all_events = query.all()

    if not all_events:
        return KPISummary(
            total_trains=0,
            on_time_trains=0,
            delayed_trains=0,
            cancelled_trains=0,
            on_time_pct=0.0,
            avg_delay_minutes=0.0,
            total_trips_today=0,
            worst_route=None,
        )

    total = len(all_events)
    on_time_events  = [e for e in all_events if (e.status or "on_time") == "on_time"]
    delayed_events  = [e for e in all_events if (e.status or "on_time") == "delayed"]
    cancelled_events = [e for e in all_events if (e.status or "on_time") == "cancelled"]

    # unique trip counts per status
    total_trips    = len(set(e.trip_id for e in all_events))
    on_time_trips  = len(set(e.trip_id for e in on_time_events))
    delayed_trips  = len(set(e.trip_id for e in delayed_events))
    cancelled_trips = len(set(e.trip_id for e in cancelled_events))

    non_cancelled = [e for e in all_events if (e.status or "") != "cancelled"]
    on_time_pct = round(len(on_time_events) / len(non_cancelled) * 100, 1) if non_cancelled else 0.0
    avg_delay = round(sum((e.delay_minutes or 0) for e in delayed_events) / len(delayed_events), 2) if delayed_events else 0.0

    # worst route by avg delay
    route_delays: dict[str, list[float]] = {}
    for e in delayed_events:
        route_delays.setdefault(e.trip_id, []).append(e.delay_minutes or 0)

    worst_route = None
    if route_delays:
        worst_trip_id = max(route_delays, key=lambda k: sum(route_delays[k]) / len(route_delays[k]))
        trip_obj = db.query(Trip).filter(Trip.trip_id == worst_trip_id).first()
        if trip_obj and trip_obj.route:
            worst_route = f"{trip_obj.route.route_short_name} - {trip_obj.route.route_long_name}"
        else:
            worst_route = worst_trip_id

    return KPISummary(
        total_trains=total_trips,
        on_time_trains=on_time_trips,
        delayed_trains=delayed_trips,
        cancelled_trains=cancelled_trips,
        on_time_pct=on_time_pct,
        avg_delay_minutes=avg_delay,
        total_trips_today=total_trips,
        worst_route=worst_route,
    )

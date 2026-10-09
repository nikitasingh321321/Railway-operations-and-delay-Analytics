from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from database import get_db
from models import Route, Trip, StopTime, Stop, DelayEvent
from schemas import RouteItem, TripItem, ScheduleStop
from typing import List, Optional

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


@router.get("/routes", response_model=List[RouteItem])
def list_routes(db: Session = Depends(get_db)):
    routes = db.query(Route).order_by(Route.route_short_name).all()
    return [
        RouteItem(
            route_id=r.route_id,
            route_short_name=r.route_short_name,
            route_long_name=r.route_long_name,
        )
        for r in routes
    ]


@router.get("/routes/{route_id}/trips", response_model=List[TripItem])
def trips_for_route(route_id: str = Path(...), db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.route_id == route_id).limit(100).all()
    return [
        TripItem(
            trip_id=t.trip_id,
            trip_headsign=t.trip_headsign,
            direction_id=t.direction_id,
        )
        for t in trips
    ]


@router.get("/trip/{trip_id}", response_model=List[ScheduleStop])
def schedule_vs_actual(trip_id: str = Path(...), db: Session = Depends(get_db)):
    stop_times = (
        db.query(StopTime)
        .filter(StopTime.trip_id == trip_id)
        .order_by(StopTime.stop_sequence)
        .all()
    )

    stops_map = {s.stop_id: s for s in db.query(Stop).all()}

    # Latest delay events for this trip keyed by stop_id
    delay_map: dict[str, DelayEvent] = {}
    for de in db.query(DelayEvent).filter(DelayEvent.trip_id == trip_id).all():
        # Keep the most recent event per stop
        if de.stop_id not in delay_map or (de.recorded_at and (delay_map[de.stop_id].recorded_at is None or de.recorded_at > delay_map[de.stop_id].recorded_at)):
            delay_map[de.stop_id] = de

    result = []
    for st in stop_times:
        stop = stops_map.get(st.stop_id)
        de = delay_map.get(st.stop_id)
        result.append(ScheduleStop(
            stop_sequence=st.stop_sequence or 0,
            stop_id=st.stop_id,
            stop_name=stop.stop_name if stop else st.stop_id,
            scheduled_arrival=st.arrival_time,
            actual_arrival=de.actual_arrival.strftime("%H:%M:%S") if de and de.actual_arrival else None,
            delay_minutes=de.delay_minutes if de else None,
            status=de.status if de else None,
        ))

    return result

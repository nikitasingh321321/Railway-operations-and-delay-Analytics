from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── KPI ───────────────────────────────────────────────────────────────────────

class KPISummary(BaseModel):
    total_trains: int
    on_time_trains: int
    delayed_trains: int
    cancelled_trains: int
    on_time_pct: float
    avg_delay_minutes: float
    worst_route: Optional[str]
    total_trips_today: int


# ── Delays ────────────────────────────────────────────────────────────────────

class DelayBucket(BaseModel):
    bucket: str
    count: int


class DelayByHour(BaseModel):
    hour: int
    avg_delay: float


class DelayCause(BaseModel):
    cause: str
    count: int


class MonthlyTrend(BaseModel):
    month: str
    avg_delay: float
    total_events: int
    cancelled: int


# ── Train Analysis ────────────────────────────────────────────────────────────

class TrainSummary(BaseModel):
    route_id: str
    train_number: str
    train_name: str
    total_events: int
    on_time: int
    delayed: int
    cancelled: int
    avg_delay: float
    on_time_pct: float
    worst_station: Optional[str]


# ── Stations ──────────────────────────────────────────────────────────────────

class StationSummary(BaseModel):
    stop_id: str
    stop_name: str
    avg_delay: float
    on_time_pct: float
    worst_day: Optional[str]
    total_events: int
    delayed: int
    cancelled: int


class StationDailyDelay(BaseModel):
    date: str
    avg_delay: float


# ── Schedule ──────────────────────────────────────────────────────────────────

class RouteItem(BaseModel):
    route_id: str
    route_short_name: Optional[str]
    route_long_name: Optional[str]


class TripItem(BaseModel):
    trip_id: str
    trip_headsign: Optional[str]
    direction_id: Optional[int]


class ScheduleStop(BaseModel):
    stop_sequence: int
    stop_id: str
    stop_name: str
    scheduled_arrival: Optional[str]
    actual_arrival: Optional[str]
    delay_minutes: Optional[float]
    status: Optional[str]


# ── Ingest ────────────────────────────────────────────────────────────────────

class IngestStatus(BaseModel):
    last_poll: Optional[str]
    events_today: int
    message: str

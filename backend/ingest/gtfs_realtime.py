import logging
import requests
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import DelayEvent, StopTime

logger = logging.getLogger(__name__)

_last_poll: datetime | None = None


def get_last_poll() -> datetime | None:
    return _last_poll


def poll_gtfs_rt(feed_url: str, db: Session, api_key: str = "") -> int:
    """
    Fetch GTFS-RT TripUpdates protobuf, parse each StopTimeUpdate,
    look up the scheduled StopTime and write a DelayEvent row.
    Returns number of new events written.
    """
    global _last_poll

    try:
        from google.transit import gtfs_realtime_pb2  # type: ignore
    except ImportError:
        logger.error("gtfs-realtime-bindings not installed")
        return 0

    headers = {}
    if api_key:
        headers["Authorization"] = f"apiKey {api_key}"

    try:
        resp = requests.get(feed_url, headers=headers, timeout=30)
        resp.raise_for_status()
    except Exception as exc:
        logger.warning(f"GTFS-RT fetch failed: {exc}")
        return 0

    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(resp.content)

    written = 0
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for entity in feed.entity:
        if not entity.HasField("trip_update"):
            continue
        trip_update = entity.trip_update
        trip_id = trip_update.trip.trip_id

        for stu in trip_update.stop_time_update:
            stop_id = stu.stop_id
            stop_sequence = stu.stop_sequence if stu.stop_sequence else None

            # Look up scheduled stop time
            query = db.query(StopTime).filter(StopTime.trip_id == trip_id)
            if stop_sequence:
                query = query.filter(StopTime.stop_sequence == stop_sequence)
            elif stop_id:
                query = query.filter(StopTime.stop_id == stop_id)
            scheduled_st = query.first()

            if scheduled_st is None:
                continue

            # Actual arrival from RT
            actual_arrival = None
            delay_minutes = 0.0
            if stu.HasField("arrival") and stu.arrival.time:
                actual_arrival = datetime.utcfromtimestamp(stu.arrival.time)
                delay_sec = stu.arrival.delay if stu.arrival.HasField("delay") else 0
                delay_minutes = round(delay_sec / 60.0, 2)

            # Skip exact duplicate
            exists = db.query(DelayEvent).filter(
                DelayEvent.trip_id == trip_id,
                DelayEvent.stop_id == scheduled_st.stop_id,
                DelayEvent.recorded_at == now,
            ).first()
            if exists:
                continue

            event = DelayEvent(
                trip_id=trip_id,
                stop_id=scheduled_st.stop_id,
                actual_arrival=actual_arrival,
                delay_minutes=delay_minutes,
                delay_cause="Unknown",
                recorded_at=now,
            )
            db.add(event)
            written += 1

        if written % 100 == 0 and written > 0:
            db.commit()

    db.commit()
    _last_poll = now
    logger.info(f"GTFS-RT poll: wrote {written} delay events")
    return written

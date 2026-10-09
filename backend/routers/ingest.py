import os
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from ingest.gtfs_static import ingest_gtfs_static
from ingest.gtfs_realtime import poll_gtfs_rt, get_last_poll
from schemas import IngestStatus
from models import DelayEvent
from datetime import datetime, date

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post("/static")
def trigger_static_ingest(
    feed_url: str | None = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    url = feed_url or os.getenv("GTFS_STATIC_URL", "")
    if not url:
        raise HTTPException(status_code=400, detail="No feed_url provided and GTFS_STATIC_URL not set in .env")
    try:
        counts = ingest_gtfs_static(url, db)
        return {"status": "ok", "counts": counts}
    except Exception as exc:
        logger.exception("Static ingest failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/realtime/status", response_model=IngestStatus)
def realtime_status(db: Session = Depends(get_db)):
    today = date.today()
    events_today = (
        db.query(DelayEvent)
        .filter(DelayEvent.recorded_at >= datetime(today.year, today.month, today.day))
        .count()
    )
    last_poll = get_last_poll()
    return IngestStatus(
        last_poll=last_poll.isoformat() if last_poll else None,
        events_today=events_today,
        message="OK",
    )


@router.post("/realtime/poll")
def manual_rt_poll(db: Session = Depends(get_db)):
    rt_url = os.getenv("GTFS_RT_URL", "")
    api_key = os.getenv("GTFS_RT_API_KEY", "")
    if not rt_url:
        raise HTTPException(status_code=400, detail="GTFS_RT_URL not set in .env")
    written = poll_gtfs_rt(rt_url, db, api_key)
    return {"status": "ok", "events_written": written}

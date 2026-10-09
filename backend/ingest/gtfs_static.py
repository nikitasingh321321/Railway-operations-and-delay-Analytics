import zipfile
import io
import logging
import pandas as pd
import requests
from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from models import Agency, Route, Trip, Stop, StopTime, Calendar

logger = logging.getLogger(__name__)


def _upsert(session: Session, model, rows: list[dict], pk_fields: list[str]):
    """Bulk upsert rows into the given model table."""
    if not rows:
        return
    table = model.__table__
    stmt = sqlite_insert(table).values(rows)
    # On conflict do nothing (idempotent re-runs)
    stmt = stmt.on_conflict_do_nothing()
    session.execute(stmt)
    session.commit()


def ingest_gtfs_static(feed_url: str, db: Session) -> dict:
    logger.info(f"Downloading GTFS static feed from {feed_url}")
    resp = requests.get(feed_url, timeout=60, stream=True)
    resp.raise_for_status()
    raw = io.BytesIO(resp.content)

    counts = {}
    with zipfile.ZipFile(raw) as zf:
        names = zf.namelist()

        # ── agency.txt ────────────────────────────────────────────────────────
        if "agency.txt" in names:
            df = pd.read_csv(zf.open("agency.txt"), dtype=str).fillna("")
            df = df.rename(columns=lambda c: c.strip())
            if "agency_id" not in df.columns:
                df["agency_id"] = "default"
            rows = df[["agency_id", "agency_name", "agency_url"]].to_dict("records") if "agency_url" in df.columns \
                else [{"agency_id": r.get("agency_id", "default"), "agency_name": r.get("agency_name", ""), "agency_url": ""} for _, r in df.iterrows()]
            _upsert(db, Agency, rows, ["agency_id"])
            counts["agency"] = len(rows)
            logger.info(f"  agency: {len(rows)} rows")

        # ── routes.txt ────────────────────────────────────────────────────────
        if "routes.txt" in names:
            df = pd.read_csv(zf.open("routes.txt"), dtype=str).fillna("")
            df = df.rename(columns=lambda c: c.strip())
            keep = ["route_id", "route_short_name", "route_long_name", "route_type"]
            optional = ["agency_id"]
            for col in optional:
                if col not in df.columns:
                    df[col] = None
            df["route_type"] = pd.to_numeric(df["route_type"], errors="coerce").fillna(0).astype(int)
            rows = df[[*keep, "agency_id"]].to_dict("records")
            _upsert(db, Route, rows, ["route_id"])
            counts["routes"] = len(rows)
            logger.info(f"  routes: {len(rows)} rows")

        # ── trips.txt ─────────────────────────────────────────────────────────
        if "trips.txt" in names:
            df = pd.read_csv(zf.open("trips.txt"), dtype=str).fillna("")
            df = df.rename(columns=lambda c: c.strip())
            for col in ["trip_headsign", "direction_id"]:
                if col not in df.columns:
                    df[col] = None
            df["direction_id"] = pd.to_numeric(df["direction_id"], errors="coerce").fillna(0).astype(int)
            rows = df[["trip_id", "route_id", "service_id", "trip_headsign", "direction_id"]].to_dict("records")
            _upsert(db, Trip, rows, ["trip_id"])
            counts["trips"] = len(rows)
            logger.info(f"  trips: {len(rows)} rows")

        # ── stops.txt ─────────────────────────────────────────────────────────
        if "stops.txt" in names:
            df = pd.read_csv(zf.open("stops.txt"), dtype=str).fillna("")
            df = df.rename(columns=lambda c: c.strip())
            df["stop_lat"] = pd.to_numeric(df.get("stop_lat", 0), errors="coerce").fillna(0.0)
            df["stop_lon"] = pd.to_numeric(df.get("stop_lon", 0), errors="coerce").fillna(0.0)
            rows = df[["stop_id", "stop_name", "stop_lat", "stop_lon"]].to_dict("records")
            _upsert(db, Stop, rows, ["stop_id"])
            counts["stops"] = len(rows)
            logger.info(f"  stops: {len(rows)} rows")

        # ── stop_times.txt — chunked ──────────────────────────────────────────
        if "stop_times.txt" in names:
            total = 0
            chunksize = 10_000
            for chunk in pd.read_csv(
                zf.open("stop_times.txt"), dtype=str, chunksize=chunksize
            ):
                chunk = chunk.rename(columns=lambda c: c.strip()).fillna("")
                chunk["stop_sequence"] = pd.to_numeric(
                    chunk["stop_sequence"], errors="coerce"
                ).fillna(0).astype(int)
                keep_cols = ["trip_id", "stop_id", "arrival_time", "departure_time", "stop_sequence"]
                for col in keep_cols:
                    if col not in chunk.columns:
                        chunk[col] = None
                rows = chunk[keep_cols].to_dict("records")
                if rows:
                    session_rows = []
                    for r in rows:
                        session_rows.append(StopTime(
                            trip_id=r["trip_id"],
                            stop_id=r["stop_id"],
                            arrival_time=r.get("arrival_time", ""),
                            departure_time=r.get("departure_time", ""),
                            stop_sequence=r.get("stop_sequence", 0),
                        ))
                    db.bulk_save_objects(session_rows)
                    db.commit()
                    total += len(rows)
            counts["stop_times"] = total
            logger.info(f"  stop_times: {total} rows")

        # ── calendar.txt ──────────────────────────────────────────────────────
        if "calendar.txt" in names:
            df = pd.read_csv(zf.open("calendar.txt"), dtype=str).fillna("0")
            df = df.rename(columns=lambda c: c.strip())
            bool_cols = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            for col in bool_cols:
                if col not in df.columns:
                    df[col] = False
                else:
                    df[col] = df[col].astype(str).map({"1": True, "0": False}).fillna(False)
            rows = df[["service_id", *bool_cols, "start_date", "end_date"]].to_dict("records") if "start_date" in df.columns \
                else [{"service_id": r["service_id"], **{c: r[c] for c in bool_cols}, "start_date": "", "end_date": ""} for _, r in df.iterrows()]
            _upsert(db, Calendar, rows, ["service_id"])
            counts["calendar"] = len(rows)
            logger.info(f"  calendar: {len(rows)} rows")

    return counts

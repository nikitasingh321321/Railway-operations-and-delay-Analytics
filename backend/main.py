import asyncio
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models before create_all so tables are registered
import models  # noqa: F401
from database import engine, Base, SessionLocal
from routers import ingest, kpi, delays, stations, schedule, trains


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified.")

    # Start GTFS-RT background polling if URL is configured
    rt_url = os.getenv("GTFS_RT_URL", "")
    api_key = os.getenv("GTFS_RT_API_KEY", "")
    if rt_url:
        asyncio.create_task(_rt_poll_loop(rt_url, api_key))
        logger.info("GTFS-RT background polling started.")
    else:
        logger.info("GTFS_RT_URL not set — skipping real-time polling. Use seed_demo.py to generate demo data.")

    yield


async def _rt_poll_loop(rt_url: str, api_key: str):
    from ingest.gtfs_realtime import poll_gtfs_rt
    while True:
        db = SessionLocal()
        try:
            poll_gtfs_rt(rt_url, db, api_key)
        except Exception as exc:
            logger.warning(f"RT poll error: {exc}")
        finally:
            db.close()
        await asyncio.sleep(30)


app = FastAPI(
    title="Railway Operations & Delay Analytics API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(ingest.router)
app.include_router(kpi.router)
app.include_router(delays.router)
app.include_router(stations.router)
app.include_router(schedule.router)
app.include_router(trains.router)


@app.get("/health")
def health():
    return {"status": "ok"}

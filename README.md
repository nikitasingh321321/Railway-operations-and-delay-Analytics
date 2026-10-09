# Railway Operations & Delay Analytics

A full-stack web application for analysing railway operations and train delays.
Built with **Python + FastAPI** (backend) and **React + TypeScript + Vite** (frontend).

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Project Structure

```
railway-analytics/
├── backend/          # FastAPI + SQLAlchemy + SQLite
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── schemas.py
│   ├── ingest/
│   ├── routers/
│   ├── seed_demo.py
│   └── requirements.txt
└── frontend/         # React + TypeScript + Vite + Recharts + Tailwind
    ├── src/
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Setup & Run

### 1. Backend

```bash
# Create and activate a virtual environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and (optionally) set GTFS feed URLs
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Swagger UI (interactive docs): **http://localhost:8000/docs**

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at **http://localhost:5173**

---

## Loading Data

### Option A — Real GTFS Feed (recommended)

1. Edit `backend/.env` and set `GTFS_STATIC_URL` to a public GTFS zip URL  
   Example feeds:
   - UK National Rail: https://data.atoc.org/rail-industry-data
   - OpenMobilityData: https://openmobilitydata.org/

2. Trigger the ingest via Swagger UI or curl:

```bash
curl -X POST "http://localhost:8000/api/ingest/static?feed_url=YOUR_URL"
```

3. Check ingestion status:

```bash
curl http://localhost:8000/api/ingest/realtime/status
```

### Option B — Demo / Offline Seed Data

After ingesting at least static GTFS data, run the demo seeder to generate
500 synthetic delay events spread over the last 30 days:

```bash
cd backend
python seed_demo.py
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/ingest/static | Load GTFS static feed |
| GET | /api/ingest/realtime/status | RT poll status |
| GET | /api/kpi/summary | KPI summary cards |
| GET | /api/delays/distribution | Delay distribution buckets |
| GET | /api/delays/by-hour | Avg delay per hour |
| GET | /api/delays/causes | Delay causes breakdown |
| GET | /api/stations/summary | Per-station stats |
| GET | /api/stations/{stop_id}/detail | Station 30-day trend |
| GET | /api/schedule/routes | Route list |
| GET | /api/schedule/routes/{route_id}/trips | Trips for a route |
| GET | /api/schedule/trip/{trip_id} | Schedule vs actuals |

All analytics endpoints accept optional `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` query params.

---

## Environment Variables (`backend/.env`)

```env
GTFS_STATIC_URL=https://...   # URL to a GTFS static zip file
GTFS_RT_URL=                  # Optional: GTFS-RT TripUpdates feed URL
GTFS_RT_API_KEY=              # Optional: API key for the RT feed
```

The `.env` file is listed in `.gitignore` and should never be committed.

---

## Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | / | KPI summary cards + quick start guide |
| Delay Analytics | /delays | Distribution, by-hour, and causes charts |
| Station Analytics | /stations | Sortable station table + 30-day trend |
| Schedule vs Actuals | /schedule | Gantt-style trip timeline |

---

## No AI/ML

All analytics are purely rule-based aggregations — no machine learning or AI features.
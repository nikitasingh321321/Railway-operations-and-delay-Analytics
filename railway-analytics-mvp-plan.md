# Railway Operations & Delay Analytics — MVP Plan

## Top-Level Overview

Build a full-stack web application that ingests a public GTFS / GTFS-RT transit feed,
stores it in a local relational database, and presents a React + TypeScript analytics
dashboard with four core views:

1. KPI Summary Cards
2. Delay Analytics Charts
3. Station Analytics
4. Schedule vs Actuals (Gantt-style timeline)

**Stack:**
- Backend: Python 3.11 + FastAPI + SQLAlchemy + SQLite (local, zero-config)
- Frontend: React 18 + TypeScript + Vite + Recharts + Tailwind CSS
- Data Standard: GTFS static + GTFS-RT (real-time protobuf feed)
- Runtime: Both servers run on localhost (backend :8000, frontend :5173)

**Non-goals for MVP:**
- No AI/ML features
- No user authentication
- No cloud deployment
- No multi-operator support

---

## Architecture Diagram (Text)

```
Public GTFS Feed (static zip + RT protobuf)
        |
        v
[ Python Ingestion Service ]
        |
        v
[ SQLite Database ]
        |
        v
[ FastAPI REST + WebSocket ]
        |
        v
[ React + TypeScript + Vite Frontend ]
        |
        v
[ Browser on localhost:5173 ]
```

---

## Project Folder Structure

```
railway-analytics/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models.py                # ORM table definitions
│   ├── ingest/
│   │   ├── gtfs_static.py       # Parse and load GTFS zip
│   │   └── gtfs_realtime.py     # Poll and parse GTFS-RT protobuf
│   ├── routers/
│   │   ├── kpi.py               # /api/kpi endpoints
│   │   ├── delays.py            # /api/delays endpoints
│   │   ├── stations.py          # /api/stations endpoints
│   │   └── schedule.py          # /api/schedule endpoints
│   ├── schemas.py               # Pydantic response models
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                 # Axios API client functions
│   │   ├── components/
│   │   │   ├── KPICards.tsx
│   │   │   ├── DelayCharts.tsx
│   │   │   ├── StationAnalytics.tsx
│   │   │   └── ScheduleGantt.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Delays.tsx
│   │   │   ├── Stations.tsx
│   │   │   └── Schedule.tsx
│   │   └── types/               # Shared TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding

**Status:** [x] complete

**Intent:**
Set up the complete project skeleton so that both backend and frontend can be started
immediately with a single command each. This is the foundation every other sub-task
builds on.

**Expected Outcomes:**
- `backend/` folder with a running FastAPI server at `http://localhost:8000`
- `backend/health` endpoint returns `{ "status": "ok" }`
- `frontend/` folder bootstrapped with Vite + React + TypeScript
- Frontend dev server starts at `http://localhost:5173` with a placeholder page
- `README.md` has commands to install dependencies and start both servers

**Todo List:**
1. Create `backend/` directory with `requirements.txt` listing:
   fastapi, uvicorn, sqlalchemy, gtfs-realtime-bindings, requests, protobuf, pandas, python-dotenv
2. Create `backend/main.py` with a minimal FastAPI app, CORS middleware allowing localhost:5173, and a `/health` GET route
3. Create `frontend/` using `npm create vite@latest frontend -- --template react-ts`
4. Install frontend dependencies: tailwindcss, postcss, autoprefixer, recharts, axios, react-router-dom
5. Configure Tailwind CSS (tailwind.config.js + index.css)
6. Add Vite proxy in `vite.config.ts` to forward `/api/*` to `http://localhost:8000`
7. Create `README.md` with setup and run instructions

**Relevant Context:**
- Vite proxy avoids CORS complexity in development
- SQLite requires no separate database server process

---

### Sub-Task 2 — Database Schema & Models

**Status:** [x] complete

**Intent:**
Define the relational schema that stores GTFS static data and real-time delay events.
All analytics queries in later sub-tasks are built on top of these tables.

**Expected Outcomes:**
- `backend/database.py` creates an SQLite file `railway.db` on startup
- `backend/models.py` defines all ORM models
- Tables are created automatically when the backend starts

**Todo List:**
1. Create `backend/database.py` with SQLAlchemy engine pointed at `./railway.db` and a `SessionLocal` factory
2. Create `backend/models.py` with the following tables:

   **Agency** — agency_id, agency_name, agency_url

   **Routes** — route_id, route_short_name, route_long_name, route_type

   **Trips** — trip_id, route_id (FK), service_id, trip_headsign, direction_id

   **Stops** — stop_id, stop_name, stop_lat, stop_lon

   **StopTimes** — id, trip_id (FK), stop_id (FK), arrival_time, departure_time, stop_sequence

   **Calendar** — service_id, monday..sunday, start_date, end_date

   **DelayEvent** — id, trip_id (FK), stop_id (FK), scheduled_arrival, actual_arrival,
     delay_minutes (computed), delay_cause, recorded_at

3. Wire `Base.metadata.create_all(engine)` in `main.py` on startup

**Relevant Context:**
- `StopTimes.arrival_time` stores the GTFS string format (HH:MM:SS, may exceed 24:00:00)
- `DelayEvent` is the central table for all analytics — populated by the GTFS-RT ingestion job

---

### Sub-Task 3 — GTFS Static Data Ingestion

**Status:** [x] complete

**Intent:**
Download and parse a public GTFS static zip file and load all schedule data into the
SQLite database. This provides the baseline timetable that delay calculations compare against.

**Expected Outcomes:**
- `backend/ingest/gtfs_static.py` downloads and parses the GTFS zip
- Running the script populates Agency, Routes, Trips, Stops, StopTimes, Calendar tables
- A FastAPI POST endpoint `/api/ingest/static` triggers the ingestion on demand
- Console log confirms row counts per table after ingestion

**Todo List:**
1. Create `backend/ingest/gtfs_static.py` with a function `ingest_gtfs_static(feed_url, db_session)`
2. Download the zip from the feed URL into memory using `requests`
3. Use `pandas.read_csv` to parse each GTFS text file from the zip (agency.txt, routes.txt, trips.txt, stops.txt, stop_times.txt, calendar.txt)
4. Bulk-insert rows into each ORM table using SQLAlchemy (upsert on primary key to support re-runs)
5. Add `POST /api/ingest/static` route in a new router `backend/routers/ingest.py` that accepts a `feed_url` query param and calls the ingestion function
6. Use a default public GTFS feed URL (e.g. OpenMobilityData or GTFS for a public metro/rail system) stored in `.env`

**Relevant Context:**
- GTFS stop_times.txt can be very large (millions of rows) — use chunked pandas read with `chunksize=10000`
- The feed URL will be stored in a `.env` file and read via `python-dotenv`

---

### Sub-Task 4 — GTFS-RT Real-Time Delay Ingestion

**Status:** [x] complete

**Intent:**
Poll a GTFS-RT TripUpdates feed at a regular interval, parse the protobuf binary, and
write delay events to the `DelayEvent` table. This is what powers the live and
historical delay analytics.

**Expected Outcomes:**
- `backend/ingest/gtfs_realtime.py` polls the GTFS-RT feed URL every 30 seconds
- Each TripUpdate's StopTimeUpdate is matched to a scheduled StopTime to compute `delay_minutes`
- New `DelayEvent` rows are written to the database
- A `GET /api/ingest/realtime/status` endpoint reports last poll time and record count

**Todo List:**
1. Create `backend/ingest/gtfs_realtime.py` with a function `poll_gtfs_rt(feed_url, db_session)`
2. Fetch the binary protobuf from the RT feed URL using `requests`
3. Parse with `google.transit.gtfs_realtime_pb2.FeedMessage`
4. For each `TripUpdate.StopTimeUpdate`, look up the matching `StopTimes` row using trip_id + stop_sequence
5. Compute `delay_minutes = actual_arrival - scheduled_arrival`
6. Insert a `DelayEvent` row (skip duplicates where trip_id + stop_id + recorded_at already exists)
7. Schedule the poll loop using Python `asyncio` background task started in `main.py` lifespan
8. Add `GET /api/ingest/realtime/status` route returning `{ last_poll, events_today }`

**Relevant Context:**
- `gtfs-realtime-bindings` provides the Python protobuf classes
- Some public GTFS-RT feeds require a free API key — store in `.env`
- If no GTFS-RT feed is available, provide a script to generate synthetic DelayEvent rows from existing StopTimes for demo purposes

---

### Sub-Task 5 — KPI Summary API & Cards

**Status:** [x] complete

**Intent:**
Build the first dashboard view: four top-level KPI cards that give an instant snapshot
of network health. This is the landing page of the application.

**Expected Outcomes:**
- `GET /api/kpi/summary` returns on-time percentage, average delay, total trips today, worst route
- `KPICards.tsx` renders four metric cards with a label, value, and trend indicator
- The Dashboard page fetches and displays the cards on load

**Todo List:**
1. Create `backend/routers/kpi.py` with `GET /api/kpi/summary` that queries `DelayEvent`:
   - on_time_pct: % of events where delay_minutes <= 5
   - avg_delay_minutes: mean of delay_minutes for today
   - total_trips_today: distinct trip_ids in DelayEvent for today
   - worst_route: route with highest average delay today
2. Create `backend/schemas.py` with a `KPISummary` Pydantic model
3. Create `frontend/src/api/kpi.ts` with an axios GET call to `/api/kpi/summary`
4. Create `frontend/src/components/KPICards.tsx` rendering 4 stat cards using Tailwind
5. Create `frontend/src/pages/Dashboard.tsx` that uses `useEffect` + `useState` to fetch and display KPICards
6. Add React Router route `/` → `Dashboard`

**Relevant Context:**
- On-time threshold of 5 minutes is the standard railway KPI benchmark
- Cards should show a neutral placeholder state while data is loading

---

### Sub-Task 6 — Delay Analytics Charts

**Status:** [x] complete

**Intent:**
Build the Delay Analytics page with three charts: delay distribution histogram,
delay-by-hour bar chart, and delay causes breakdown donut chart.

**Expected Outcomes:**
- `GET /api/delays/distribution` returns bucketed delay counts
- `GET /api/delays/by-hour` returns average delay per hour of day
- `GET /api/delays/causes` returns count per delay_cause category
- `DelayCharts.tsx` renders all three Recharts visualisations on the `/delays` page

**Todo List:**
1. Create `backend/routers/delays.py` with three endpoints:
   - `/api/delays/distribution`: group DelayEvent by delay bucket (0-5, 5-15, 15-30, 30-60, 60+)
   - `/api/delays/by-hour`: group by hour(recorded_at), return avg delay_minutes
   - `/api/delays/causes`: group by delay_cause, return count
   - All endpoints accept optional `?date=YYYY-MM-DD` query param to filter by date
2. Add corresponding Pydantic response schemas
3. Create `frontend/src/api/delays.ts` with axios calls for all three endpoints
4. Create `frontend/src/components/DelayCharts.tsx` with:
   - BarChart (Recharts) for distribution buckets
   - LineChart for delay by hour
   - PieChart / RadialBarChart for causes breakdown
5. Create `frontend/src/pages/Delays.tsx` with a date picker and the three charts
6. Add React Router route `/delays` → `Delays`

**Relevant Context:**
- Recharts `ResponsiveContainer` should wrap every chart for fluid layout
- `delay_cause` in the synthetic data generator should include: Weather, Infrastructure, Congestion, Mechanical, Staff, Unknown

---

### Sub-Task 7 — Station Analytics

**Status:** [x] complete

**Intent:**
Build the Station Analytics page showing per-station delay statistics, a sortable
station ranking table, and a dwell time analysis chart.

**Expected Outcomes:**
- `GET /api/stations/summary` returns a list of stations with avg delay, worst day, on-time %
- `GET /api/stations/{stop_id}/detail` returns time-series delay data for one station
- `StationAnalytics.tsx` renders a searchable/sortable table and a detail chart on row click

**Todo List:**
1. Create `backend/routers/stations.py` with:
   - `/api/stations/summary`: join Stops + DelayEvent, aggregate per stop_id
   - `/api/stations/{stop_id}/detail`: return daily avg delay for the last 30 days for one stop
2. Add Pydantic schemas for station summary list and station detail
3. Create `frontend/src/api/stations.ts` with axios calls
4. Create `frontend/src/components/StationAnalytics.tsx` with:
   - Searchable input to filter stations by name
   - Sortable table columns: Station Name, Avg Delay, On-Time %, Worst Day
   - Click a row → show a LineChart of daily avg delay for that station (last 30 days)
5. Create `frontend/src/pages/Stations.tsx`
6. Add React Router route `/stations` → `Stations`

**Relevant Context:**
- Use React `useState` for selected station and sort column
- Table sorting is pure client-side — no extra API call needed

---

### Sub-Task 8 — Schedule vs Actuals Gantt View

**Status:** [x] complete

**Intent:**
Build the Schedule vs Actuals page showing a Gantt-style timeline that overlays
scheduled arrival/departure bars with actual arrival markers for a selected trip or route.

**Expected Outcomes:**
- `GET /api/schedule/trip/{trip_id}` returns stop sequence with scheduled and actual times
- `GET /api/schedule/routes` returns list of routes with trip options for dropdowns
- `ScheduleGantt.tsx` renders a horizontal bar chart simulating a Gantt view
- User selects a route then a trip from two dropdowns to populate the chart

**Todo List:**
1. Create `backend/routers/schedule.py` with:
   - `/api/schedule/routes`: list distinct route_ids + route_short_name
   - `/api/schedule/routes/{route_id}/trips`: list trips for a route
   - `/api/schedule/trip/{trip_id}`: join StopTimes + DelayEvent for each stop, return scheduled_arrival, actual_arrival, delay_minutes, stop_name, stop_sequence
2. Add Pydantic schemas for the schedule response
3. Create `frontend/src/api/schedule.ts` with axios calls
4. Create `frontend/src/components/ScheduleGantt.tsx`:
   - Two dropdowns: Route selector → Trip selector (trip list loads after route selected)
   - Use Recharts `BarChart` in horizontal layout with two bars per stop: scheduled (grey) and actual (colour-coded by delay severity)
   - X-axis = time in minutes from trip start, Y-axis = stop names
5. Create `frontend/src/pages/Schedule.tsx`
6. Add React Router route `/schedule` → `Schedule`

**Relevant Context:**
- GTFS arrival_time strings like "06:30:00" need to be converted to minutes-from-midnight for numeric chart axis
- Colour coding: green <= 5 min delay, amber 5-15 min, red > 15 min

---

### Sub-Task 9 — Navigation, Layout & Polish

**Status:** [x] complete

**Intent:**
Wire all pages together with a persistent sidebar navigation, apply consistent Tailwind
styling, and add a global date range filter that all pages respect.

**Expected Outcomes:**
- Sidebar with links to Dashboard, Delays, Stations, Schedule
- Active link is highlighted
- Global date range filter (start date + end date) stored in React Context and passed as query params to all API calls
- Loading spinners on all data-fetching components
- Empty/error states handled gracefully on all pages
- Page titles and favicon set correctly

**Todo List:**
1. Create `frontend/src/components/Sidebar.tsx` with NavLink items for all four routes
2. Create `frontend/src/components/Layout.tsx` wrapping pages with Sidebar + main content area
3. Create `frontend/src/context/FilterContext.tsx` with a `DateRangeContext` holding `startDate`, `endDate`, and a setter
4. Wrap `App.tsx` with `FilterContext.Provider`
5. Add a date range picker component in the top bar that updates FilterContext
6. Update all API functions to accept and pass `start_date` / `end_date` query params
7. Update all backend endpoints to accept optional `start_date` / `end_date` and filter queries accordingly
8. Add loading state (spinner) and error boundary to each page component
9. Set `index.html` title to "Railway Analytics" and add a train emoji favicon

**Relevant Context:**
- React Router `NavLink` provides `isActive` prop for highlight styling
- FilterContext is read-only from child pages; only the top bar updates it

---

### Sub-Task 10 — README & Local Run Verification

**Status:** [x] complete

**Intent:**
Ensure a developer can clone the project and run both servers from scratch with clear
documented commands. Verify end-to-end data flow works on localhost.

**Expected Outcomes:**
- `README.md` has Prerequisites, Installation, Running, and Seed Data sections
- Developer runs backend and frontend with two terminal commands
- Visiting `http://localhost:5173` shows the dashboard with data
- All four pages render without console errors

**Todo List:**
1. Write `README.md` with:
   - Prerequisites: Python 3.11+, Node 18+, npm
   - Backend setup: `cd backend && python -m venv venv && pip install -r requirements.txt`
   - Backend run: `uvicorn main:app --reload --port 8000`
   - Frontend setup: `cd frontend && npm install`
   - Frontend run: `npm run dev`
   - Seed data: call `POST /api/ingest/static?feed_url=<URL>` once after backend starts
   - Environment variables: create `backend/.env` with `GTFS_STATIC_URL` and `GTFS_RT_URL`
2. Add a `backend/seed_demo.py` script that generates 500 synthetic DelayEvent rows using existing Trips + Stops if no GTFS-RT feed is available
3. Verify all four dashboard pages load data correctly end-to-end
4. Fix any CORS, import, or routing issues found during verification

**Relevant Context:**
- The `.env` file must be listed in `.gitignore`
- `seed_demo.py` is the fallback for demos without a live GTFS-RT feed

---

## Key API Endpoints Summary

| Method | Endpoint | Page |
|--------|----------|------|
| GET | /health | — |
| POST | /api/ingest/static | Setup |
| GET | /api/ingest/realtime/status | Setup |
| GET | /api/kpi/summary | Dashboard |
| GET | /api/delays/distribution | Delays |
| GET | /api/delays/by-hour | Delays |
| GET | /api/delays/causes | Delays |
| GET | /api/stations/summary | Stations |
| GET | /api/stations/{stop_id}/detail | Stations |
| GET | /api/schedule/routes | Schedule |
| GET | /api/schedule/routes/{route_id}/trips | Schedule |
| GET | /api/schedule/trip/{trip_id} | Schedule |

---

## Environment Variables

Stored in `backend/.env`:

```
GTFS_STATIC_URL=https://transitfeeds.com/...
GTFS_RT_URL=https://...
GTFS_RT_API_KEY=optional
```

---

## Dependencies Summary

**Backend (requirements.txt)**
```
fastapi
uvicorn[standard]
sqlalchemy
pandas
requests
gtfs-realtime-bindings
protobuf
python-dotenv
```

**Frontend (package.json)**
```
react, react-dom, react-router-dom
typescript, vite
recharts
axios
tailwindcss, postcss, autoprefixer
```

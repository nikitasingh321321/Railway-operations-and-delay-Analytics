"""
seed_demo.py — Indian Railways demo data seeder.

Creates real Indian Railway Agency, Routes (trains), Trips, Stops (stations)
and 1000 DelayEvents spread across the last 30 days.

Run from the backend directory (venv active):
    python seed_demo.py
"""

import random
import sys
from datetime import datetime, timedelta

sys.path.insert(0, ".")

from database import SessionLocal, engine, Base
from models import Agency, Route, Trip, Stop, StopTime, DelayEvent

Base.metadata.create_all(bind=engine)

CAUSES = ["Weather", "Infrastructure", "Congestion", "Mechanical", "Staff", "Signal Failure"]
NUM_EVENTS = 1000

# ── Indian Railways Agency ─────────────────────────────────────────────────────

DEMO_AGENCY = {
    "agency_id": "IR",
    "agency_name": "Indian Railways",
    "agency_url": "https://indianrailways.gov.in",
}

# ── Real Indian Railway Stations ───────────────────────────────────────────────

DEMO_STOPS = [
    {"stop_id": "NDLS", "stop_name": "New Delhi",               "stop_lat": 28.6419, "stop_lon": 77.2194},
    {"stop_id": "MMCT", "stop_name": "Mumbai Central",          "stop_lat": 18.9706, "stop_lon": 72.8193},
    {"stop_id": "MAS",  "stop_name": "Chennai Central",         "stop_lat": 13.0827, "stop_lon": 80.2707},
    {"stop_id": "HWH",  "stop_name": "Howrah Junction",         "stop_lat": 22.5839, "stop_lon": 88.3424},
    {"stop_id": "SBC",  "stop_name": "Bengaluru City Junction", "stop_lat": 12.9766, "stop_lon": 77.5713},
    {"stop_id": "AGC",  "stop_name": "Agra Cantt",              "stop_lat": 27.1591, "stop_lon": 77.9858},
    {"stop_id": "JP",   "stop_name": "Jaipur Junction",         "stop_lat": 26.9124, "stop_lon": 75.7873},
    {"stop_id": "ADI",  "stop_name": "Ahmedabad Junction",      "stop_lat": 23.0225, "stop_lon": 72.5714},
    {"stop_id": "PUNE", "stop_name": "Pune Junction",           "stop_lat": 18.5284, "stop_lon": 73.8742},
    {"stop_id": "SC",   "stop_name": "Secunderabad Junction",   "stop_lat": 17.4339, "stop_lon": 78.5006},
    {"stop_id": "NGP",  "stop_name": "Nagpur Junction",         "stop_lat": 21.1458, "stop_lon": 79.0882},
    {"stop_id": "BPL",  "stop_name": "Bhopal Junction",         "stop_lat": 23.2599, "stop_lon": 77.4126},
    {"stop_id": "LKO",  "stop_name": "Lucknow Charbagh",        "stop_lat": 26.8467, "stop_lon": 80.9462},
    {"stop_id": "CNB",  "stop_name": "Kanpur Central",          "stop_lat": 26.4499, "stop_lon": 80.3319},
    {"stop_id": "PNBE", "stop_name": "Patna Junction",          "stop_lat": 25.5941, "stop_lon": 85.1376},
    {"stop_id": "GHY",  "stop_name": "Guwahati",                "stop_lat": 26.1445, "stop_lon": 91.7362},
    {"stop_id": "ERS",  "stop_name": "Ernakulam Junction",      "stop_lat":  9.9816, "stop_lon": 76.2999},
    {"stop_id": "TVC",  "stop_name": "Thiruvananthapuram Central","stop_lat": 8.4855, "stop_lon": 76.9492},
    {"stop_id": "AMD",  "stop_name": "Amritsar Junction",       "stop_lat": 31.6340, "stop_lon": 74.8723},
    {"stop_id": "CDG",  "stop_name": "Chandigarh",              "stop_lat": 30.7333, "stop_lon": 76.7794},
]

# ── Real Indian Trains (Routes) ────────────────────────────────────────────────

DEMO_ROUTES = [
    {"route_id": "12301", "agency_id": "IR", "route_short_name": "12301", "route_long_name": "Howrah Rajdhani Express",      "route_type": 2},
    {"route_id": "12951", "agency_id": "IR", "route_short_name": "12951", "route_long_name": "Mumbai Rajdhani Express",      "route_type": 2},
    {"route_id": "12621", "agency_id": "IR", "route_short_name": "12621", "route_long_name": "Tamil Nadu Express",           "route_type": 2},
    {"route_id": "12259", "agency_id": "IR", "route_short_name": "12259", "route_long_name": "Sealdah Duronto Express",      "route_type": 2},
    {"route_id": "22691", "agency_id": "IR", "route_short_name": "22691", "route_long_name": "Rajdhani Express (SBC)",       "route_type": 2},
    {"route_id": "12002", "agency_id": "IR", "route_short_name": "12002", "route_long_name": "Bhopal Shatabdi Express",      "route_type": 2},
    {"route_id": "12627", "agency_id": "IR", "route_short_name": "12627", "route_long_name": "Karnataka Express",            "route_type": 2},
    {"route_id": "12309", "agency_id": "IR", "route_short_name": "12309", "route_long_name": "Rajendra Nagar Patna Express", "route_type": 2},
]

# ── Route → Stop sequence map ──────────────────────────────────────────────────

route_stop_map = {
    "12301": ["NDLS", "CNB",  "PNBE", "HWH"],                        # Howrah Rajdhani
    "12951": ["NDLS", "AGC",  "BPL",  "ADI",  "MMCT"],               # Mumbai Rajdhani
    "12621": ["NDLS", "AGC",  "BPL",  "NGP",  "SC",   "MAS"],        # Tamil Nadu Express
    "12259": ["NDLS", "CNB",  "LKO",  "PNBE", "HWH"],                # Sealdah Duronto
    "22691": ["NDLS", "BPL",  "NGP",  "SC",   "SBC"],                # Bangalore Rajdhani
    "12002": ["NDLS", "AGC",  "BPL"],                                  # Bhopal Shatabdi
    "12627": ["NDLS", "BPL",  "NGP",  "SC",   "SBC",  "MAS"],        # Karnataka Express
    "12309": ["NDLS", "CNB",  "LKO",  "PNBE"],                        # Patna Express
}

# Departure hours for 3 trips per route (morning, afternoon, evening)
base_hours = [6, 14, 20]

# ── Build Trips and StopTimes ──────────────────────────────────────────────────

DEMO_TRIPS = []
DEMO_STOP_TIMES = []

# Build a quick lookup: stop_id -> stop_name
stop_name_map = {s["stop_id"]: s["stop_name"] for s in DEMO_STOPS}

for route in DEMO_ROUTES:
    rid = route["route_id"]
    stops_for_route = route_stop_map[rid]
    last_station = stop_name_map.get(stops_for_route[-1], stops_for_route[-1])

    for i, dep_hour in enumerate(base_hours):
        trip_id = f"{rid}_T{i+1}"
        DEMO_TRIPS.append({
            "trip_id":      trip_id,
            "route_id":     rid,
            "service_id":   "WD",
            "trip_headsign": f"To {last_station}",
            "direction_id": 0,
        })
        for seq, stop_id in enumerate(stops_for_route):
            # Each stop is ~45 minutes apart (real long-distance trains)
            arr_minutes = dep_hour * 60 + seq * 45
            arr_str = f"{(arr_minutes // 60) % 24:02d}:{arr_minutes % 60:02d}:00"
            DEMO_STOP_TIMES.append({
                "trip_id":        trip_id,
                "stop_id":        stop_id,
                "arrival_time":   arr_str,
                "departure_time": arr_str,
                "stop_sequence":  seq + 1,
            })


# ── Seed function ──────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        print("Clearing existing data...")
        db.query(DelayEvent).delete()
        db.query(StopTime).delete()
        db.query(Trip).delete()
        db.query(Stop).delete()
        db.query(Route).delete()
        db.query(Agency).delete()
        db.commit()

        print("Inserting Indian Railways agency, trains, stations...")
        db.add(Agency(**DEMO_AGENCY))
        db.commit()

        for r in DEMO_ROUTES:
            db.add(Route(**r))
        db.commit()

        for s in DEMO_STOPS:
            db.add(Stop(**s))
        db.commit()

        for t in DEMO_TRIPS:
            db.add(Trip(**t))
        db.commit()

        for st in DEMO_STOP_TIMES:
            db.add(StopTime(**st))
        db.commit()

        print(f"  {len(DEMO_ROUTES)} trains, {len(DEMO_TRIPS)} trips, {len(DEMO_STOPS)} stations inserted.")

        # ── Generate delay events ──────────────────────────────────────────────
        print(f"Generating {NUM_EVENTS} delay events over the last 30 days...")
        trip_ids = [t["trip_id"] for t in DEMO_TRIPS]
        stop_ids = [s["stop_id"] for s in DEMO_STOPS]
        now = datetime.utcnow()
        added = 0

        for _ in range(NUM_EVENTS):
            trip_id = random.choice(trip_ids)
            stop_id = random.choice(stop_ids)
            days_ago = random.randint(0, 29)
            hour = random.randint(5, 23)
            minute = random.randint(0, 59)
            recorded_at = (
                now
                - timedelta(days=days_ago)
                - timedelta(hours=now.hour)
                + timedelta(hours=hour, minutes=minute)
            )

            # Indian Railways delay profile — higher delays are common
            status = random.choices(
                ["on_time", "delayed", "cancelled"],
                weights=[40, 45, 15],
            )[0]

            if status == "cancelled":
                delay_minutes = 0.0
            elif status == "on_time":
                delay_minutes = round(random.uniform(0, 5), 1)
            else:
                delay_minutes = round(random.choices(
                    [
                        random.uniform(5,  30),
                        random.uniform(30,  90),
                        random.uniform(90, 240),
                    ],
                    weights=[45, 35, 20],
                )[0], 1)

            db.add(DelayEvent(
                trip_id=trip_id,
                stop_id=stop_id,
                delay_minutes=delay_minutes,
                delay_cause=random.choice(CAUSES) if status != "cancelled" else "Cancelled",
                status=status,
                recorded_at=recorded_at,
            ))
            added += 1

        db.commit()
        print(f"  {added} delay events seeded.")
        print("\nDone! Open http://localhost:5173 to see the dashboard.")
        print("\nTrains loaded:")
        for r in DEMO_ROUTES:
            print(f"   {r['route_short_name']} - {r['route_long_name']}")
        print("\nStations loaded:")
        for s in DEMO_STOPS:
            print(f"   {s['stop_id']:6s} - {s['stop_name']}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()

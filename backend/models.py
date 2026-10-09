from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Agency(Base):
    __tablename__ = "agency"
    agency_id = Column(String, primary_key=True, index=True)
    agency_name = Column(String, nullable=False)
    agency_url = Column(String)


class Route(Base):
    __tablename__ = "routes"
    route_id = Column(String, primary_key=True, index=True)
    agency_id = Column(String, ForeignKey("agency.agency_id"), nullable=True)
    route_short_name = Column(String)
    route_long_name = Column(String)
    route_type = Column(Integer)
    trips = relationship("Trip", back_populates="route")


class Trip(Base):
    __tablename__ = "trips"
    trip_id = Column(String, primary_key=True, index=True)
    route_id = Column(String, ForeignKey("routes.route_id"), nullable=True)
    service_id = Column(String)
    trip_headsign = Column(String)
    direction_id = Column(Integer)
    route = relationship("Route", back_populates="trips")
    stop_times = relationship("StopTime", back_populates="trip")
    delay_events = relationship("DelayEvent", back_populates="trip")


class Stop(Base):
    __tablename__ = "stops"
    stop_id = Column(String, primary_key=True, index=True)
    stop_name = Column(String)
    stop_lat = Column(Float)
    stop_lon = Column(Float)
    stop_times = relationship("StopTime", back_populates="stop")
    delay_events = relationship("DelayEvent", back_populates="stop")


class StopTime(Base):
    __tablename__ = "stop_times"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String, ForeignKey("trips.trip_id"), nullable=False, index=True)
    stop_id = Column(String, ForeignKey("stops.stop_id"), nullable=False, index=True)
    arrival_time = Column(String)
    departure_time = Column(String)
    stop_sequence = Column(Integer)
    trip = relationship("Trip", back_populates="stop_times")
    stop = relationship("Stop", back_populates="stop_times")


class Calendar(Base):
    __tablename__ = "calendar"
    service_id = Column(String, primary_key=True)
    monday = Column(Boolean, default=False)
    tuesday = Column(Boolean, default=False)
    wednesday = Column(Boolean, default=False)
    thursday = Column(Boolean, default=False)
    friday = Column(Boolean, default=False)
    saturday = Column(Boolean, default=False)
    sunday = Column(Boolean, default=False)
    start_date = Column(String)
    end_date = Column(String)


class DelayEvent(Base):
    __tablename__ = "delay_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String, ForeignKey("trips.trip_id"), nullable=False, index=True)
    stop_id = Column(String, ForeignKey("stops.stop_id"), nullable=False, index=True)
    scheduled_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    delay_minutes = Column(Float, default=0.0)
    delay_cause = Column(String, default="Unknown")
    # status: "on_time" | "delayed" | "cancelled"
    status = Column(String, default="on_time", index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    trip = relationship("Trip", back_populates="delay_events")
    stop = relationship("Stop", back_populates="delay_events")

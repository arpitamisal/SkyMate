from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.core.database import Base


class TrackedFlight(Base):
    __tablename__ = "tracked_flights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flight_number = Column(String(20), nullable=False)
    airline = Column(String(100), nullable=False)
    departure_airport = Column(String(20), nullable=False)
    arrival_airport = Column(String(20), nullable=False)
    status = Column(String(50), nullable=False)
    terminal = Column(String(20), nullable=True)
    gate = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
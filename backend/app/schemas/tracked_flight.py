from typing import Optional
from pydantic import BaseModel, ConfigDict


class TrackedFlightCreate(BaseModel):
    user_id: int
    flight_number: str
    airline: str
    departure_airport: str
    arrival_airport: str
    status: str
    terminal: str
    gate: str


class TrackedFlightResponse(BaseModel):
    id: int
    user_id: int
    flight_number: str
    airline: str
    departure_airport: str
    arrival_airport: str
    status: str
    terminal: Optional[str] = None
    gate: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
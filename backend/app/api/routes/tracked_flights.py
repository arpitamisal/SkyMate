from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tracked_flight import TrackedFlight
from app.schemas.tracked_flight import TrackedFlightCreate, TrackedFlightResponse

router = APIRouter(prefix="/tracked-flights", tags=["Tracked Flights"])


@router.post("/", response_model=TrackedFlightResponse, status_code=status.HTTP_201_CREATED)
def create_tracked_flight(payload: TrackedFlightCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(TrackedFlight)
        .filter(
            TrackedFlight.user_id == payload.user_id,
            TrackedFlight.flight_number == payload.flight_number,
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Flight already tracked")

    tracked_flight = TrackedFlight(
        user_id=payload.user_id,
        flight_number=payload.flight_number,
        airline=payload.airline,
        departure_airport=payload.departure_airport,
        arrival_airport=payload.arrival_airport,
        status=payload.status,
        terminal=payload.terminal,
        gate=payload.gate,
    )

    db.add(tracked_flight)
    db.commit()
    db.refresh(tracked_flight)

    return tracked_flight


@router.get("/", response_model=List[TrackedFlightResponse])
def get_tracked_flights(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    flights = db.query(TrackedFlight).filter(TrackedFlight.user_id == user_id).all()
    return flights


@router.delete("/{tracked_flight_id}", status_code=status.HTTP_200_OK)
def delete_tracked_flight(
    tracked_flight_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    tracked_flight = (
        db.query(TrackedFlight)
        .filter(
            TrackedFlight.id == tracked_flight_id,
            TrackedFlight.user_id == user_id,
        )
        .first()
    )

    if not tracked_flight:
        raise HTTPException(status_code=404, detail="Tracked flight not found")

    db.delete(tracked_flight)
    db.commit()

    return {"message": "Tracked flight removed successfully"}
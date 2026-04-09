import os

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/flights", tags=["Flights"])

AVIATIONSTACK_API_KEY = os.getenv("AVIATIONSTACK_API_KEY")
AVIATIONSTACK_BASE_URL = "https://api.aviationstack.com/v1"


def normalize_flight(item: dict) -> dict:
    airline = item.get("airline", {}) or {}
    flight = item.get("flight", {}) or {}
    departure = item.get("departure", {}) or {}
    arrival = item.get("arrival", {}) or {}

    return {
        "airline": airline.get("name"),
        "flight_number": flight.get("iata") or flight.get("number"),
        "status": item.get("flight_status"),
        "departure_airport": departure.get("iata") or departure.get("airport"),
        "departure_terminal": departure.get("terminal"),
        "departure_gate": departure.get("gate"),
        "departure_time": departure.get("scheduled") or departure.get("estimated"),
        "arrival_airport": arrival.get("iata") or arrival.get("airport"),
        "arrival_terminal": arrival.get("terminal"),
        "arrival_gate": arrival.get("gate"),
        "arrival_time": arrival.get("scheduled") or arrival.get("estimated"),
    }


async def aviationstack_get(params: dict):
    if not AVIATIONSTACK_API_KEY:
        raise HTTPException(status_code=500, detail="Missing AVIATIONSTACK_API_KEY")

    query = {"access_key": AVIATIONSTACK_API_KEY, **params}

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(f"{AVIATIONSTACK_BASE_URL}/flights", params=query)

    if response.status_code >= 400:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Aviationstack error: {response.text}",
        )

    data = response.json()

    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])

    return data.get("data", []) or []


@router.get("/search")
async def search_flight(flight_number: str = Query(...)):
    flights = await aviationstack_get({"flight_iata": flight_number.upper()})

    if not flights:
        return {
            "found": False,
            "message": f"No flight found for {flight_number.upper()}",
        }

    return {
        "found": True,
        "flight": normalize_flight(flights[0]),
    }


@router.get("/departures")
async def get_departures(
    airport: str = Query(..., description="Airport IATA code like SFO"),
    limit: int = Query(6, ge=1, le=12),
):
    flights = await aviationstack_get({"dep_iata": airport.upper()})
    return {
        "airport": airport.upper(),
        "type": "departures",
        "flights": [normalize_flight(f) for f in flights[:limit]],
    }


@router.get("/arrivals")
async def get_arrivals(
    airport: str = Query(..., description="Airport IATA code like JFK"),
    limit: int = Query(6, ge=1, le=12),
):
    flights = await aviationstack_get({"arr_iata": airport.upper()})
    return {
        "airport": airport.upper(),
        "type": "arrivals",
        "flights": [normalize_flight(f) for f in flights[:limit]],
    }
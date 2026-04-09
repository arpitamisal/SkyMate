import os
from typing import Any, Dict

import httpx
from dotenv import load_dotenv
from fastmcp import FastMCP

load_dotenv()

AVIATIONSTACK_API_KEY = os.getenv("AVIATIONSTACK_API_KEY")
AVIATIONSTACK_BASE_URL = "http://api.aviationstack.com/v1"

if not AVIATIONSTACK_API_KEY:
    raise RuntimeError("Missing AVIATIONSTACK_API_KEY in .env")

mcp = FastMCP("SkyMate Flight MCP")


async def aviationstack_get(endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
    query = {"access_key": AVIATIONSTACK_API_KEY, **params}

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(f"{AVIATIONSTACK_BASE_URL}/{endpoint}", params=query)
        response.raise_for_status()
        return response.json()


def normalize_flight(item: Dict[str, Any]) -> Dict[str, Any]:
    airline = item.get("airline", {}) or {}
    flight = item.get("flight", {}) or {}
    departure = item.get("departure", {}) or {}
    arrival = item.get("arrival", {}) or {}
    aircraft = item.get("aircraft", {}) or {}
    live = item.get("live", {}) or {}

    return {
        "airline_name": airline.get("name"),
        "airline_iata": airline.get("iata"),
        "flight_number": flight.get("number"),
        "flight_iata": flight.get("iata"),
        "flight_icao": flight.get("icao"),
        "flight_status": item.get("flight_status"),
        "departure_airport": departure.get("airport"),
        "departure_iata": departure.get("iata"),
        "departure_terminal": departure.get("terminal"),
        "departure_gate": departure.get("gate"),
        "departure_scheduled": departure.get("scheduled"),
        "departure_estimated": departure.get("estimated"),
        "arrival_airport": arrival.get("airport"),
        "arrival_iata": arrival.get("iata"),
        "arrival_terminal": arrival.get("terminal"),
        "arrival_gate": arrival.get("gate"),
        "arrival_scheduled": arrival.get("scheduled"),
        "arrival_estimated": arrival.get("estimated"),
        "aircraft_registration": aircraft.get("registration"),
        "aircraft_iata": aircraft.get("iata"),
        "live_latitude": live.get("latitude"),
        "live_longitude": live.get("longitude"),
        "live_altitude": live.get("altitude"),
        "live_speed_horizontal": live.get("speed_horizontal"),
        "live_is_ground": live.get("is_ground"),
    }


@mcp.tool()
async def search_flight_status(flight_iata: str) -> Dict[str, Any]:
    data = await aviationstack_get("flights", {"flight_iata": flight_iata.upper()})
    flights = data.get("data", []) or []

    if not flights:
        return {
            "found": False,
            "message": f"No real-time flight found for {flight_iata.upper()}."
        }

    return {
        "found": True,
        "result_count": len(flights),
        "flight": normalize_flight(flights[0]),
    }


@mcp.tool()
async def search_departures(airport_iata: str, limit: int = 6) -> Dict[str, Any]:
    data = await aviationstack_get("flights", {"dep_iata": airport_iata.upper()})
    flights = data.get("data", []) or []

    return {
        "airport": airport_iata.upper(),
        "type": "departures",
        "count": min(len(flights), limit),
        "flights": [normalize_flight(f) for f in flights[:limit]],
    }


@mcp.tool()
async def search_arrivals(airport_iata: str, limit: int = 6) -> Dict[str, Any]:
    data = await aviationstack_get("flights", {"arr_iata": airport_iata.upper()})
    flights = data.get("data", []) or []

    return {
        "airport": airport_iata.upper(),
        "type": "arrivals",
        "count": min(len(flights), limit),
        "flights": [normalize_flight(f) for f in flights[:limit]],
    }


@mcp.tool()
async def build_arrival_plan(flight_iata: str) -> Dict[str, Any]:
    data = await aviationstack_get("flights", {"flight_iata": flight_iata.upper()})
    flights = data.get("data", []) or []

    if not flights:
        return {
            "found": False,
            "message": f"No real-time flight found for {flight_iata.upper()}."
        }

    flight = normalize_flight(flights[0])

    arrival_airport = flight.get("arrival_airport") or "destination airport"
    arrival_iata = flight.get("arrival_iata") or "N/A"
    terminal = flight.get("arrival_terminal") or "unknown"
    gate = flight.get("arrival_gate") or "unknown"
    status = flight.get("flight_status") or "unknown"

    return {
        "found": True,
        "flight": flight,
        "plan": [
            f"Check the latest arrival status. Current status: {status}.",
            f"Arrive at {arrival_airport} ({arrival_iata}).",
            f"Follow signage for Terminal {terminal}, Gate {gate}.",
            "If you checked luggage, proceed to baggage claim after deplaning.",
            "Choose onward transportation such as rideshare, taxi, train, or shuttle.",
            "Verify airport signage and terminal maps before exiting.",
        ],
    }


if __name__ == "__main__":
    mcp.run(transport="http", host="127.0.0.1", port=8001)
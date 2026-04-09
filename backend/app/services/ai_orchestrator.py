import re
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.tracked_flight import TrackedFlight
from app.services.mcp_http_client import MCPHttpClient


FLIGHT_PATTERN = r"\b([A-Z]{2}\d{2,4})\b"
AIRPORT_PATTERN = r"\b([A-Z]{3})\b"


def extract_flight_number(message: str) -> Optional[str]:
    match = re.search(FLIGHT_PATTERN, message.upper())
    return match.group(1) if match else None


def extract_airport_code(message: str) -> Optional[str]:
    matches = re.findall(AIRPORT_PATTERN, message.upper())
    if not matches:
        return None

    common_words_to_ignore = {"THE", "AND", "FOR", "ALL", "ANY", "TOD", "DAY"}
    for match in matches:
        if match not in common_words_to_ignore:
            return match
    return None


def get_tracked_flights_local(user_id: int, db: Session) -> List[Dict[str, Any]]:
    tracked_flights = (
        db.query(TrackedFlight)
        .filter(TrackedFlight.user_id == user_id)
        .all()
    )

    cleaned_flights = []
    for flight in tracked_flights:
        if (
            flight.flight_number == "string"
            or flight.airline == "string"
            or flight.departure_airport == "string"
            or flight.arrival_airport == "string"
        ):
            continue

        cleaned_flights.append(
            {
                "id": flight.id,
                "user_id": flight.user_id,
                "flight_number": flight.flight_number,
                "airline": flight.airline,
                "departure_airport": flight.departure_airport,
                "arrival_airport": flight.arrival_airport,
                "status": flight.status,
                "terminal": flight.terminal,
                "gate": flight.gate,
            }
        )

    return cleaned_flights


def decide_tools(
    message: str,
    user_id: Optional[int],
    current_flight: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    message_lower = message.lower()
    tools_to_run: List[Dict[str, Any]] = []

    flight_number = extract_flight_number(message)
    airport_code = extract_airport_code(message)

    if any(
        phrase in message_lower
        for phrase in [
            "tracked flights",
            "my flights",
            "which flights",
            "what flights",
            "delayed flights",
            "delay alerts",
        ]
    ):
        if user_id:
            tools_to_run.append(
                {
                    "tool_name": "get_tracked_flights_local",
                    "args": {"user_id": user_id},
                }
            )

    if airport_code and any(
        phrase in message_lower
        for phrase in ["departures", "departing", "leaving", "leaving from"]
    ):
        tools_to_run.append(
            {
                "tool_name": "search_departures",
                "args": {"airport_iata": airport_code, "limit": 8},
            }
        )

    if airport_code and any(
        phrase in message_lower
        for phrase in ["arrivals", "arriving", "landing", "coming into"]
    ):
        tools_to_run.append(
            {
                "tool_name": "search_arrivals",
                "args": {"airport_iata": airport_code, "limit": 8},
            }
        )

    if flight_number and any(
        phrase in message_lower
        for phrase in [
            "flight",
            "status",
            "gate",
            "terminal",
            "arrival",
            "departure",
            "boarding",
            "delay",
            "delayed",
            "on time",
        ]
    ):
        tools_to_run.append(
            {
                "tool_name": "search_flight_status",
                "args": {"flight_iata": flight_number},
            }
        )

    if not flight_number and current_flight and any(
        phrase in message_lower
        for phrase in [
            "this flight",
            "selected flight",
            "current flight",
            "that flight",
        ]
    ):
        current_flight_iata = current_flight.get("flight_number")
        if current_flight_iata:
            tools_to_run.append(
                {
                    "tool_name": "search_flight_status",
                    "args": {"flight_iata": current_flight_iata},
                }
            )

    if any(
        phrase in message_lower
        for phrase in [
            "travel plan",
            "when i land",
            "after i land",
            "arrival plan",
            "what should i do after landing",
        ]
    ):
        target_flight = flight_number
        if not target_flight and current_flight:
            target_flight = current_flight.get("flight_number")

        if target_flight:
            tools_to_run.append(
                {
                    "tool_name": "build_arrival_plan",
                    "args": {"flight_iata": target_flight},
                }
            )

    return tools_to_run


async def run_tools(
    tools_to_run: List[Dict[str, Any]],
    db: Session,
) -> Dict[str, Any]:
    tool_results: Dict[str, Any] = {}
    mcp_client = MCPHttpClient()

    for tool in tools_to_run:
        tool_name = tool["tool_name"]
        args = tool["args"]

        if tool_name == "get_tracked_flights_local":
            result = get_tracked_flights_local(user_id=args["user_id"], db=db)
            tool_results["get_tracked_flights_local"] = result

        elif tool_name == "search_flight_status":
            result = await mcp_client.call_tool("search_flight_status", args)
            tool_results["search_flight_status"] = result

        elif tool_name == "search_departures":
            result = await mcp_client.call_tool("search_departures", args)
            tool_results["search_departures"] = result

        elif tool_name == "search_arrivals":
            result = await mcp_client.call_tool("search_arrivals", args)
            tool_results["search_arrivals"] = result

        elif tool_name == "build_arrival_plan":
            result = await mcp_client.call_tool("build_arrival_plan", args)
            tool_results["build_arrival_plan"] = result

    return tool_results
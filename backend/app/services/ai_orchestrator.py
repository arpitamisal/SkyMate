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

    ignore_words = {"THE", "AND", "FOR", "ALL", "ANY", "TOD", "DAY"}
    for match in matches:
        if match not in ignore_words:
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
    query = message.lower()
    tools_to_run: List[Dict[str, Any]] = []

    flight_number = extract_flight_number(message)
    airport_code = extract_airport_code(message)

    # 1. tracked flights queries
    if any(
        phrase in query
        for phrase in [
            "tracked flights",
            "my flights",
            "what flights am i tracking",
            "which flights am i tracking",
        ]
    ):
        if user_id:
            tools_to_run.append(
                {
                    "tool_name": "get_tracked_flights_local",
                    "args": {"user_id": user_id},
                }
            )
        return tools_to_run

    # 2. combined flow: delayed tracked flights
    if any(
        phrase in query
        for phrase in [
            "which of my tracked flights are delayed",
            "which flights are delayed",
            "delayed tracked flights",
            "delay alerts for my flights",
        ]
    ):
        if user_id:
            tools_to_run.append(
                {
                    "tool_name": "get_tracked_flights_local",
                    "args": {"user_id": user_id},
                }
            )
        return tools_to_run

    # 3. departures / arrivals should win first
    if airport_code and any(
        phrase in query
        for phrase in ["departures", "departing", "leaving", "leaving from"]
    ):
        tools_to_run.append(
            {
                "tool_name": "search_departures",
                "args": {"airport_iata": airport_code, "limit": 8},
            }
        )
        return tools_to_run

    if airport_code and any(
        phrase in query
        for phrase in ["arrivals", "arriving", "landing", "coming into"]
    ):
        tools_to_run.append(
            {
                "tool_name": "search_arrivals",
                "args": {"airport_iata": airport_code, "limit": 8},
            }
        )
        return tools_to_run

    # 4. explicit flight status
    if flight_number and any(
        phrase in query
        for phrase in [
            "status",
            "this flight",
            "current flight",
            "that flight",
            "gate",
            "terminal",
            "departure",
            "arrival",
            "boarding",
            "delay",
            "delayed",
            "on time",
            "flight",
        ]
    ):
        tools_to_run.append(
            {
                "tool_name": "search_flight_status",
                "args": {"flight_iata": flight_number},
            }
        )
        return tools_to_run

    # 5. selected/current flight fallback
    if current_flight and any(
        phrase in query
        for phrase in [
            "this flight",
            "selected flight",
            "current flight",
            "that flight",
            "its status",
            "its gate",
            "its terminal",
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
            return tools_to_run

    # 6. travel plan
    if any(
        phrase in query
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

    return tools_to_run


def format_departures_response(data: Dict[str, Any]) -> str:
    airport = data.get("airport", "this airport")
    flights = data.get("flights", []) or []

    if not flights:
        return f"I couldn't find any live departures for {airport} right now."

    lines = [f"Here are upcoming departures from {airport}:"]
    for flight in flights[:5]:
        lines.append(
            f"✈️ {flight.get('flight_iata') or flight.get('flight_number') or 'Unknown'} → "
            f"{flight.get('arrival_iata') or flight.get('arrival_airport') or 'Unknown'}"
        )
        lines.append(
            f"   Airline: {flight.get('airline_name') or 'Unknown airline'}"
        )
        lines.append(
            f"   Terminal {flight.get('departure_terminal') or 'N/A'}, "
            f"Gate {flight.get('departure_gate') or 'N/A'}"
        )
        lines.append(
            f"   Departure: {flight.get('departure_estimated') or flight.get('departure_scheduled') or 'N/A'}"
        )
        lines.append("")
    return "\n".join(lines).strip()


def format_arrivals_response(data: Dict[str, Any]) -> str:
    airport = data.get("airport", "this airport")
    flights = data.get("flights", []) or []

    if not flights:
        return f"I couldn't find any live arrivals for {airport} right now."

    lines = [f"Here are upcoming arrivals at {airport}:"]
    for flight in flights[:5]:
        lines.append(
            f"✈️ {flight.get('flight_iata') or flight.get('flight_number') or 'Unknown'} ← "
            f"{flight.get('departure_iata') or flight.get('departure_airport') or 'Unknown'}"
        )
        lines.append(
            f"   Airline: {flight.get('airline_name') or 'Unknown airline'}"
        )
        lines.append(
            f"   Terminal {flight.get('arrival_terminal') or 'N/A'}, "
            f"Gate {flight.get('arrival_gate') or 'N/A'}"
        )
        lines.append(
            f"   Arrival: {flight.get('arrival_estimated') or flight.get('arrival_scheduled') or 'N/A'}"
        )
        lines.append("")
    return "\n".join(lines).strip()


def format_flight_status_response(data: Dict[str, Any]) -> str:
    if not data.get("found"):
        return data.get("message", "I couldn't find live flight status right now.")

    flight = data.get("flight", {})
    return "\n".join(
        [
            f"Here’s the latest status for {flight.get('flight_iata') or flight.get('flight_number')}:",
            f"✈️ Airline: {flight.get('airline_name') or 'Unknown airline'}",
            f"🛫 Route: {flight.get('departure_iata') or flight.get('departure_airport')} → {flight.get('arrival_iata') or flight.get('arrival_airport')}",
            f"📍 Status: {flight.get('flight_status') or 'Unknown'}",
            f"🏢 Departure: Terminal {flight.get('departure_terminal') or 'N/A'}, Gate {flight.get('departure_gate') or 'N/A'}",
            f"🏢 Arrival: Terminal {flight.get('arrival_terminal') or 'N/A'}, Gate {flight.get('arrival_gate') or 'N/A'}",
        ]
    )


def format_arrival_plan_response(data: Dict[str, Any]) -> str:
    if not data.get("found"):
        return data.get("message", "I couldn't build a live arrival plan right now.")

    plan = data.get("plan", []) or []
    lines = ["Here’s your arrival plan:"]
    for step in plan:
        lines.append(f"• {step}")
    return "\n".join(lines)


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

            # combined flow: enrich tracked flights with live status
            if result:
                enriched = []
                delayed = []
                for flight in result:
                    flight_number = flight.get("flight_number")
                    if not flight_number:
                        continue

                    try:
                        live_result = await mcp_client.call_tool(
                            "search_flight_status",
                            {"flight_iata": flight_number},
                        )
                        enriched_item = {
                            "tracked": flight,
                            "live": live_result,
                        }
                        enriched.append(enriched_item)

                        live_status = (
                            live_result.get("flight", {}).get("flight_status", "")
                            if isinstance(live_result, dict)
                            else ""
                        )
                        if str(live_status).lower() == "delayed":
                            delayed.append(enriched_item)
                    except Exception:
                        continue

                tool_results["tracked_flights_live_status"] = enriched
                tool_results["delayed_tracked_flights"] = delayed

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
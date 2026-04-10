import os
from typing import List

from fastapi import APIRouter, Depends
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_orchestrator import (
    decide_tools,
    run_tools,
    format_arrival_plan_response,
    format_arrivals_response,
    format_departures_response,
    format_flight_status_response,
)

router = APIRouter(prefix="/ai", tags=["AI"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_data_source_label(tool_names: List[str]) -> str:
    if not tool_names:
        return "AI assistant"

    if "search_departures" in tool_names or "search_arrivals" in tool_names:
        return "🔧 Data source: Live airport data (AviationStack)"
    if "search_flight_status" in tool_names:
        return "🔧 Data source: Live flight status (AviationStack)"
    if "build_arrival_plan" in tool_names:
        return "🔧 Data source: Live flight data + arrival planning"
    if "get_tracked_flights_local" in tool_names:
        return "🔧 Data source: Tracked flights database"
    return "🔧 Data source: AI assistant"


def build_suggested_actions(tool_names: List[str]) -> List[str]:
    if "search_departures" in tool_names:
        return [
            "Show arrivals at JFK",
            "Tell me about this flight",
            "Give me a travel plan",
        ]
    if "search_arrivals" in tool_names:
        return [
            "Show departures from SFO",
            "Tell me about this flight",
            "Track this flight",
        ]
    if "search_flight_status" in tool_names:
        return [
            "Give me a travel plan",
            "Show departures from SFO",
            "Track this flight",
        ]
    if "get_tracked_flights_local" in tool_names:
        return [
            "Which of my tracked flights are delayed?",
            "Show departures from SFO",
            "Give me a travel plan",
        ]
    return [
        "Show arrivals at JFK",
        "Show departures from SFO",
        "Give me a travel plan",
    ]


def build_direct_response(tool_results: dict, user_message: str) -> str:
    query = user_message.lower()

    if "delayed_tracked_flights" in tool_results:
        delayed = tool_results["delayed_tracked_flights"]
        if delayed:
            lines = ["Here are your tracked flights that are currently delayed:"]
            for item in delayed:
                tracked = item.get("tracked", {})
                live = item.get("live", {}).get("flight", {})
                lines.append(
                    f"✈️ {tracked.get('flight_number')} → "
                    f"{tracked.get('arrival_airport')}"
                )
                lines.append(
                    f"   Airline: {tracked.get('airline')}"
                )
                lines.append(
                    f"   Status: {live.get('flight_status') or tracked.get('status')}"
                )
                lines.append(
                    f"   Gate: {live.get('departure_gate') or tracked.get('gate') or 'N/A'}"
                )
                lines.append("")
            return "\n".join(lines).strip()
        return "None of your tracked flights appear to be delayed right now."

    if "search_departures" in tool_results:
        return format_departures_response(tool_results["search_departures"])

    if "search_arrivals" in tool_results:
        return format_arrivals_response(tool_results["search_arrivals"])

    if "search_flight_status" in tool_results:
        return format_flight_status_response(tool_results["search_flight_status"])

    if "build_arrival_plan" in tool_results:
        return format_arrival_plan_response(tool_results["build_arrival_plan"])

    if "get_tracked_flights_local" in tool_results:
        flights = tool_results["get_tracked_flights_local"]
        if not flights:
            return "You are not tracking any flights yet."

        lines = ["Here are your tracked flights:"]
        for flight in flights:
            lines.append(
                f"✈️ {flight['flight_number']} · {flight['departure_airport']} → {flight['arrival_airport']}"
            )
            lines.append(
                f"   Airline: {flight['airline']} · Status: {flight['status']}"
            )
            lines.append("")
        return "\n".join(lines).strip()

    return ""


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(payload: AIChatRequest, db: Session = Depends(get_db)):
    tools_to_run = decide_tools(
        payload.message,
        payload.user_id,
        payload.current_flight,
    )

    tool_names = [tool["tool_name"] for tool in tools_to_run]
    tool_used = ", ".join(tool_names) if tool_names else None
    data_source = build_data_source_label(tool_names)
    suggested_actions = build_suggested_actions(tool_names)

    try:
        tool_results = await run_tools(tools_to_run, db)

        direct_response = build_direct_response(tool_results, payload.message)
        if direct_response:
            return {
                "reply": direct_response,
                "tool_used": tool_used,
                "data_source": data_source,
                "suggested_actions": suggested_actions,
            }

        current_flight_context = "No currently selected flight."
        if payload.current_flight:
            current_flight_context = str(payload.current_flight)

        messages = [
            {
                "role": "system",
                "content": f"""
You are SkyMate AI, a smart travel assistant.

Be concise, clean, and helpful.
Prefer short sections and bullet-style formatting.
Do not dump raw data.
If no live data is available, say so plainly.

Current selected flight context:
{current_flight_context}
""",
            }
        ]

        if payload.chat_history:
            for item in payload.chat_history[-6:]:
                if item.role in ["user", "assistant"]:
                    messages.append(
                        {
                            "role": item.role,
                            "content": item.content,
                        }
                    )

        messages.append({"role": "user", "content": payload.message})

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
            temperature=0.3,
        )

        reply = response.choices[0].message.content.strip()

        return {
            "reply": reply,
            "tool_used": tool_used,
            "data_source": data_source,
            "suggested_actions": suggested_actions,
        }

    except Exception:
        return {
            "reply": "⚠️ I couldn't fetch live flight data right now. Try again in a moment.",
            "tool_used": tool_used,
            "data_source": data_source,
            "suggested_actions": [
                "Show departures from SFO",
                "Show arrivals at JFK",
                "What flights am I tracking?",
            ],
        }
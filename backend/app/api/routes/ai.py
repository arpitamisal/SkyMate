
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_orchestrator import decide_tools, run_tools

router = APIRouter(prefix="/ai", tags=["AI"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_tool_context(tool_results: dict) -> str:
    if not tool_results:
        return "No tools were used for this request."

    parts: List[str] = []

    if "get_tracked_flights_local" in tool_results:
        tracked_flights = tool_results["get_tracked_flights_local"]
        if tracked_flights:
            tracked_flights_text = "\n".join(
                [
                    f"- {flight['flight_number']} | {flight['airline']} | "
                    f"{flight['departure_airport']} -> {flight['arrival_airport']} | "
                    f"status: {flight['status']} | terminal: {flight['terminal']} | gate: {flight['gate']}"
                    for flight in tracked_flights
                ]
            )
        else:
            tracked_flights_text = "The user has no tracked flights."
        parts.append(f"Tracked flights:\n{tracked_flights_text}")

    if "search_flight_status" in tool_results:
        parts.append(
            f"Real flight status result:\n{tool_results['search_flight_status']}"
        )

    if "search_departures" in tool_results:
        parts.append(
            f"Airport departures result:\n{tool_results['search_departures']}"
        )

    if "search_arrivals" in tool_results:
        parts.append(
            f"Airport arrivals result:\n{tool_results['search_arrivals']}"
        )

    if "build_arrival_plan" in tool_results:
        parts.append(
            f"Arrival plan result:\n{tool_results['build_arrival_plan']}"
        )

    return "\n\n".join(parts)


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(payload: AIChatRequest, db: Session = Depends(get_db)):
    try:
        tools_to_run = decide_tools(
            payload.message,
            payload.user_id,
            payload.current_flight,
        )
        tool_results = await run_tools(tools_to_run, db)

        tool_context = build_tool_context(tool_results)

        current_flight_context = "No currently selected flight."
        if payload.current_flight:
            current_flight_context = str(payload.current_flight)

        tool_names = [tool["tool_name"] for tool in tools_to_run]
        tool_used = ", ".join(tool_names) if tool_names else None

        messages = [
            {
                "role": "system",
                "content": f"""
You are SkyMate AI, a smart travel assistant inside a flight tracking application.

Goals:
- Answer clearly, accurately, and helpfully.
- Use tool results as the main source of truth whenever they are available.
- Handle follow-up questions naturally using prior chat history.
- If the user asks about airport departures or arrivals, summarize the returned flights clearly.
- If the user asks about tracked flights, summarize them clearly.
- If the user asks about a selected/current flight, use the current flight context and tool results.
- If the user asks for a travel plan, use the arrival plan tool result.

Formatting rules:
- Keep answers concise but useful.
- Prefer short paragraphs or bullets.
- For lists of flights, show airline, flight number, route, and status.
- If no real data is available, say so plainly and suggest the next best query.
- Do not make up flights or airport details.

Current selected flight context:
{current_flight_context}

Tool results:
{tool_context}
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

        return AIChatResponse(
            reply=reply,
            tool_used=tool_used,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
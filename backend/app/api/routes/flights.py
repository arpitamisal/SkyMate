from fastapi import APIRouter, Query

router = APIRouter(prefix="/flights", tags=["Flights"])


@router.get("/search")
def search_flight(flight_number: str = Query(..., description="Flight number like UA123")):
    flight_number = flight_number.upper()

    mock_flights = {
        "UA123": {
            "flight_number": "UA123",
            "airline": "United Airlines",
            "departure_airport": "SFO",
            "arrival_airport": "JFK",
            "departure_time": "2026-04-07 10:00 AM",
            "arrival_time": "2026-04-07 06:15 PM",
            "status": "On Time",
            "terminal": "3",
            "gate": "F12",
        },
        "AA101": {
            "flight_number": "AA101",
            "airline": "American Airlines",
            "departure_airport": "LAX",
            "arrival_airport": "ORD",
            "departure_time": "2026-04-07 09:30 AM",
            "arrival_time": "2026-04-07 03:10 PM",
            "status": "Delayed",
            "terminal": "4",
            "gate": "B7",
        },
        "DL405": {
            "flight_number": "DL405",
            "airline": "Delta Airlines",
            "departure_airport": "SEA",
            "arrival_airport": "ATL",
            "departure_time": "2026-04-07 01:15 PM",
            "arrival_time": "2026-04-07 08:40 PM",
            "status": "Boarding",
            "terminal": "A",
            "gate": "22",
        },
    }

    if flight_number in mock_flights:
        return mock_flights[flight_number]

    return {
        "flight_number": flight_number,
        "airline": "Unknown Airline",
        "departure_airport": "N/A",
        "arrival_airport": "N/A",
        "departure_time": "N/A",
        "arrival_time": "N/A",
        "status": "Flight not found",
        "terminal": "N/A",
        "gate": "N/A",
    }
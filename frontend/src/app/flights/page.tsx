"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

type FlightData = {
  airline: string;
  flight_number: string;
  status: string;
  departure_airport: string;
  departure_terminal?: string;
  departure_gate?: string;
  departure_time?: string;
  arrival_airport: string;
  arrival_terminal?: string;
  arrival_gate?: string;
  arrival_time?: string;
};

function getStatusStyles(status?: string) {
  const value = (status || "").toLowerCase();

  if (value.includes("delayed")) {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }
  if (value.includes("active") || value.includes("boarding")) {
    return "bg-blue-100 text-blue-700 border border-blue-200";
  }
  if (value.includes("scheduled") || value.includes("on time")) {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export default function FlightsPage() {
  const { user, isAuthenticated } = useAuth();

  const [airport, setAirport] = useState("SFO");
  const [mode, setMode] = useState<"departures" | "arrivals">("departures");
  const [liveFlights, setLiveFlights] = useState<FlightData[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState("");

  const [flightNumber, setFlightNumber] = useState("");
  const [flight, setFlight] = useState<FlightData | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [trackMessage, setTrackMessage] = useState("");
  const [tracking, setTracking] = useState(false);

  const loadLiveFlights = async (
    selectedAirport = airport,
    selectedMode = mode
  ) => {
    setLoadingLive(true);
    setLiveError("");

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/flights/${selectedMode}?airport=${encodeURIComponent(
          selectedAirport
        )}&limit=6`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load live flights");
      }

      setLiveFlights(data.flights || []);
    } catch (err: any) {
      setLiveError(err.message || "Something went wrong.");
      setLiveFlights([]);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    loadLiveFlights("SFO", "departures");
  }, []);

  const handleSearch = async () => {
    if (!flightNumber.trim()) {
      setSearchError("Please enter a flight number.");
      return;
    }

    setLoadingSearch(true);
    setSearchError("");
    setTrackMessage("");
    setFlight(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/flights/search?flight_number=${encodeURIComponent(
          flightNumber
        )}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to fetch flight data.");
      }

      if (!data.found) {
        throw new Error(data.message || "Flight not found.");
      }

      setFlight(data.flight);
      localStorage.setItem("selectedFlight", JSON.stringify(data.flight));
      setFlightNumber((data.flight.flight_number || flightNumber).toUpperCase());
    } catch (err: any) {
      setSearchError(err.message || "Something went wrong.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleTrackFlight = async () => {
    if (!flight) return;

    if (!isAuthenticated || !user) {
      setTrackMessage("Please log in to track flights.");
      return;
    }

    setTracking(true);
    setTrackMessage("");

    try {
      const res = await fetch("http://127.0.0.1:8000/tracked-flights/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          flight_number: flight.flight_number,
          airline: flight.airline,
          departure_airport: flight.departure_airport,
          arrival_airport: flight.arrival_airport,
          status: flight.status,
          terminal: flight.departure_terminal || flight.arrival_terminal || "",
          gate: flight.departure_gate || flight.arrival_gate || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to track flight");
      }

      setTrackMessage("Flight added to your tracked flights.");
    } catch (err: any) {
      setTrackMessage(err.message || "Something went wrong.");
    } finally {
      setTracking(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-100 via-white to-slate-200 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-blue-600 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
            Flights
          </p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Browse live flights and search by flight number
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">
            View real arrivals and departures for an airport, or search a specific
            flight for status, gate, and terminal info.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <input
              value={airport}
              onChange={(e) => setAirport(e.target.value.toUpperCase())}
              placeholder="Airport IATA (e.g. SFO)"
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("departures");
                  loadLiveFlights(airport, "departures");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  mode === "departures"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Departures
              </button>
              <button
                onClick={() => {
                  setMode("arrivals");
                  loadLiveFlights(airport, "arrivals");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  mode === "arrivals"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Arrivals
              </button>
            </div>

            <button
              onClick={() => loadLiveFlights()}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Load Flights
            </button>
          </div>

          {loadingLive && <p className="text-slate-500">Loading live flights...</p>}
          {liveError && <p className="text-red-600">{liveError}</p>}

          {!loadingLive && !liveError && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {liveFlights.map((item, index) => (
                <div
                  key={`${item.flight_number}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{item.airline}</p>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {item.flight_number || "Unknown"}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(
                        item.status
                      )}`}
                    >
                      {item.status || "Unknown"}
                    </span>
                  </div>

                  <p className="text-slate-700">
                    {item.departure_airport} → {item.arrival_airport}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Departure: {item.departure_time || "N/A"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Arrival: {item.arrival_time || "N/A"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Gate: {item.departure_gate || item.arrival_gate || "N/A"} ·
                    Terminal: {item.departure_terminal || item.arrival_terminal || "N/A"}
                  </p>

                  <button
                    onClick={() => {
                      setFlightNumber(item.flight_number || "");
                      setFlight(item);
                      setSearchError("");
                      setTrackMessage("");
                      localStorage.setItem("selectedFlight", JSON.stringify(item));
                    }}
                    className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Use this flight →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">
            Search a specific flight
          </h2>

          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="Enter flight number (e.g. UA123)"
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <button
              onClick={handleSearch}
              className="rounded-2xl bg-slate-900 px-8 py-4 font-semibold text-white transition hover:bg-slate-800"
            >
              Search Flight
            </button>
          </div>

          {searchError && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {searchError}
            </p>
          )}
        </div>

        {loadingSearch && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-500">Loading flight details...</p>
          </div>
        )}

        {flight && (
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-lg">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{flight.airline}</p>
                <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                  {flight.flight_number}
                </h2>
                <p className="mt-3 text-slate-500">
                  Real-time flight summary and travel details
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyles(
                  flight.status
                )}`}
              >
                {flight.status}
              </span>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleTrackFlight}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                {tracking ? "Tracking..." : "Track Flight"}
              </button>

              {trackMessage && (
                <p className="text-sm text-slate-600">{trackMessage}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-6 shadow-inner">
                <p className="text-sm text-slate-500">Departure</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  {flight.departure_airport}
                </h3>
                <p className="mt-2 text-slate-600">{flight.departure_time || "N/A"}</p>
                <p className="text-sm text-slate-500">
                  Terminal {flight.departure_terminal || "N/A"} · Gate {flight.departure_gate || "N/A"}
                </p>
              </div>

              <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-inner">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Route</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {flight.departure_airport} → {flight.arrival_airport}
                  </h3>
                  <p className="mt-2 text-3xl">✈️</p>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-6 shadow-inner">
                <p className="text-sm text-slate-500">Arrival</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  {flight.arrival_airport}
                </h3>
                <p className="mt-2 text-slate-600">{flight.arrival_time || "N/A"}</p>
                <p className="text-sm text-slate-500">
                  Terminal {flight.arrival_terminal || "N/A"} · Gate {flight.arrival_gate || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
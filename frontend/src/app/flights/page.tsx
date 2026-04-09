"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

type FlightData = {
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  status: string;
  terminal: string;
  gate: string;
};

const sampleFlights = ["UA123", "AA101", "DL405"];

function getStatusStyles(status: string) {
  switch (status.toLowerCase()) {
    case "on time":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "delayed":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "boarding":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export default function FlightsPage() {
  const { user, isAuthenticated } = useAuth();

  const [flightNumber, setFlightNumber] = useState("");
  const [flight, setFlight] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackMessage, setTrackMessage] = useState("");
  const [tracking, setTracking] = useState(false);

  const handleSearch = async (customFlight?: string) => {
    const searchValue = customFlight ?? flightNumber;

    if (!searchValue.trim()) {
      setError("Please enter a flight number.");
      return;
    }

    setLoading(true);
    setError("");
    setTrackMessage("");
    setFlight(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/flights/search?flight_number=${encodeURIComponent(
          searchValue
        )}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Failed to fetch flight data.");
      }

      setFlight(data);
      setFlightNumber(searchValue.toUpperCase());
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flightFromUrl = params.get("flight");

    if (flightFromUrl) {
      setFlightNumber(flightFromUrl.toUpperCase());
      handleSearch(flightFromUrl.toUpperCase());
    }
  }, []);

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
          terminal: flight.terminal,
          gate: flight.gate,
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
      <div className="mx-auto max-w-6xl rounded-[32px] bg-white/60 p-6 shadow-sm backdrop-blur-md">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-blue-600 p-8 text-white shadow-xl md:p-10">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-100">
              Flight Search
            </p>
            <h1 className="mt-3 text-4xl font-bold md:text-5xl">
              Track a flight in real time
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">
              Search by flight number to check route, gate, terminal, status,
              and schedule updates in one place.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="Enter flight number (e.g. UA123)"
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              onClick={() => handleSearch()}
              className="rounded-2xl bg-slate-900 px-8 py-4 font-semibold text-white transition hover:bg-slate-800"
            >
              Search Flight
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-500">Try sample flights:</p>
            {sampleFlights.map((item) => (
              <button
                key={item}
                onClick={() => handleSearch(item)}
                className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {item}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="mt-10 space-y-10">
          {loading && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-slate-600">Loading flight data...</p>
            </div>
          )}

          {flight && (
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-lg">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {flight.airline}
                    </p>
                    <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                      {flight.flight_number}
                    </h2>
                    <p className="mt-3 text-slate-500">
                      Live flight summary and travel details
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

                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <div className="rounded-3xl bg-slate-50 p-6 shadow-inner">
                    <p className="text-sm text-slate-500">Departure</p>
                    <h3 className="mt-2 text-3xl font-bold text-slate-900">
                      {flight.departure_airport}
                    </h3>
                    <p className="mt-2 text-slate-600">{flight.departure_time}</p>
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
                    <p className="mt-2 text-slate-600">{flight.arrival_time}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-lg">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Flight Details
                  </h3>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                      <span className="text-slate-500">Airline</span>
                      <span className="font-semibold text-slate-900">
                        {flight.airline}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                      <span className="text-slate-500">Flight Number</span>
                      <span className="font-semibold text-slate-900">
                        {flight.flight_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                      <span className="text-slate-500">Status</span>
                      <span className="font-semibold text-slate-900">
                        {flight.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-lg">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Terminal & Gate
                  </h3>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-slate-50 p-6 text-center shadow-inner">
                      <p className="text-sm text-slate-500">Terminal</p>
                      <h4 className="mt-2 text-3xl font-bold text-slate-900">
                        {flight.terminal}
                      </h4>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-6 text-center shadow-inner">
                      <p className="text-sm text-slate-500">Gate</p>
                      <h4 className="mt-2 text-3xl font-bold text-slate-900">
                        {flight.gate}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
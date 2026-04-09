"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type TrackedFlight = {
  id: number;
  user_id: number;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  status: string;
  terminal?: string;
  gate?: string;
};

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "delayed":
      return "bg-amber-100 text-amber-700";
    case "boarding":
      return "bg-blue-100 text-blue-700";
    case "on time":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();

  const [trackedFlights, setTrackedFlights] = useState<TrackedFlight[]>([]);
  const [fetchingFlights, setFetchingFlights] = useState(true);

  const fetchTrackedFlights = async (userId: number) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/tracked-flights/?user_id=${userId}`
      );
      const data = await res.json();

      const cleanedData = data.filter(
        (flight: TrackedFlight) =>
          flight.flight_number !== "string" &&
          flight.airline !== "string" &&
          flight.departure_airport !== "string" &&
          flight.arrival_airport !== "string"
      );

      setTrackedFlights(cleanedData);
    } catch (error) {
      console.error("Failed to fetch tracked flights", error);
    } finally {
      setFetchingFlights(false);
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchTrackedFlights(user.id);
    }
  }, [loading, isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleUntrackFlight = async (trackedFlightId: number) => {
    if (!user) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/tracked-flights/${trackedFlightId}?user_id=${user.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to remove tracked flight");
      }

      setTrackedFlights((prev) =>
        prev.filter((flight) => flight.id !== trackedFlightId)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const delayedFlightsCount = useMemo(() => {
    return trackedFlights.filter(
      (flight) => flight.status.toLowerCase() === "delayed"
    ).length;
  }, [trackedFlights]);

  const cards = [
    {
      title: "Tracked Flights",
      value: String(trackedFlights.length),
      icon: "✈️",
    },
    {
      title: "Active Trips",
      value: "0",
      icon: "🧳",
    },
    {
      title: "Delay Alerts",
      value: String(delayedFlightsCount),
      icon: "⏰",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-100">
                Dashboard
              </p>
              <h1 className="mt-2 text-4xl font-bold">
                Welcome back{user ? `, ${user.name}` : ""}
              </h1>
              <p className="mt-2 max-w-2xl text-blue-100">
                Your personalized travel hub for flights, alerts, and AI-powered
                insights.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                {card.icon}
              </div>
              <p className="text-sm text-slate-500">{card.title}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              Tracked Flights
            </h2>

            <button
              onClick={() => router.push("/flights")}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
            >
              Track More Flights
            </button>
          </div>

          {fetchingFlights ? (
            <p className="text-slate-500">Loading tracked flights...</p>
          ) : trackedFlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-lg font-medium text-slate-700">
                No flights tracked yet ✈️
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Search and track flights to see them here.
              </p>

              <button
                onClick={() => router.push("/flights")}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
              >
                Track your first flight
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {trackedFlights.map((flight) => (
                <div
                  key={flight.id}
                  className={`rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:-translate-y-0.5 ${
                    flight.status.toLowerCase() === "delayed"
                      ? "border border-amber-200 bg-white"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{flight.airline}</p>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {flight.flight_number}
                      </h3>
                      <p className="mt-1 text-slate-600">
                        {flight.departure_airport} → {flight.arrival_airport}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(
                          flight.status
                        )}`}
                      >
                        {flight.status}
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            router.push(`/flights?flight=${flight.flight_number}`)
                          }
                          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
                        >
                          View details →
                        </button>

                        <button
                          onClick={() => handleUntrackFlight(flight.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Session Info
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Logged in as <span className="font-semibold">{user?.email}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">Session active</p>
          <button
            onClick={handleLogout}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const cards = [
    { title: "Tracked Flights", value: "0", icon: "✈️" },
    { title: "Active Trips", value: "0", icon: "🧳" },
    { title: "Delay Alerts", value: "0", icon: "⏰" },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 to-blue-700 p-8 text-white shadow-xl md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-100">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-bold">Welcome to SkyMate</h1>
            <p className="mt-2 max-w-2xl text-blue-100">
              Your personalized travel hub for flights, alerts, and AI-powered
              insights.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
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
          <h2 className="text-2xl font-semibold text-slate-900">
            Session Token
          </h2>
          <p className="mt-3 break-all text-sm leading-7 text-slate-600">
            {token || "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
}
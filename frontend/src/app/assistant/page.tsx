"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

type Message = {
  role: "user" | "assistant";
  content: string;
  toolUsed?: string | null;
};

export default function AssistantPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm SkyMate AI ✈️ Ask me about your flights, delays, airport departures, arrivals, or travel plans.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);

  useEffect(() => {
    const savedFlight = localStorage.getItem("selectedFlight");
    if (savedFlight) {
      setSelectedFlight(JSON.parse(savedFlight));
    }
  }, []);

  const sendMessage = async (customMessage?: string) => {
    const finalMessage = customMessage || input;
    if (!finalMessage.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: finalMessage,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/ai/chat", {
        message: finalMessage,
        user_id: user?.id || null,
        current_flight: selectedFlight,
        chat_history: nextMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const data = res.data;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        toolUsed: data.tool_used || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err?.response?.data?.detail ||
            "Something went wrong. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 p-6 text-white shadow">
        <p className="text-sm uppercase tracking-wide opacity-80">
          AI Assistant
        </p>
        <h1 className="text-3xl font-bold">SkyMate AI</h1>
        <p className="mt-2 text-sm opacity-90">
          Ask about tracked flights, delays, airport departures, arrivals, or travel plans.
        </p>
      </div>

      {selectedFlight && (
        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Selected flight context</p>
          <p className="mt-1">
            {selectedFlight.airline} {selectedFlight.flight_number} ·{" "}
            {selectedFlight.departure_airport} → {selectedFlight.arrival_airport}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("selectedFlight");
              setSelectedFlight(null);
            }}
            className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Clear selected flight
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "ml-auto bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "assistant" && msg.toolUsed && (
              <p className="mt-1 text-xs text-slate-500">
                Tool used: <span className="font-medium">{msg.toolUsed}</span>
              </p>
            )}
          </div>
        ))}

        {loading && <p className="text-sm text-slate-500">Thinking...</p>}

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SkyMate AI something..."
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={() => sendMessage()}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Send
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">
          Try asking:
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            "What flights am I tracking?",
            "Which flights are delayed?",
            "Show me departures from SFO",
            "Show me arrivals at JFK",
            "Tell me about this flight",
            "Give me a travel plan after landing",
          ].map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="rounded-full border px-4 py-2 text-xs text-slate-600 hover:bg-slate-100"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
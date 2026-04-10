"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type Message = {
  role: "user" | "assistant";
  content: string;
  toolUsed?: string | null;
  dataSource?: string | null;
  suggestedActions?: string[];
};

export default function AssistantPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm SkyMate AI ✈️ Ask me about your flights, delays, airport departures, arrivals, or travel plans.",
      dataSource: "🔧 Data source: AI assistant",
      suggestedActions: [
        "Show departures from SFO",
        "Show arrivals at JFK",
        "What flights am I tracking?",
      ],
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
      const res = await axios.post(`${API_BASE_URL}/ai/chat`, {
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
        dataSource: data.data_source || null,
        suggestedActions: data.suggested_actions || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ I couldn't fetch live flight data right now. Try again in a moment.",
          dataSource: "🔧 Data source: AI assistant",
          suggestedActions: [
            "Show departures from SFO",
            "Show arrivals at JFK",
            "What flights am I tracking?",
          ],
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
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-line ${
                msg.role === "user"
                  ? "ml-auto bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "assistant" && msg.dataSource && (
              <p className="mt-2 text-xs text-slate-500">{msg.dataSource}</p>
            )}

            {msg.role === "assistant" &&
              msg.suggestedActions &&
              msg.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="rounded-full border px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      {action}
                    </button>
                  ))}
                </div>
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
            "Which of my tracked flights are delayed?",
            "Show departures from SFO",
            "Show arrivals at JFK",
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
import Link from "next/link";

const features = [
  {
    title: "Flight Tracking",
    description:
      "Monitor departures, arrivals, delays, and schedule changes in one place.",
    icon: "🛫",
  },
  {
    title: "Smart Insights",
    description:
      "Spot travel patterns and understand delays with clean visual summaries.",
    icon: "📊",
  },
  {
    title: "AI Assistant",
    description:
      "Ask questions about flights, airports, and travel plans with natural language.",
    icon: "🤖",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-slate-100 to-slate-100" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm">
            <span>✈️</span>
            <span>Real-time travel tracking powered by AI</span>
          </div>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Travel smarter with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              SkyMate
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Track flights, monitor delays, and get travel insights in real time
            through a clean dashboard built for modern travelers.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start Tracking
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-2xl font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="text-base leading-7 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
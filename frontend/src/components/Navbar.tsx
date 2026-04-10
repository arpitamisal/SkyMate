"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, loading, user } = useAuth();

  const linkClass = (path: string) =>
    `relative px-1 transition ${
      pathname === path
        ? "text-slate-900 font-semibold"
        : "text-slate-600 hover:text-slate-900"
    }`;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            ✈️
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900">
              SkyMate
            </p>
            <p className="text-xs text-slate-500">AI Travel Assistant</p>
          </div>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          <Link href="/flights" className={linkClass("/flights")}>
            Flights
          </Link>

          <Link href="/assistant" className={linkClass("/assistant")}>
            Assistant
          </Link>

          {!loading && isAuthenticated ? (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </Link>

              <span className="hidden text-slate-500 md:inline">
                {user?.name}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 active:scale-95"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass("/login")}>
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 active:scale-95"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
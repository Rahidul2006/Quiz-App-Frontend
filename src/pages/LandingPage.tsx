import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  QrCode,
  BarChart3,
  Trophy,
  ArrowRight,
  Radio,
  Zap,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinCodeInput, setJoinCodeInput] = useState("");

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      navigate(`/join/${joinCodeInput.trim().replace("#", "")}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950">
              <Zap className="w-5 h-5 text-[#0c1017] fill-current" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Crowd<span className="text-emerald-400">Pulse</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Admin Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Audience Engagement</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Make Every Audience{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Interactive.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Create live polls, quizzes and interactive experiences. Let your audience
            participate from their phones and see results in real time.
          </p>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard/events/new" : "/login"}
              state={{ from: { pathname: "/dashboard/events/new" } }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition-all shadow-xl shadow-emerald-950 active:scale-95"
            >
              <span>Create an Event</span>
              <ArrowRight className="w-5 h-5" />
            </Link>


            {/* Quick Join form */}
            <form
              onSubmit={handleJoinSubmit}
              className="w-full sm:w-auto flex items-center bg-[#161b26] border border-slate-700/80 rounded-2xl p-1.5 shadow-xl"
            >
              <input
                type="text"
                placeholder="Enter 7-Digit Code"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                className="bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none w-48 font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors border border-slate-700"
              >
                Join Event
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 CrowdPulse. Built for conferences, meetups, workshops, and high-energy live events.</p>
      </footer>
    </div>
  );
};

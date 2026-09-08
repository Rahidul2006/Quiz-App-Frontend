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
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
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

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-950 active:scale-95"
            >
              Host Event
            </Link>
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
              to="/dashboard"
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
                placeholder="Enter Code (e.g. 3157530)"
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

        {/* Live Visual Previews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Live Polls */}
          <div className="bg-[#141923] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Live Poll
              </span>
              <span className="text-slate-500">142 votes</span>
            </div>
            <h4 className="text-white font-bold text-sm">Where are you joining from?</h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>React Kolkata</span>
                  <span className="font-mono text-emerald-400 font-bold">58%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[58%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Techno India</span>
                  <span className="font-mono text-slate-400 font-bold">27%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[27%] h-full bg-slate-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Instant QR Code */}
          <div className="bg-[#141923] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 group hover:border-slate-700 transition-colors text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Instant QR Joining</h4>
              <p className="text-xs text-slate-400 mt-1">
                Zero app installs. Attendees scan and vote from any phone.
              </p>
            </div>
            <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/30">
              #3157530
            </span>
          </div>

          {/* Card 3: Dynamic Word Cloud */}
          <div className="bg-[#141923] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Word Cloud
              </span>
              <span className="text-slate-500">Live</span>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center justify-center py-2">
              <span className="text-sm font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                React Kolkata
              </span>
              <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/30 px-2 py-0.5 rounded-lg">
                Techno
              </span>
              <span className="text-[11px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded-md">
                Kolkata
              </span>
              <span className="text-xs text-indigo-300 bg-indigo-950/30 px-2 py-0.5 rounded-lg">
                Brainware
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md">
                JISCE
              </span>
            </div>
          </div>

          {/* Card 4: Quiz Leaderboard */}
          <div className="bg-[#141923] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Live Quiz Podium
              </span>
              <span className="text-slate-500">Top 3</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between bg-slate-800/40 p-1.5 rounded-lg">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center">1</span>
                  Prodipta Roy
                </span>
                <span className="font-mono text-emerald-400 font-bold">1000 pts</span>
              </div>
              <div className="flex items-center justify-between bg-slate-800/40 p-1.5 rounded-lg">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center">2</span>
                  Rashmi Tiwari
                </span>
                <span className="font-mono text-emerald-400 font-bold">950 pts</span>
              </div>
            </div>
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

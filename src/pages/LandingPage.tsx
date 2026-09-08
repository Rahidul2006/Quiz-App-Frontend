import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  QrCode,
  BarChart3,
  Trophy,
  ArrowRight,
  Radio,
  Zap,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Tv,
  LayoutDashboard,
  TrendingUp,
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

  const features = [
    {
      icon: BarChart3,
      title: "Real-Time Polls",
      description: "Ask questions and watch poll options dynamically slide into ranked order with smooth FLIP animations as votes roll in.",
      badge: "Dynamic FLIP",
    },
    {
      icon: Sparkles,
      title: "Live Word Clouds",
      description: "Crowdsource opinions and thoughts from hundreds of attendees at once. Recurring terms grow seamlessly in real time.",
      badge: "Realtime Text",
    },
    {
      icon: Trophy,
      title: "Competitive Quizzes",
      description: "Host rapid-fire trivia with countdown timers, automatic grading, and animated live leaderboards with podium celebrations.",
      badge: "Instant Grading",
    },
    {
      icon: QrCode,
      title: "Zero App Download",
      description: "Attendees scan the large QR code or enter a 7-digit PIN from any mobile browser to participate immediately.",
      badge: "Instant Access",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#080c14] relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              Crowd<span className="text-emerald-400">Pulse</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/join"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800/60 transition-colors hidden sm:inline-block"
            >
              Join via PIN
            </Link>

            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all"
              >
                Admin Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 space-y-20 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Audience Interaction</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]"
          >
            Make Every Event{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Unforgettable.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto"
          >
            Engage hundreds of attendees simultaneously with live polls, interactive word clouds, and fast-paced quizzes — no app install required.
          </motion.p>

          {/* Actions & Quick Join */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Link
              to={user ? "/dashboard/events/new" : "/login"}
              state={{ from: { pathname: "/dashboard/events/new" } }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-950/40 active:scale-95"
            >
              <span>Create an Event</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Quick Join form */}
            <form
              onSubmit={handleJoinSubmit}
              className="w-full sm:w-auto flex items-center bg-[#131824] border border-slate-700/80 rounded-2xl p-1.5 shadow-xl"
            >
              <input
                type="text"
                placeholder="Enter 7-Digit PIN"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                className="bg-transparent px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none w-44 font-mono font-bold"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-colors border border-slate-700 active:scale-95"
              >
                Join Event
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 bg-[#080c14]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">CrowdPulse</span>
            <span>— Real-time event voting & quiz platform.</span>
          </div>
          <p>© 2026 CrowdPulse. Built for conferences, meetups, and high-energy live events.</p>
        </div>
      </footer>
    </div>
  );
};

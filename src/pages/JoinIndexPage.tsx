import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, ArrowLeft } from "lucide-react";

export const JoinIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().replace("#", "");
    if (clean) {
      navigate(`/join/${clean}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Ambient background light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-[#121722] border border-slate-800/90 rounded-3xl p-8 shadow-2xl space-y-6 text-center relative z-10"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
          <Zap className="w-6 h-6 text-slate-950 fill-current" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Enter Room PIN</h2>
          <p className="text-xs text-slate-400 mt-1">
            Type the 7-digit join code displayed on the screen or presentation stage.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 1234567"
              className="w-full text-center bg-[#090d14] border border-slate-700/80 rounded-2xl py-3.5 px-4 text-2xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-950/40"
          >
            <span>Continue to Event</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </form>

        <div className="pt-2 border-t border-slate-800/80">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#161b26] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
          <Zap className="w-6 h-6 text-[#0c1017] fill-current" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Join Live Event</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the 7-digit event code displayed on the presenter&apos;s screen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. 1234567"
            className="w-full text-center bg-[#0c1017] border border-slate-700 rounded-2xl py-3.5 px-4 text-xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950 active:scale-95"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

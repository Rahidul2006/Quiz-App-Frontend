import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Clock, ShieldCheck, Sparkles, Check, HelpCircle } from "lucide-react";
import { api } from "../services/api";

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export const NewEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDurationVal, setCustomDurationVal] = useState<string>("25");
  const [requireName, setRequireName] = useState(true);
  const [creating, setCreating] = useState(false);

  const selectedDuration = isCustomDuration ? (Number(customDurationVal) || 30) : duration;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const newEv = await api.post("/events", {
        title: title.trim(),
        description: description.trim(),
        duration: selectedDuration,
        settings: {
          require_name: requireName,
        },
      });
      navigate(`/dashboard/events/${newEv.id || newEv._id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center p-4 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Ambient background light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-[#121722] border border-slate-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-7 relative z-10"
      >
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800/80">
          <Link
            to="/dashboard"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Create New Event</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set up your interactive audience room with waiting lounge and timer controls.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Section 1: Event Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Event Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. All-Hands Keynote & Q&A 2026"
                className="w-full bg-[#090d14] border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Description <span className="text-slate-500 lowercase font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add session agenda, speaker notes, or instructions for attendees..."
                className="w-full bg-[#090d14] border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium resize-none"
              />
            </div>
          </div>

          {/* Section 2: Timing System / Duration Configuration */}
          <div className="space-y-3 p-5 bg-[#090d14] rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Event Duration</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-black bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg tabular-nums">
                {selectedDuration} min
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your room starts in <strong className="text-amber-400 font-semibold">WAITING</strong> mode. The countdown timer only begins when you click <strong className="text-emerald-400 font-semibold">START EVENT</strong>.
            </p>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setDuration(preset);
                    setIsCustomDuration(false);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center relative ${
                    !isCustomDuration && duration === preset
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm shadow-emerald-950/40"
                      : "bg-[#121722] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {preset}m
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomDuration(true)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  isCustomDuration
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm shadow-emerald-950/40"
                    : "bg-[#121722] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                Custom
              </button>
            </div>

            <AnimatePresence>
              {isCustomDuration && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 flex items-center gap-3 overflow-hidden"
                >
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={customDurationVal}
                    onChange={(e) => setCustomDurationVal(e.target.value)}
                    placeholder="Minutes"
                    className="w-28 bg-[#121722] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400">minutes (between 1 and 240)</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 3: Attendee Settings */}
          <div className="p-4 bg-[#090d14] rounded-2xl border border-slate-800/80">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={requireName}
                onChange={(e) => setRequireName(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-500 bg-[#121722] border-slate-700 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Require attendee name before joining</span>
                <p className="text-[11px] text-slate-400">
                  Participants provide their nickname to enter the waiting room and appear on the live leaderboard.
                </p>
              </div>
            </label>
          </div>

          {/* CTA Submit Button */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              <span>{creating ? "Setting up Event..." : "Create & Open Waiting Lounge"}</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};


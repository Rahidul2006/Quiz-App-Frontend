import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Clock, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-[#0c1017] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-[#161b26] border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Event</h2>
            <p className="text-xs text-slate-400">
              Set up your live audience engagement room with waiting room and timing controls.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Community Conference 2026"
              className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add meetup agenda, speaker notes, or instructions..."
              className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Timing System / Duration Configuration */}
          <div className="space-y-2 p-4 bg-[#0c1017]/80 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Event Duration</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {selectedDuration} min
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Event starts in <strong className="text-amber-400">WAITING</strong> mode. Timer only begins when you click <strong className="text-emerald-400">▶ START EVENT</strong>.
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
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    !isCustomDuration && duration === preset
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                      : "bg-[#161b26] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {preset} min
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomDuration(true)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  isCustomDuration
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                    : "bg-[#161b26] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                Custom
              </button>
            </div>

            {isCustomDuration && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={customDurationVal}
                  onChange={(e) => setCustomDurationVal(e.target.value)}
                  placeholder="Minutes"
                  className="w-32 bg-[#161b26] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-xs text-slate-400">minutes duration</span>
              </div>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={requireName}
                onChange={(e) => setRequireName(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
              <span>Require participants to provide a name before voting</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{creating ? "Creating..." : "Create & Open Waiting Room"}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


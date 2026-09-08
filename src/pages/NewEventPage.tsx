import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { api } from "../services/api";

export const NewEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requireName, setRequireName] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const newEv = await api.post("/events", {
        title: title.trim(),
        description: description.trim(),
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
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Event</h2>
            <p className="text-xs text-slate-400">
              Set up your live audience engagement room.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Kolkata Offline Meetup 2026"
              className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add meetup agenda, speaker notes, or instructions..."
              className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
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

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 disabled:opacity-50"
            >
              <span>{creating ? "Creating..." : "Create & Open Dashboard"}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

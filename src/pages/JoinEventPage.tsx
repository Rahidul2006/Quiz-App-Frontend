import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Zap, ArrowRight, User, CheckCircle } from "lucide-react";
import { api } from "../services/api";
import { EventItem } from "../types";

export const JoinEventPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const cleanCode = (code || "").replace("#", "");

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function findEvent() {
      try {
        const found = await api.get(`/events/code/${cleanCode}`);
        setEvent(found);

        const evId = found.id || found._id;
        const stored = localStorage.getItem(`crowdpulse_participant_${evId}`);
        if (stored) {
          navigate(`/event/${evId}`);
        }
      } catch (e) {
        setErrorMsg("Event not found. Please check your join code.");
      } finally {
        setLoading(false);
      }
    }
    findEvent();
  }, [cleanCode, navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (event.settings?.require_name && !name.trim()) {
      setErrorMsg("Please enter your name to join.");
      return;
    }

    const evId = event.id || event._id;
    setJoining(true);
    try {
      const data = await api.post(`/events/${evId}/join`, {
        name: name.trim() || "Guest",
      });
      localStorage.setItem(`crowdpulse_participant_${evId}`, JSON.stringify(data.participant));
      navigate(`/event/${evId}`);
    } catch (e: any) {
      setErrorMsg(e.message || "Unable to join event. Please retry.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-400">Locating event #{cleanCode}...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !event) {
    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#161b26] border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            ✕
          </div>
          <h2 className="text-xl font-bold text-white">Invalid Event Code</h2>
          <p className="text-xs text-slate-400">{errorMsg}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const joinCode = event?.joinCode || event?.join_code || cleanCode;

  return (
    <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#161b26] border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
            <span>Code: #{joinCode}</span>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight line-clamp-2">
            {event?.title}
          </h2>

          <p className="text-xs text-slate-400">
            Join the interactive session from your phone.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Name / Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required={event?.settings?.require_name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prodipta Roy"
                className="w-full bg-[#0c1017] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={joining}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950 active:scale-95 disabled:opacity-50"
          >
            <span>{joining ? "Joining..." : "Join Event"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>No account or download required</span>
        </div>
      </div>
    </div>
  );
};

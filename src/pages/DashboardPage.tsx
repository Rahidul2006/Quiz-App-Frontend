import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Calendar,
  Users,
  Radio,
  Tv,
  QrCode,
  ArrowUpRight,
  Activity,
  LogOut,
  X,
  Clock,
  Trash2,
  AlertTriangle,
  Sparkles,
  Scale,
  Pause,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EventItem } from "../types";
import { QrModal } from "../components/qr/QrModal";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Event Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDurationVal, setCustomDurationVal] = useState<string>("25");
  const [requireName, setRequireName] = useState(true);
  const [creating, setCreating] = useState(false);

  const selectedDuration = isCustomDuration ? (Number(customDurationVal) || 30) : duration;

  // QR Modal state
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventItem | null>(null);

  // Delete Event Modal state
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.get("/events");
      setEvents(data);
    } catch (e: any) {
      console.error(e);
      if (e?.status === 401 || e?.status === 403) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
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
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      navigate(`/dashboard/events/${newEv.id || newEv._id}`);
    } catch (e) {
      console.error("Create event error", e);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    const evId = eventToDelete.id || eventToDelete._id || "";
    setDeleting(true);
    try {
      await api.delete(`/events/${evId}`);
      setEvents((prev) => prev.filter((e) => (e.id || e._id) !== evId));
      setEventToDelete(null);
    } catch (err) {
      console.error("Failed to delete event:", err);
    } finally {
      setDeleting(false);
    }
  };

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === "active" || e.status === "LIVE" || e.status === "live").length;
  const totalParticipants = events.reduce((sum, e) => sum + (e.participant_count || 0), 0);
  const totalActivities = events.reduce((sum, e) => sum + (e.activity_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4 text-slate-950 fill-current" />
              </div>
              <span className="font-black text-lg tracking-tight text-white">
                quz<span className="text-emerald-400">antagonic</span>
              </span>
            </Link>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
              Host Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/judging"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition-all shadow-sm"
            >
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Judging & Hackathons</span>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Event</span>
            </motion.button>

            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Event Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time oversight over all your live sessions, audience votes, and interactive tournaments.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="bg-[#121722] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {totalEvents}
            </p>
          </div>

          <div className="bg-[#121722] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Sessions</span>
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tabular-nums">
              {activeEvents}
            </p>
          </div>

          <div className="bg-[#121722] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Attendees</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {totalParticipants}
            </p>
          </div>

          <div className="bg-[#121722] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Activities Created</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {totalActivities}
            </p>
          </div>
        </div>

        {/* Events List Header */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <span>Your Events</span>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/80 tabular-nums">
              {events.length}
            </span>
          </h2>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Event</span>
          </button>
        </div>

        {/* Events Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs sm:text-sm">
            Loading events from database...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#121722] border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No events created yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create your first event to start hosting live audience polls, word clouds, and interactive quizzes.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {events.map((ev, idx) => {
                const evId = ev.id || ev._id || "";
                const joinCode = ev.joinCode || ev.join_code || "";
                const isLive = ev.status === "active" || ev.status === "LIVE" || ev.status === "live";
                const isWaiting = ev.status === "WAITING" || ev.status === "waiting" || ev.status === "draft";
                const isPaused = ev.status === "PAUSED" || ev.status === "paused";
                const isEnded = ev.status === "ENDED" || ev.status === "ended";

                return (
                  <motion.div
                    layout
                    key={evId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: 0.05 * idx }}
                    whileHover={{ y: -3 }}
                    className="bg-[#121722] border border-slate-800/90 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            isLive
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5"
                              : isPaused
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30 flex items-center gap-1.5"
                              : isWaiting
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1.5"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {isPaused && <Pause className="w-2.5 h-2.5 text-amber-400" />}
                          {isWaiting && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          {isLive ? "Active" : isPaused ? "Paused" : isWaiting ? "Waiting Room" : "Ended"}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60">
                          #{joinCode}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {ev.title}
                      </h3>

                      {ev.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800/80">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="tabular-nums font-mono">{ev.participant_count || 0}</span> participants
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="tabular-nums font-mono">{ev.activity_count || 0}</span> activities
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
                      <Link
                        to={`/dashboard/events/${evId}`}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
                      >
                        <span>Manage</span>
                      </Link>

                      <Link
                        to={`/events/${evId}/present`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold text-xs transition-colors border border-emerald-500/30"
                      >
                        <Tv className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Present</span>
                      </Link>

                      <button
                        onClick={() => setSelectedQrEvent(ev)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700"
                        title="Show QR Code"
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                      </button>

                      <button
                        onClick={() => setEventToDelete(ev)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 font-semibold text-xs transition-colors border border-slate-700/60 hover:border-red-500/40"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#121722] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl z-10"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-white mb-1">Create New Event</h3>
              <p className="text-xs text-slate-400 mb-6">
                A 7-digit join code and QR code will be generated for your attendees.
              </p>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Community Conference 2026"
                    className="w-full bg-[#090d14] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your session, schedule or topics..."
                    className="w-full bg-[#090d14] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-medium"
                  />
                </div>

                {/* Timing System / Duration Configuration */}
                <div className="space-y-2 p-4 bg-[#090d14] rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Event Duration</span>
                    </label>
                    <span className="text-xs font-mono text-emerald-400 font-bold tabular-nums">
                      {selectedDuration} min
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Event initializes in <strong className="text-amber-400 font-semibold">WAITING</strong> mode. Timer only begins when you click <strong className="text-emerald-400 font-semibold">START EVENT</strong>.
                  </p>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[5, 10, 15, 20, 30, 45, 60].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => {
                          setDuration(preset);
                          setIsCustomDuration(false);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          !isCustomDuration && duration === preset
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                            : "bg-[#131824] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsCustomDuration(true)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        isCustomDuration
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-[#131824] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
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
                        className="w-28 bg-[#131824] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-xs text-slate-400">minutes</span>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={requireName}
                      onChange={(e) => setRequireName(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 bg-[#131824] border-slate-700 focus:ring-emerald-500"
                    />
                    <span>Require attendees to enter their name upon joining</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                  >
                    <span>{creating ? "Creating..." : "Create & Launch"}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Event Confirmation Modal */}
      <AnimatePresence>
        {eventToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEventToDelete(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#121722] border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Delete Event</h3>
                <p className="text-xs text-slate-300">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-white font-semibold">&ldquo;{eventToDelete.title}&rdquo;</strong>?
                </p>
                <p className="text-[11px] text-red-400/90 leading-relaxed pt-1">
                  This action cannot be undone. All associated activities, participant records, polls, and quiz answers will be permanently erased.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setEventToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? "Deleting..." : "Yes, Delete Event"}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      {selectedQrEvent && (
        <QrModal
          isOpen={Boolean(selectedQrEvent)}
          onClose={() => setSelectedQrEvent(null)}
          joinCode={selectedQrEvent.joinCode || selectedQrEvent.join_code || ""}
          eventName={selectedQrEvent.title}
        />
      )}
    </div>
  );
};


import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const activeEvents = events.filter((e) => e.status === "active" || e.status === "LIVE").length;
  const totalParticipants = events.reduce((sum, e) => sum + (e.participant_count || 0), 0);
  const totalActivities = events.reduce((sum, e) => sum + (e.activity_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#0c1017] flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#121620]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#0c1017] fill-current" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Crowd<span className="text-emerald-400">Pulse</span>
              </span>
            </Link>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Admin Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-950 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Event Management Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time control over all your live sessions, audience votes, and quiz tournaments.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b26] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Events</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {totalEvents}
            </p>
          </div>

          <div className="bg-[#161b26] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Active Sessions</span>
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              {activeEvents}
            </p>
          </div>

          <div className="bg-[#161b26] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Participants</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {totalParticipants}
            </p>
          </div>

          <div className="bg-[#161b26] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Activities</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {totalActivities}
            </p>
          </div>
        </div>

        {/* Events List Header */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Your Events</span>
            <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {events.length}
            </span>
          </h2>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>

        {/* Events Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Loading events from database...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#141822] border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => {
              const evId = ev.id || ev._id || "";
              const joinCode = ev.joinCode || ev.join_code || "";
              const isLive = ev.status === "active" || ev.status === "LIVE" || ev.status === "live";
              return (
                <div
                  key={evId}
                  className="bg-[#161b26] border border-slate-800/90 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isLive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {isLive ? "● Active" : ev.status}
                      </span>

                      <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                        #{joinCode}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {ev.title}
                    </h3>

                    {ev.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800/80">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {ev.participant_count || 0} participants
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        {ev.activity_count || 0} activities
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
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-950"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Present</span>
                    </Link>

                    <button
                      onClick={() => setSelectedQrEvent(ev)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700"
                      title="Show QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setEventToDelete(ev)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 font-semibold text-xs transition-colors border border-slate-700/60 hover:border-red-500/40"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#161b26] border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Create New Event</h3>
            <p className="text-xs text-slate-400 mb-6">
              We&apos;ll automatically generate a short join code and QR code.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
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
                  placeholder="Describe your session, schedule or topics..."
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
                  Event initializes in <strong className="text-amber-400">WAITING</strong> mode. Timer only starts when you click <strong className="text-emerald-400">▶ START EVENT</strong>.
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
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>{creating ? "Creating..." : "Create & Launch"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#161b26] border border-red-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
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
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? "Deleting..." : "Yes, Delete Event"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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


import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Tv,
  QrCode,
  Users,
  Plus,
  Play,
  Square,
  Trash2,
  ExternalLink,
  Clock,
  AlertTriangle,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket, joinEventRoom, leaveEventRoom } from "../services/socket";
import { Activity, EventItem, Participant, PollOption, QuizQuestion } from "../types";
import { QrModal } from "../components/qr/QrModal";
import { PollVisualizer } from "../components/activities/PollVisualizer";
import { WordCloudVisualizer } from "../components/activities/WordCloudVisualizer";
import { QuizArena } from "../components/activities/QuizArena";
import { ParticipantNameCloud } from "../components/waiting/ParticipantNameCloud";

export const EventManagementPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<"activities" | "participants" | "results" | "settings">("activities");
  const [loading, setLoading] = useState(true);

  // Lifecycle & Timer states
  const [eventDuration, setEventDuration] = useState<number>(30);
  const [startingEvent, setStartingEvent] = useState(false);
  const [stoppingEvent, setStoppingEvent] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);

  // Create Activity Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activityType, setActivityType] = useState<"poll" | "word_cloud" | "quiz">("poll");
  const [activityTitle, setActivityTitle] = useState("");
  const [pollOptionsInput, setPollOptionsInput] = useState(["", "", ""]);
  const [pollType, setPollType] = useState<"single" | "multiple">("single");

  // Quiz creation inputs
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{
      question_text: string;
      time_limit_sec: number;
      options: Array<{ text: string; is_correct: boolean }>;
    }>
  >([
    {
      question_text: "",
      time_limit_sec: 15,
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    },
  ]);

  // Live Results
  const [pollResults, setPollResults] = useState<{ options: PollOption[]; total: number }>({ options: [], total: 0 });
  const [wordCloudWords, setWordCloudWords] = useState<any[]>([]);
  const [quizLeaderboard, setQuizLeaderboard] = useState<any[]>([]);

  const loadEventData = async () => {
    if (!eventId) return;
    try {
      const ev = await api.get(`/events/${eventId}`);
      setEvent(ev);
      const acts = await api.get(`/events/${eventId}/activities`);
      setActivities(acts);
      const parts = await api.get(`/events/${eventId}/participants`);
      setParticipants(parts);

      const activeActId = ev.activeActivityId || ev.active_activity_id;
      if (activeActId) {
        const act = acts.find((a: any) => (a.id || a._id) === activeActId);
        if (act) {
          if (act.type === "poll" || act.type === "word_cloud") {
            const res = await api.get(`/activities/${activeActId}/results`);
            if (act.type === "poll") {
              setPollResults({ options: res.options || [], total: res.total || 0 });
            } else {
              setWordCloudWords(res.words || []);
            }
          } else if (act.type === "quiz") {
            const lb = await api.get(`/quizzes/${activeActId}/leaderboard`);
            setQuizLeaderboard(lb);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();

    if (eventId) {
      joinEventRoom(eventId);
      const socket = getSocket();

      socket.on("participant:joined", (data) => {
        setParticipants((prev) => {
          if (prev.some((p) => (p.id || p._id) === (data.participant.id || data.participant._id))) {
            return prev;
          }
          return [data.participant, ...prev];
        });
      });

      socket.on("participants:updated", () => {
        // Updated
      });

      socket.on("event:started", (data) => {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                status: "LIVE",
                startedAt: data.startedAt,
                endsAt: data.endsAt,
                duration: data.duration,
              }
            : null
        );
        loadEventData();
      });

      socket.on("event:ended", (data) => {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                status: "ENDED",
                stoppedAt: data.stoppedAt,
              }
            : null
        );
      });

      socket.on("activity:started", (data) => {
        setEvent((prev) => (prev ? { ...prev, activeActivityId: data.activity.id } : null));
        loadEventData();
      });

      socket.on("activity:closed", () => {
        setEvent((prev) => (prev ? { ...prev, activeActivityId: null } : null));
        loadEventData();
      });

      socket.on("poll:results_updated", (data) => {
        setPollResults({ options: data.options, total: data.total });
      });

      socket.on("wordcloud:updated", (data) => {
        setWordCloudWords(data.words);
      });

      socket.on("quiz:leaderboard_updated", (data) => {
        setQuizLeaderboard(data.leaderboard);
      });

      socket.on("quiz:finished", (data) => {
        setQuizLeaderboard(data.leaderboard);
      });

      return () => {
        leaveEventRoom(eventId);
        socket.off("participant:joined");
        socket.off("participants:updated");
        socket.off("event:started");
        socket.off("event:ended");
        socket.off("activity:started");
        socket.off("activity:closed");
        socket.off("poll:results_updated");
        socket.off("wordcloud:updated");
        socket.off("quiz:leaderboard_updated");
        socket.off("quiz:finished");
      };
    }
  }, [eventId]);

  // Countdown Timer Effect based on server endsAt
  useEffect(() => {
    const endsAtValue = event?.endsAt || (event as any)?.ends_at;
    const isLive = event?.status === "LIVE" || event?.status === "live";

    if (!event || !isLive || !endsAtValue) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const ends = new Date(endsAtValue).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((ends - now) / 1000));
      setRemainingSeconds(diffSec);

      if (diffSec <= 0) {
        setEvent((prev) => (prev ? { ...prev, status: "ENDED" } : null));
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [event?.status, event?.endsAt, (event as any)?.ends_at]);

  const handleStartEvent = async () => {
    if (!eventId) return;
    setStartingEvent(true);
    try {
      const res = await api.post(`/events/${eventId}/start`, { duration: eventDuration });
      setEvent(res);
      loadEventData();
    } catch (e: any) {
      console.error("Start event error:", e);
      alert(e.message || "Failed to start event");
    } finally {
      setStartingEvent(false);
    }
  };

  const handleStopEvent = async () => {
    if (!eventId) return;
    setStoppingEvent(true);
    try {
      const res = await api.post(`/events/${eventId}/stop`, {});
      setEvent(res);
      setShowStopModal(false);
      loadEventData();
    } catch (e: any) {
      console.error("Stop event error:", e);
      alert(e.message || "Failed to stop event");
    } finally {
      setStoppingEvent(false);
    }
  };

  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null || isNaN(totalSeconds)) return "--:--";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const activeActId = event?.activeActivityId || event?.active_activity_id;
  const activeActivity = activities.find((a: any) => (a.id || a._id) === activeActId);

  const handleLaunch = async (activityId: string) => {
    await api.post(`/activities/${activityId}/launch`, {});
    loadEventData();
  };

  const handleStop = async (activityId: string) => {
    await api.post(`/activities/${activityId}/stop`, {});
    loadEventData();
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      await api.delete(`/activities/${activityId}`);
      loadEventData();
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim() || !eventId) return;

    if (activityType === "poll") {
      const filtered = pollOptionsInput.filter((o) => o.trim().length > 0);
      const options = filtered.map((text, idx) => ({
        text: text.trim(),
        order_index: idx,
      }));

      await api.post(`/events/${eventId}/activities`, {
        type: "poll",
        title: activityTitle.trim(),
        settings: { poll_type: pollType, show_live_results: true },
        options,
      });
    } else if (activityType === "word_cloud") {
      await api.post(`/events/${eventId}/activities`, {
        type: "word_cloud",
        title: activityTitle.trim(),
        settings: { show_live_results: true },
      });
    } else if (activityType === "quiz") {
      const questions = quizQuestions.map((q, qIdx) => ({
        question_text: q.question_text.trim(),
        time_limit_sec: q.time_limit_sec || 15,
        points: 1000,
        order_index: qIdx,
        options: q.options.map((opt, oIdx) => ({
          option_text: opt.text.trim(),
          is_correct: opt.is_correct,
          order_index: oIdx,
        })),
      }));

      await api.post(`/events/${eventId}/activities`, {
        type: "quiz",
        title: activityTitle.trim(),
        settings: { quiz_state: "answering" },
        questions,
      });
    }

    setShowCreateModal(false);
    setActivityTitle("");
    setPollOptionsInput(["", "", ""]);
    loadEventData();
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center text-slate-400">
        Loading event details...
      </div>
    );
  }

  const joinCode = event.joinCode || event.join_code || "";
  const evId = event.id || event._id || "";

  const isWaiting = event.status === "WAITING" || event.status === "waiting" || event.status === "draft";
  const isLive = event.status === "LIVE" || event.status === "live" || event.status === "active";
  const isEnded = event.status === "ENDED" || event.status === "ended";

  return (
    <div className="min-h-screen bg-[#0c1017] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#121620]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                {isWaiting && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    WAITING FOR START
                  </span>
                )}
                {isLive && (
                  <>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      EVENT LIVE
                    </span>
                    {remainingSeconds !== null && (
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimer(remainingSeconds)}
                      </span>
                    )}
                  </>
                )}
                {isEnded && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    EVENT ENDED
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                  #{joinCode}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-300 font-medium">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{participants.length} joined</span>
            </div>

            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Show QR</span>
            </button>

            {isWaiting && (
              <button
                onClick={handleStartEvent}
                disabled={startingEvent}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-950 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{startingEvent ? "Starting..." : "START EVENT"}</span>
              </button>
            )}

            {isLive && (
              <button
                onClick={() => setShowStopModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950 active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Event</span>
              </button>
            )}

            <Link
              to={`/events/${evId}/present`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>Presentation Mode</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 border-t border-slate-800/60 pt-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab("activities")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "activities"
                ? "border-emerald-400 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Activities ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab("participants")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "participants"
                ? "border-emerald-400 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Participants ({participants.length})
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-emerald-400 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Live Results
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-emerald-400 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* STATE 1: WAITING ROOM HERO */}
        {isWaiting && (
          <div className="bg-gradient-to-r from-amber-950/30 via-[#161e29] to-[#121722] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  Waiting Room Active
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Waiting for Host to Start
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Participants can join and see their names live on screen. Configure event duration and launch when you're ready!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-[#0c1017] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 shadow-inner">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-400">Duration:</span>
                  <select
                    value={eventDuration}
                    onChange={(e) => setEventDuration(Number(e.target.value))}
                    className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value={5} className="bg-slate-900 text-white">5 minutes</option>
                    <option value={10} className="bg-slate-900 text-white">10 minutes</option>
                    <option value={15} className="bg-slate-900 text-white">15 minutes</option>
                    <option value={20} className="bg-slate-900 text-white">20 minutes</option>
                    <option value={30} className="bg-slate-900 text-white">30 minutes</option>
                    <option value={45} className="bg-slate-900 text-white">45 minutes</option>
                    <option value={60} className="bg-slate-900 text-white">60 minutes</option>
                  </select>
                </div>

                <button
                  onClick={handleStartEvent}
                  disabled={startingEvent}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/60 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{startingEvent ? "Starting Event..." : "▶ START EVENT"}</span>
                </button>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Show QR</span>
                </button>
              </div>
            </div>

            {/* Live Name Cloud in Waiting Room */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Live Participant Cloud</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {participants.length} {participants.length === 1 ? "participant" : "participants"} joined
                </span>
              </div>
              <ParticipantNameCloud
                participants={participants}
                variant="admin"
                emptyMessage={`No participants have joined yet. Scan QR code or share #${joinCode} to join!`}
              />
            </div>
          </div>
        )}
        {/* TAB 1: ACTIVITIES */}
        {activeTab === "activities" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Event Activities</h3>
                <p className="text-xs text-slate-400">
                  Manage polls, dynamic word clouds, and interactive timed quizzes.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Activity</span>
              </button>
            </div>

            <div className="space-y-4">
              {activities.map((activity) => {
                const actId = activity.id || activity._id || "";
                const isActive = actId === activeActId;
                return (
                  <div
                    key={actId}
                    className={`bg-[#161b26] border rounded-2xl p-5 shadow-lg transition-all ${
                      isActive
                        ? "border-emerald-500/50 bg-[#16202c]"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              activity.type === "poll"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : activity.type === "word_cloud"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                          >
                            {activity.type.replace("_", " ")}
                          </span>

                          {isActive && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ● Live on stage
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white">
                          {activity.title}
                        </h4>

                        <div className="text-xs text-slate-400">
                          {activity.type === "poll" && (
                            <span>{activity.options?.length || 0} options available</span>
                          )}
                          {activity.type === "word_cloud" && (
                            <span>Audience word cluster visualization</span>
                          )}
                          {activity.type === "quiz" && (
                            <span>{activity.questions?.length || 0} questions with timer & leaderboard</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <button
                            onClick={() => handleStop(actId)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLaunch(actId)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Launch</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteActivity(actId)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete Activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PARTICIPANTS */}
        {activeTab === "participants" && (
          <div className="bg-[#161b26] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Joined Participants</h3>
                <p className="text-xs text-slate-400">
                  Audience members currently connected to this event.
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-xl">
                {participants.length} attendees
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {participants.map((p, idx) => (
                <div
                  key={p.id || p._id || idx}
                  className="flex items-center justify-between py-3 px-2 hover:bg-slate-800/40 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{p.name}</p>
                      {p.email && <p className="text-xs text-slate-500">{p.email}</p>}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {p.joinedAt || p.joined_at ? new Date(p.joinedAt || p.joined_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                  </span>
                </div>
              ))}

              {participants.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No participants have joined yet. Share the QR code or link to invite attendees!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE RESULTS */}
        {activeTab === "results" && (
          <div className="space-y-6">
            <div className="bg-[#161b26] border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-6">Live Activity Results</h3>

              {activeActivity ? (
                <div>
                  {activeActivity.type === "poll" && (
                    <PollVisualizer
                      question={activeActivity.title}
                      options={pollResults.options}
                      totalVotes={pollResults.total}
                    />
                  )}
                  {activeActivity.type === "word_cloud" && (
                    <WordCloudVisualizer
                      question={activeActivity.title}
                      words={wordCloudWords}
                    />
                  )}
                  {activeActivity.type === "quiz" && activeActivity.questions && (
                    <QuizArena
                      question={activeActivity.questions[activeActivity.activeQuestionIndex || 0]}
                      questionIndex={activeActivity.activeQuestionIndex || 0}
                      totalQuestions={activeActivity.questions.length}
                      leaderboard={quizLeaderboard}
                      isAdmin={true}
                      onAdvance={async () => {
                        const nextIdx = (activeActivity.activeQuestionIndex || 0) + 1;
                        await api.post(`/quizzes/${activeActivity.id || activeActivity._id}/advance`, {
                          questionIndex: nextIdx,
                        });
                        loadEventData();
                      }}
                      onFinish={async () => {
                        await api.post(`/quizzes/${activeActivity.id || activeActivity._id}/finish`, {});
                        loadEventData();
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No activity is currently active. Launch a poll, word cloud, or quiz to inspect live results.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-[#161b26] border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl space-y-6">
            <h3 className="text-base font-bold text-white">Event Configuration</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Event Join Code</label>
                <div className="font-mono text-lg font-bold text-emerald-400 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 inline-block">
                  #{joinCode}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Direct Join URL</label>
                <div className="font-mono text-slate-300 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 break-all">
                  {window.location.origin}/join/{joinCode}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-red-400">Delete Event</p>
                  <p className="text-slate-500">Permanently delete this event, activities and participant records.</p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to permanently delete this event?")) {
                      await api.delete(`/events/${evId}`);
                      navigate("/dashboard");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold border border-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE ACTIVITY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#161b26] border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl my-8">
            <h3 className="text-xl font-bold text-white mb-2">Create New Activity</h3>
            <p className="text-xs text-slate-400 mb-6">
              Choose the activity format and configure questions.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setActivityType("poll")}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  activityType === "poll"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                📊 Live Poll
              </button>
              <button
                type="button"
                onClick={() => setActivityType("word_cloud")}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  activityType === "word_cloud"
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                ☁ Word Cloud
              </button>
              <button
                type="button"
                onClick={() => setActivityType("quiz")}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  activityType === "quiz"
                    ? "bg-purple-500/20 border-purple-500 text-purple-400"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                🏆 Trivia Quiz
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Question / Title *
                </label>
                <input
                  type="text"
                  required
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder={
                    activityType === "poll"
                      ? "e.g. Where are you joining from?"
                      : activityType === "word_cloud"
                      ? "e.g. Describe React in one word"
                      : "e.g. Web Engineering Trivia Challenge"
                  }
                  className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {activityType === "poll" && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Poll Choices
                  </label>
                  {pollOptionsInput.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...pollOptionsInput];
                        copy[idx] = e.target.value;
                        setPollOptionsInput(copy);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setPollOptionsInput([...pollOptionsInput, ""])}
                    className="text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    + Add another option
                  </button>
                </div>
              )}

              {activityType === "quiz" && (
                <div className="space-y-4 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Question 1
                  </label>
                  <input
                    type="text"
                    required
                    value={quizQuestions[0].question_text}
                    onChange={(e) => {
                      const copy = [...quizQuestions];
                      copy[0].question_text = e.target.value;
                      setQuizQuestions(copy);
                    }}
                    placeholder="e.g. Which company created React?"
                    className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {quizQuestions[0].options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                          opt.is_correct ? "border-emerald-500 bg-emerald-950/30" : "border-slate-800 bg-[#0c1017]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="correct_option"
                          checked={opt.is_correct}
                          onChange={() => {
                            const copy = [...quizQuestions];
                            copy[0].options.forEach((o, i) => (o.is_correct = i === idx));
                            setQuizQuestions(copy);
                          }}
                          className="text-emerald-500 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => {
                            const copy = [...quizQuestions];
                            copy[0].options[idx].text = e.target.value;
                            setQuizQuestions(copy);
                          }}
                          placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                          className="bg-transparent text-xs text-white focus:outline-none w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950"
                >
                  Create Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOP EVENT CONFIRMATION MODAL */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#161b26] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">End This Event?</h3>
                <p className="text-xs text-slate-400">This will stop all activities and close voting.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to end <strong className="text-white">"{event.title}"</strong>? All connected participants and presentation screens will transition to the Event Ended screen.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStopModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStopEvent}
                disabled={stoppingEvent}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950 transition-colors active:scale-95 disabled:opacity-50"
              >
                {stoppingEvent ? "Ending..." : "End Event Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      <QrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        joinCode={joinCode}
        eventName={event.title}
      />
    </div>
  );
};

import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Tv,
  QrCode,
  Users,
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  ExternalLink,
  Clock,
  AlertTriangle,
  Radio,
  CheckCircle2,
  BarChart3,
  Trophy,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Hash,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket, joinEventRoom, leaveEventRoom } from "../services/socket";
import { Activity, EventItem, Participant, PollOption, QuizQuestion, LeaderboardEntry } from "../types";
import { QrModal } from "../components/qr/QrModal";
import { PollVisualizer } from "../components/activities/PollVisualizer";
import { WordCloudVisualizer } from "../components/activities/WordCloudVisualizer";
import { QuizArena } from "../components/activities/QuizArena";
import { QuizLeaderboard } from "../components/activities/QuizLeaderboard";
import { ParticipantNameCloud } from "../components/waiting/ParticipantNameCloud";

export const EventManagementPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<"activities" | "participants" | "results" | "settings">("activities");
  const [loading, setLoading] = useState(true);

  // Lifecycle & Activity timing states
  const [startingEvent, setStartingEvent] = useState(false);
  const [stoppingEvent, setStoppingEvent] = useState(false);
  const [pausingEvent, setPausingEvent] = useState(false);
  const [resumingEvent, setResumingEvent] = useState(false);
  const [pausingActivityId, setPausingActivityId] = useState<string | null>(null);
  const [resumingActivityId, setResumingActivityId] = useState<string | null>(null);
  const [restartingActivityId, setRestartingActivityId] = useState<string | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);

  // Authoritative activity timer ticker (1-second tick for live cards)
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);

  // Delete Event Modal
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Create Activity Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activityType, setActivityType] = useState<"poll" | "word_cloud" | "quiz">("poll");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDuration, setActivityDuration] = useState<number>(30);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customDurationVal, setCustomDurationVal] = useState<string>("30");
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

  // Live Results State
  const [pollResults, setPollResults] = useState<{ options: PollOption[]; total: number }>({ options: [], total: 0 });
  const [wordCloudWords, setWordCloudWords] = useState<any[]>([]);
  const [quizLeaderboard, setQuizLeaderboard] = useState<any[]>([]);

  // Results Tab Inspector State
  const [selectedResultActivityId, setSelectedResultActivityId] = useState<string | null>(null);
  const [activityResultsData, setActivityResultsData] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState<boolean>(false);

  const fetchActivityResult = useCallback(async (actId: string) => {
    setLoadingResults(true);
    try {
      const act = activities.find((a: any) => (a.id || a._id) === actId);
      if (act && act.type === "quiz") {
        const lb = await api.get(`/quizzes/${actId}/leaderboard`);
        setActivityResultsData({ type: "quiz", leaderboard: lb, activity: act });
      } else {
        const res = await api.get(`/activities/${actId}/results`);
        setActivityResultsData({ ...res, activity: act });
      }
    } catch (err) {
      console.error("Failed to fetch activity results:", err);
    } finally {
      setLoadingResults(false);
    }
  }, [activities]);

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
    } catch (e: any) {
      console.error(e);
      if (e?.status === 401 || e?.status === 403) {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!eventId) return;
    setDeletingEvent(true);
    try {
      await api.delete(`/events/${eventId}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to delete event:", err);
    } finally {
      setDeletingEvent(false);
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
                endsAt: null,
              }
            : null
        );
        loadEventData();
      });

      socket.on("event:paused", () => {
        setEvent((prev) => (prev ? { ...prev, status: "PAUSED" } : null));
        loadEventData();
      });

      socket.on("event:resumed", () => {
        setEvent((prev) => (prev ? { ...prev, status: "LIVE" } : null));
        loadEventData();
      });

      socket.on("event:ended", (data) => {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                status: "ENDED",
                stoppedAt: data.stoppedAt,
                activeActivityId: null,
              }
            : null
        );
        loadEventData();
      });

      socket.on("activity:started", (data) => {
        const startedId = data.activity.id || data.activity._id;
        setEvent((prev) => (prev ? { ...prev, activeActivityId: startedId } : null));
        setActivities((prev) =>
          prev.map((a) => {
            const aId = a.id || (a as any)._id;
            if (aId === startedId) {
              return { ...a, ...data.activity, status: "LIVE" };
            }
            if (a.status === "LIVE" || a.status === "active") {
              return { ...a, status: "ENDED" };
            }
            return a;
          })
        );
        loadEventData();
      });

      socket.on("activity:paused", (data) => {
        if (data?.activityId) {
          setActivities((prev) =>
            prev.map((a) => {
              const aId = a.id || (a as any)._id;
              if (aId === data.activityId) {
                return {
                  ...a,
                  status: "PAUSED",
                  remainingSeconds: data.remainingSeconds,
                  endsAt: null,
                };
              }
              return a;
            })
          );
        }
        loadEventData();
      });

      socket.on("activity:resumed", (data) => {
        const actId = data?.activity?.id || data?.activity?._id;
        setEvent((prev) => (prev ? { ...prev, activeActivityId: actId } : null));
        setActivities((prev) =>
          prev.map((a) => {
            const aId = a.id || (a as any)._id;
            if (aId === actId) {
              return { ...a, ...data.activity, status: "LIVE" };
            }
            return a;
          })
        );
        loadEventData();
      });

      socket.on("activity:restarted", (data) => {
        const actId = data?.activity?.id || data?.activity?._id;
        setEvent((prev) => (prev ? { ...prev, activeActivityId: actId } : null));
        loadEventData();
      });

      socket.on("activity:closed", (data) => {
        setEvent((prev) => (prev ? { ...prev, activeActivityId: null } : null));
        if (data?.activityId) {
          setActivities((prev) =>
            prev.map((a) => {
              const aId = a.id || (a as any)._id;
              if (aId === data.activityId) {
                return { ...a, status: "ENDED" };
              }
              return a;
            })
          );
        }
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
        socket.off("event:paused");
        socket.off("event:resumed");
        socket.off("event:ended");
        socket.off("activity:started");
        socket.off("activity:paused");
        socket.off("activity:resumed");
        socket.off("activity:restarted");
        socket.off("activity:closed");
        socket.off("poll:results_updated");
        socket.off("wordcloud:updated");
        socket.off("quiz:leaderboard_updated");
        socket.off("quiz:finished");
      };
    }
  }, [eventId]);

  const handleStartEvent = async () => {
    if (!eventId) return;
    setStartingEvent(true);
    try {
      const res = await api.post(`/events/${eventId}/start`, {});
      setEvent(res);
      loadEventData();
    } catch (e: any) {
      console.error("Start event error:", e);
      alert(e.message || "Failed to start event");
    } finally {
      setStartingEvent(false);
    }
  };

  const handlePauseEvent = async () => {
    if (!eventId) return;
    setPausingEvent(true);
    try {
      const res = await api.post(`/events/${eventId}/pause`, {});
      setEvent(res);
      loadEventData();
    } catch (e: any) {
      console.error("Pause event error:", e);
      alert(e.message || "Failed to pause event");
    } finally {
      setPausingEvent(false);
    }
  };

  const handleResumeEvent = async () => {
    if (!eventId) return;
    setResumingEvent(true);
    try {
      const res = await api.post(`/events/${eventId}/resume`, {});
      setEvent(res);
      loadEventData();
    } catch (e: any) {
      console.error("Resume event error:", e);
      alert(e.message || "Failed to resume event");
    } finally {
      setResumingEvent(false);
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

  const getActivityRemainingSeconds = (act: Activity) => {
    if (act.status === "PAUSED" || act.status === "paused") {
      return typeof act.remainingSeconds === "number"
        ? act.remainingSeconds
        : typeof (act as any).remaining_seconds === "number"
        ? (act as any).remaining_seconds
        : act.duration || 30;
    }
    const endsAtValue = act.endsAt || (act as any).ends_at;
    if (!endsAtValue) return null;
    const diff = Math.max(0, Math.ceil((new Date(endsAtValue).getTime() - nowTimestamp) / 1000));
    return diff;
  };

  const formatSeconds = (totalSeconds: number | null) => {
    if (totalSeconds === null || isNaN(totalSeconds)) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDurationBadge = (seconds?: number) => {
    const s = seconds || 30;
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  };

  const activeActId = event?.activeActivityId || event?.active_activity_id;
  const activeActivity = activities.find((a: any) => (a.id || a._id) === activeActId);

  const handleLaunch = async (activityId: string) => {
    await api.post(`/activities/${activityId}/launch`, {});
    loadEventData();
  };

  const handlePauseActivity = async (activityId: string) => {
    setPausingActivityId(activityId);
    try {
      await api.post(`/activities/${activityId}/pause`, {});
      loadEventData();
    } catch (e: any) {
      console.error("Pause activity error:", e);
      alert(e.message || "Failed to pause activity");
    } finally {
      setPausingActivityId(null);
    }
  };

  const handleResumeActivity = async (activityId: string) => {
    setResumingActivityId(activityId);
    try {
      await api.post(`/activities/${activityId}/resume`, {});
      loadEventData();
    } catch (e: any) {
      console.error("Resume activity error:", e);
      alert(e.message || "Failed to resume activity");
    } finally {
      setResumingActivityId(null);
    }
  };

  const handleRestartActivity = async (activityId: string) => {
    if (confirm("Restart this activity? This will clear previous responses and restart the live countdown.")) {
      setRestartingActivityId(activityId);
      try {
        await api.post(`/activities/${activityId}/restart`, {});
        loadEventData();
      } catch (e: any) {
        console.error("Restart activity error:", e);
        alert(e.message || "Failed to restart activity");
      } finally {
        setRestartingActivityId(null);
      }
    }
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

    const chosenDuration = isCustomDuration
      ? Math.max(5, Number(customDurationVal) || 30)
      : activityDuration;

    if (activityType === "poll") {
      const filtered = pollOptionsInput.filter((o) => o.trim().length > 0);
      const options = filtered.map((text, idx) => ({
        text: text.trim(),
        order_index: idx,
      }));

      await api.post(`/events/${eventId}/activities`, {
        type: "poll",
        title: activityTitle.trim(),
        duration: chosenDuration,
        settings: { poll_type: pollType, show_live_results: true },
        options,
      });
    } else if (activityType === "word_cloud") {
      await api.post(`/events/${eventId}/activities`, {
        type: "word_cloud",
        title: activityTitle.trim(),
        duration: chosenDuration,
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
        duration: chosenDuration,
        settings: { quiz_state: "answering" },
        questions,
      });
    }

    setShowCreateModal(false);
    setActivityTitle("");
    setPollOptionsInput(["", "", ""]);
    setActivityDuration(30);
    setIsCustomDuration(false);
    setCustomDurationVal("30");
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
  const isPaused = event.status === "PAUSED" || event.status === "paused";
  const isEnded = event.status === "ENDED" || event.status === "ended";

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* 1. EVENT HEADER */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 flex-shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-emerald-400" />
                  {joinCode}
                </span>

                {isWaiting && (
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    WAITING TO START
                  </span>
                )}
                {isLive && (
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    EVENT LIVE
                  </span>
                )}
                {isPaused && (
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
                    <Pause className="w-3 h-3 text-amber-400" />
                    EVENT PAUSED
                  </span>
                )}
                {isEnded && (
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    EVENT ENDED
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white truncate mt-1 tracking-tight">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-shrink-0">
            <Link
              to={`/events/${evId}/present`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold transition-all border border-emerald-500/30 shadow-sm"
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>Projector Stage</span>
            </Link>

            <button
              onClick={() => setShowDeleteEventModal(true)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 text-xs font-semibold border border-slate-700/60 hover:border-red-500/30 transition-colors"
              title="Delete Event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 border-t border-slate-800/60 pt-2 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("activities")}
            className={`pb-3 px-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "activities"
                ? "border-emerald-400 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Activities ({activities.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("results");
              const targetId = selectedResultActivityId || activeActId || (activities[0] ? (activities[0].id || (activities[0] as any)._id) : null);
              if (targetId) {
                setSelectedResultActivityId(targetId);
                fetchActivityResult(targetId);
              }
            }}
            className={`pb-3 px-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "results"
                ? "border-emerald-400 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Live Results Inspector
          </button>
          <button
            onClick={() => setActiveTab("participants")}
            className={`pb-3 px-1 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "participants"
                ? "border-emerald-400 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Attendee Roster ({participants.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 border-b-2 transition-all whitespace-nowrap ${
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* 2. STATUS + CONTROLS (Executive Bar) */}
        <div className="bg-[#121722] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
          {/* Subtle ambient accent */}
          <div className="absolute top-0 right-0 w-80 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                Session Status
              </span>
              <div className="flex items-center gap-2">
                {isWaiting && (
                  <span className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    Waiting Room Active
                  </span>
                )}
                {isLive && (
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    Event LIVE
                  </span>
                )}
                {isPaused && (
                  <span className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    Event Paused (On Hold)
                  </span>
                )}
                {isEnded && (
                  <span className="text-xs sm:text-sm font-bold text-red-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    Event Concluded
                  </span>
                )}
              </div>
            </div>

            {isLive && (
              <div className="flex items-center gap-2 bg-[#090d14] border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl text-xs text-emerald-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">Live Session Active</span>
              </div>
            )}
            {isPaused && (
              <div className="flex items-center gap-2 bg-[#090d14] border border-amber-500/40 px-3.5 py-1.5 rounded-2xl text-xs text-amber-300 font-mono">
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Event Paused</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {isWaiting && (
              <button
                onClick={handleStartEvent}
                disabled={startingEvent}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{startingEvent ? "Starting..." : "START EVENT"}</span>
              </button>
            )}

            {isLive && (
              <>
                <button
                  onClick={handlePauseEvent}
                  disabled={pausingEvent}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/40 shadow-lg shadow-amber-950/20 transition-all active:scale-95 disabled:opacity-50"
                  title="Pause live event"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{pausingEvent ? "Pausing..." : "PAUSE EVENT"}</span>
                </button>

                <button
                  onClick={() => setShowStopModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/40 transition-all active:scale-95"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>STOP EVENT</span>
                </button>
              </>
            )}

            {isPaused && (
              <>
                <button
                  onClick={handleResumeEvent}
                  disabled={resumingEvent}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
                  title="Resume event to LIVE"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{resumingEvent ? "Resuming..." : "RESUME EVENT"}</span>
                </button>

                <button
                  onClick={() => setShowStopModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/40 transition-all active:scale-95"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>STOP EVENT</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. PARTICIPANT OVERVIEW & LIVE ATTENDEE CLOUD */}
        <div className="bg-[#121722] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#090d14] border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs text-slate-300 font-semibold shadow-inner">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white font-bold tabular-nums font-mono">{participants.length}</span>
                <span>connected</span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Attendees join by scanning or entering #{joinCode}
              </span>
            </div>

            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Show QR Code</span>
            </button>
          </div>

          <ParticipantNameCloud
            participants={participants}
            variant="admin"
            emptyMessage={`No attendees have joined yet. Invite participants with QR code or code #${joinCode}`}
          />
        </div>

        {/* 4. ACTIVITY MANAGEMENT & 5. LIVE RESULTS */}

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

            <div className="space-y-3.5">
              {activities.map((activity) => {
                const actId = activity.id || (activity as any)._id || "";
                const isActPaused = activity.status === "PAUSED" || activity.status === "paused";
                const isActEnded = activity.status === "ENDED" || activity.status === "ended";
                const isActLive = !isActPaused && !isActEnded && (activity.status === "LIVE" || activity.status === "active" || actId === activeActId);
                const isActWaiting = !isActLive && !isActPaused && !isActEnded;

                const remaining = (isActLive || isActPaused) ? getActivityRemainingSeconds(activity) : null;
                const totalDur = activity.duration || 30;
                const progressPct = remaining !== null ? Math.max(0, Math.min(100, (remaining / totalDur) * 100)) : 0;
                const isUrgent = isActLive && remaining !== null && remaining <= 10 && remaining > 0;
                const anotherActivityIsLive = !!activeActId && activeActId !== actId;

                return (
                  <motion.div
                    key={actId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden ${
                      isActLive
                        ? "border-emerald-500/50 bg-[#101923] shadow-emerald-950/20 ring-1 ring-emerald-500/20"
                        : isActPaused
                        ? "border-amber-500/50 bg-[#171612] shadow-amber-950/20 ring-1 ring-amber-500/20"
                        : "bg-[#121722] border-slate-800/90 hover:border-slate-700/80"
                    }`}
                  >
                    {isActLive && (
                      <div className="absolute top-0 right-0 w-72 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    )}
                    {isActPaused && (
                      <div className="absolute top-0 right-0 w-72 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              activity.type === "poll"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : activity.type === "word_cloud"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                          >
                            {activity.type.replace("_", " ")}
                          </span>

                          {/* Duration Badge */}
                          <span className="text-[10px] font-mono font-semibold text-slate-300 bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-700/80 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            <span>{formatDurationBadge(activity.duration)}</span>
                          </span>

                          {/* Status Badge */}
                          {isActWaiting && (
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              WAITING
                            </span>
                          )}

                          {isActLive && (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              LIVE
                            </span>
                          )}

                          {isActPaused && (
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1.5">
                              <Pause className="w-2.5 h-2.5 text-amber-400" />
                              PAUSED
                            </span>
                          )}

                          {isActEnded && (
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-slate-400" />
                              ENDED
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white tracking-tight truncate">
                          {activity.title}
                        </h4>

                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          {activity.type === "poll" && (
                            <span>{activity.options?.length || 0} choices available</span>
                          )}
                          {activity.type === "word_cloud" && (
                            <span>Live word frequency cluster</span>
                          )}
                          {activity.type === "quiz" && (
                            <span>{activity.questions?.length || 0} questions with scoring</span>
                          )}
                        </div>
                      </div>

                      {/* Right-side Controls and Live Timer */}
                      <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                        {isActLive && (
                          <div
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono transition-all ${
                              isUrgent
                                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-lg shadow-rose-950/40"
                                : "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-rose-400" : "text-emerald-400"}`} />
                            <span className="text-xs font-bold tabular-nums">
                              {formatSeconds(remaining)}
                            </span>
                          </div>
                        )}

                        {isActPaused && (
                          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono bg-amber-950/50 border-amber-500/40 text-amber-300">
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-bold tabular-nums">
                              {formatSeconds(remaining)}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelectedResultActivityId(actId);
                            setActiveTab("results");
                            fetchActivityResult(actId);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors shadow-sm"
                          title="View Results"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Results</span>
                        </button>

                        {isActLive ? (
                          <>
                            <button
                              onClick={() => handlePauseActivity(actId)}
                              disabled={pausingActivityId === actId}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                              title="Pause Activity"
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>{pausingActivityId === actId ? "..." : "PAUSE"}</span>
                            </button>

                            <button
                              onClick={() => handleStop(actId)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-all active:scale-95"
                              title="Stop Activity"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>STOP</span>
                            </button>
                          </>
                        ) : isActPaused ? (
                          <>
                            <button
                              onClick={() => handleResumeActivity(actId)}
                              disabled={resumingActivityId === actId}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-950/30 active:scale-95 disabled:opacity-50"
                              title="Resume Activity"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{resumingActivityId === actId ? "..." : "RESUME"}</span>
                            </button>

                            <button
                              onClick={() => handleStop(actId)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-all active:scale-95"
                              title="Stop Activity"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>STOP</span>
                            </button>
                          </>
                        ) : isActWaiting ? (
                          <button
                            onClick={() => handleLaunch(actId)}
                            disabled={!isLive || anotherActivityIsLive}
                            title={
                              !isLive
                                ? "Start the event before launching activities"
                                : anotherActivityIsLive
                                ? "Stop currently live activity before starting this one"
                                : "Start Activity"
                            }
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-950/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>START ACTIVITY</span>
                          </button>
                        ) : (
                          /* isActEnded */
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestartActivity(actId)}
                              disabled={anotherActivityIsLive || restartingActivityId === actId}
                              title={
                                anotherActivityIsLive
                                  ? "Stop currently live activity before restarting this one"
                                  : "Restart this activity fresh"
                              }
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${restartingActivityId === actId ? "animate-spin" : ""}`} />
                              <span>{restartingActivityId === actId ? "Restarting..." : "RESTART"}</span>
                            </button>

                            <div className="text-xs font-mono font-semibold text-slate-400 px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                              Done
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleDeleteActivity(actId)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700/60"
                          title="Delete Activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar for LIVE Activity */}
                    {isActLive && (
                      <div className="w-full bg-slate-800/80 h-1.5 mt-3.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                            isUrgent ? "bg-rose-500" : "bg-emerald-400"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {activities.length === 0 && (
                <div className="bg-[#161b26] border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">No activities created yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Create polls, word clouds, or quiz competitions to engage your audience during the event.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Activity</span>
                  </button>
                </div>
              )}
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
                  key={p.id || (p as any)._id || idx}
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
                    {p.joinedAt || (p as any).joined_at ? new Date(p.joinedAt || (p as any).joined_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
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

        {/* TAB 3: ACTIVITY RESULTS */}
        {activeTab === "results" && (
          <div className="space-y-6">
            {/* Activity Selector Bar */}
            {activities.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-3 bg-[#121722] border border-slate-800/90 p-3 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap pl-2">Select Activity:</span>
                  {activities.map((act) => {
                    const actId = act.id || (act as any)._id || "";
                    const isSelected = selectedResultActivityId === actId;
                    const isLiveOnStage = actId === activeActId;
                    return (
                      <button
                        key={actId}
                        onClick={() => {
                          setSelectedResultActivityId(actId);
                          fetchActivityResult(actId);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/30"
                            : "bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        <span>
                          {act.type === "poll" ? "📊" : act.type === "word_cloud" ? "☁" : "🏆"} {act.title}
                        </span>
                        {isLiveOnStage && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-slate-950" : "bg-emerald-400 animate-ping"}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedResultActivityId && (
                  <button
                    onClick={() => fetchActivityResult(selectedResultActivityId)}
                    disabled={loadingResults}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-colors shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingResults ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>
            )}

            {/* Results Details */}
            {(() => {
              const currentAct = activities.find((a: any) => (a.id || a._id) === selectedResultActivityId) || activeActivity;
              if (!currentAct) {
                return (
                  <div className="bg-[#121722] border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
                    No activities available to display results. Create an activity first.
                  </div>
                );
              }

              const isCurrentLive = (currentAct.id || (currentAct as any)._id) === activeActId;

              return (
                <div className="bg-[#121722] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            currentAct.type === "poll"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : currentAct.type === "word_cloud"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          }`}
                        >
                          {currentAct.type.replace("_", " ")} Results
                        </span>
                        {isCurrentLive && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            LIVE ON STAGE
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-white mt-1.5 tracking-tight">{currentAct.title}</h3>
                    </div>

                    {isCurrentLive ? (
                      <button
                        onClick={() => handleStop(currentAct.id || (currentAct as any)._id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30 self-start sm:self-auto transition-all active:scale-95 shadow-sm"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Live Activity</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLaunch(currentAct.id || (currentAct as any)._id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-950/30 active:scale-95 self-start sm:self-auto transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch to Stage</span>
                      </button>
                    )}
                  </div>

                  {/* Poll Visualizer & Breakdown Table */}
                  {currentAct.type === "poll" && (
                    <div className="space-y-6">
                      <PollVisualizer
                        question={currentAct.title}
                        options={isCurrentLive ? pollResults.options : (activityResultsData?.options || currentAct.options || [])}
                        totalVotes={isCurrentLive ? pollResults.total : (activityResultsData?.total || 0)}
                      />

                      {/* Vote Breakdown Table */}
                      <div className="bg-[#090d14] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                          Option Vote Breakdown
                        </h4>
                        <div className="space-y-2">
                          {(isCurrentLive ? pollResults.options : (activityResultsData?.options || currentAct.options || [])).map((opt: any, idx: number) => {
                            const total = isCurrentLive ? pollResults.total : (activityResultsData?.total || 0);
                            const votes = opt.votes || opt.vote_count || 0;
                            const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                            return (
                              <div key={idx} className="flex items-center justify-between bg-[#121722] p-3 rounded-xl border border-slate-800/80">
                                <div className="flex items-center gap-3 flex-1 mr-4">
                                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="text-sm font-medium text-slate-200">{opt.text || opt.option_text}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="font-mono text-slate-400 tabular-nums">{votes} votes</span>
                                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 min-w-[48px] text-right tabular-nums">
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Word Cloud Visualizer & Breakdown */}
                  {currentAct.type === "word_cloud" && (
                    <div className="space-y-6">
                      <WordCloudVisualizer
                        question={currentAct.title}
                        words={isCurrentLive ? wordCloudWords : (activityResultsData?.words || [])}
                      />

                      {/* Word Cloud Frequency Table */}
                      <div className="bg-[#090d14] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                          Top Submitted Words
                        </h4>
                        {(isCurrentLive ? wordCloudWords : (activityResultsData?.words || [])).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {(isCurrentLive ? wordCloudWords : (activityResultsData?.words || [])).map((w: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between bg-[#121722] p-3 rounded-xl border border-slate-800/80">
                                <span className="text-sm font-bold text-cyan-300">"{w.text || w.word}"</span>
                                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 tabular-nums">
                                  {w.value || w.count} entries
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 py-4 text-center">No word responses recorded yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quiz Arena & Leaderboard */}
                  {currentAct.type === "quiz" && (
                    <div className="space-y-6">
                      {isCurrentLive && currentAct.questions && (
                        <QuizArena
                          question={currentAct.questions[currentAct.activeQuestionIndex || 0]}
                          questionIndex={currentAct.activeQuestionIndex || 0}
                          totalQuestions={currentAct.questions.length}
                          leaderboard={quizLeaderboard}
                          isAdmin={true}
                          onAdvance={async () => {
                            const nextIdx = (currentAct.activeQuestionIndex || 0) + 1;
                            await api.post(`/quizzes/${currentAct.id || (currentAct as any)._id}/advance`, {
                              questionIndex: nextIdx,
                            });
                            loadEventData();
                          }}
                          onFinish={async () => {
                            await api.post(`/quizzes/${currentAct.id || (currentAct as any)._id}/finish`, {});
                            loadEventData();
                          }}
                        />
                      )}

                      {/* Standalone Quiz Leaderboard Table */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>Quiz Leaderboard Rankings</span>
                        </h4>
                        <QuizLeaderboard
                          leaderboard={isCurrentLive ? quizLeaderboard : (activityResultsData?.leaderboard || [])}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
                  onClick={() => setShowDeleteEventModal(true)}
                  className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold border border-red-500/30 transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DELETE EVENT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#121722] border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Delete Entire Event?</h3>
                  <p className="text-xs text-rose-400/80 font-mono">Permanent action • Cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-white">"{event.title}"</strong>? This will purge all associated activities, participant records, and voting results.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteEventModal(false)}
                  disabled={deletingEvent}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteEvent}
                  disabled={deletingEvent}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingEvent ? "Deleting..." : "Delete Event Permanently"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE ACTIVITY MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-xl bg-[#121722] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl my-8 overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Create New Activity</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose the activity format and configure questions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Activity Type Segment Buttons */}
              <div className="grid grid-cols-3 gap-2.5 mb-6 p-1 bg-[#090d14] rounded-2xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActivityType("poll")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    activityType === "poll"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📊 Live Poll
                </button>
                <button
                  type="button"
                  onClick={() => setActivityType("word_cloud")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    activityType === "word_cloud"
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-sm"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ☁ Word Cloud
                </button>
                <button
                  type="button"
                  onClick={() => setActivityType("quiz")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    activityType === "quiz"
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-sm"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🏆 Trivia Quiz
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Question / Title <span className="text-emerald-400">*</span>
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
                    className="w-full bg-[#090d14] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                  />
                </div>

                {/* Activity Duration Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Activity Duration</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {isCustomDuration
                        ? `${Math.max(5, Number(customDurationVal) || 30)}s`
                        : formatDurationBadge(activityDuration)}
                    </span>
                  </label>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2">
                    {[15, 30, 45, 60, 90, 120].map((presetSec) => (
                      <button
                        key={presetSec}
                        type="button"
                        onClick={() => {
                          setIsCustomDuration(false);
                          setActivityDuration(presetSec);
                        }}
                        className={`py-1.5 px-1.5 rounded-xl text-xs font-mono font-bold transition-all border text-center ${
                          !isCustomDuration && activityDuration === presetSec
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm"
                            : "bg-[#090d14] border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {presetSec < 60 ? `${presetSec}s` : `${presetSec / 60}m`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCustomDuration(true)}
                      className={`py-1.5 px-1.5 rounded-xl text-xs font-bold transition-all border text-center ${
                        isCustomDuration
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm"
                          : "bg-[#090d14] border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {isCustomDuration && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min={5}
                        max={3600}
                        value={customDurationVal}
                        onChange={(e) => setCustomDurationVal(e.target.value)}
                        placeholder="Seconds (e.g. 75)"
                        className="flex-1 bg-[#090d14] border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs text-slate-400 font-mono">seconds</span>
                    </div>
                  )}
                </div>

                {activityType === "poll" && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Poll Choices
                    </label>
                    {pollOptionsInput.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#090d14] border border-slate-700 text-slate-400 text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const copy = [...pollOptionsInput];
                            copy[idx] = e.target.value;
                            setPollOptionsInput(copy);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 bg-[#090d14] border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        {pollOptionsInput.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = pollOptionsInput.filter((_, i) => i !== idx);
                              setPollOptionsInput(copy);
                            }}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Remove choice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPollOptionsInput([...pollOptionsInput, ""])}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add another choice</span>
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
                      className="w-full bg-[#090d14] border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />

                    <div className="grid grid-cols-2 gap-2.5">
                      {quizQuestions[0].options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                            opt.is_correct
                              ? "border-emerald-500/60 bg-emerald-950/20"
                              : "border-slate-800 bg-[#090d14]"
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
                            className="text-emerald-500 focus:ring-emerald-500 cursor-pointer"
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

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
                  >
                    Create Activity
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STOP EVENT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showStopModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#121722] border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">End This Event?</h3>
                  <p className="text-xs text-slate-400">This will stop all activities and close voting.</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to end <strong className="text-white">"{event.title}"</strong>? All connected participants and presentation screens will transition to the Event Ended screen.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStopModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStopEvent}
                  disabled={stoppingEvent}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-colors active:scale-95 disabled:opacity-50"
                >
                  {stoppingEvent ? "Ending..." : "End Event Now"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

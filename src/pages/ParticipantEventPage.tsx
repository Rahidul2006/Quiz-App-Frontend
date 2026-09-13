import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  QrCode,
  Users,
  Check,
  Clock,
  Pause,
  Sparkles,
  X,
  Radio,
  Trophy,
} from "lucide-react";
import { api } from "../services/api";
import { getSocket, joinEventRoom, leaveEventRoom } from "../services/socket";
import {
  Activity,
  EventItem,
  Participant,
  PollOption,
  LeaderboardEntry,
  WordFrequency,
} from "../types";
import { QrModal } from "../components/qr/QrModal";
import { QuizLeaderboard } from "../components/activities/QuizLeaderboard";
import { ParticipantNameCloud } from "../components/waiting/ParticipantNameCloud";

export const ParticipantEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Authoritative activity timer ticker (1-second tick)
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // QR Modal (Requirement: Top right QR button)
  const [showQrModal, setShowQrModal] = useState(false);

  // Poll state
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [pollResults, setPollResults] = useState<{ options: PollOption[]; total: number }>({
    options: [],
    total: 0,
  });

  // Dynamically ranked poll options with stable tie-breaking
  const displayPollOptions = useMemo(() => {
    if (!activeActivity || activeActivity.type !== "poll") return [];
    const baseOptions =
      pollResults.options && pollResults.options.length > 0
        ? pollResults.options
        : activeActivity.options || [];

    return [...baseOptions].sort((a, b) => {
      const aVotes = a.votes || 0;
      const bVotes = b.votes || 0;
      if (bVotes !== aVotes) {
        return bVotes - aVotes;
      }
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });
  }, [activeActivity, pollResults.options]);

  // Word cloud state
  const [showWordInputModal, setShowWordInputModal] = useState(false);
  const [wordInput, setWordInput] = useState("");
  const [submittingWord, setSubmittingWord] = useState(false);
  const [wordCloudList, setWordCloudList] = useState<WordFrequency[]>([]);

  // Quiz state
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [hasSubmittedQuiz, setHasSubmittedQuiz] = useState(false);
  const [quizTimer, setQuizTimer] = useState(15);
  const [quizLeaderboard, setQuizLeaderboard] = useState<LeaderboardEntry[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());

  const loadData = async () => {
    if (!eventId) return;
    try {
      const ev = await api.get(`/events/${eventId}`);
      setEvent(ev);
      setParticipantCount(ev.participant_count || 0);

      const parts = await api.get(`/events/${eventId}/participants`).catch(() => []);
      setParticipants(parts);

      // Participant session
      const stored = localStorage.getItem(`crowdpulse_participant_${eventId}`);
      let currentPart: Participant | null = stored ? JSON.parse(stored) : null;
      if (!currentPart) {
        const guestData = await api.post(`/events/${eventId}/join`, {
          name: "Guest " + Math.floor(Math.random() * 1000),
        });
        currentPart = guestData.participant;
        localStorage.setItem(`crowdpulse_participant_${eventId}`, JSON.stringify(currentPart));
      }
      setParticipant(currentPart);

      const activeActId = ev.activeActivityId || ev.active_activity_id;
      if (activeActId) {
        const act = await api.get(`/activities/${activeActId}`);
        setActiveActivity(act);

        if (act.type === "poll" || act.type === "word_cloud") {
          const res = await api.get(`/activities/${activeActId}/results`);
          if (act.type === "poll") {
            setPollResults({ options: res.options || [], total: res.total || 0 });

            // Restore voted status from persistent database and local cache
            const pId = currentPart?.id || (currentPart as any)?._id;
            if (pId) {
              const cachedVote = localStorage.getItem(`crowdpulse_poll_voted_${activeActId}_${pId}`);
              if (cachedVote) {
                setHasVotedPoll(true);
                setSelectedPollOption(cachedVote);
              }
              try {
                const voteCheck = await api.get(`/activities/${activeActId}/participant-response?participantId=${pId}`);
                if (voteCheck.hasVoted) {
                  setHasVotedPoll(true);
                  if (voteCheck.optionId) {
                    setSelectedPollOption(voteCheck.optionId);
                    localStorage.setItem(`crowdpulse_poll_voted_${activeActId}_${pId}`, voteCheck.optionId);
                  }
                }
              } catch (err) {
                // Ignore query failure
              }
            }
          } else {
            setWordCloudList(res.words || []);
          }
        } else if (act.type === "quiz") {
          const lb = await api.get(`/quizzes/${activeActId}/leaderboard`);
          setQuizLeaderboard(lb);
        }
      } else {
        setActiveActivity(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (eventId) {
      joinEventRoom(eventId);
      const socket = getSocket();

      socket.on("participant:joined", (data) => {
        if (data && data.participant) {
          setParticipants((prev) => {
            if (prev.some((p) => (p.id || p._id) === (data.participant.id || data.participant._id))) {
              return prev;
            }
            return [data.participant, ...prev];
          });
        }
        setParticipantCount((prev) => (data?.count ? data.count : prev + 1));
      });

      socket.on("participants:updated", (data) => {
        if (data && typeof data.count === "number") {
          setParticipantCount(data.count);
        }
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
        loadData();
      });

      socket.on("event:paused", () => {
        setEvent((prev) => (prev ? { ...prev, status: "PAUSED" } : null));
        loadData();
      });

      socket.on("event:resumed", () => {
        setEvent((prev) => (prev ? { ...prev, status: "LIVE" } : null));
        loadData();
      });

      socket.on("event:ended", (data) => {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                status: "ENDED",
                stoppedAt: data.stoppedAt,
                activeActivityId: null,
                active_activity_id: null,
              }
            : null
        );
        setActiveActivity(null);
      });

      socket.on("activity:started", (data) => {
        setActiveActivity({ ...data.activity, status: "LIVE" });
        const pId = participant?.id || (participant as any)?._id;
        const newActId = data.activity.id || data.activity._id;
        const cachedVote = pId ? localStorage.getItem(`crowdpulse_poll_voted_${newActId}_${pId}`) : null;
        if (cachedVote) {
          setHasVotedPoll(true);
          setSelectedPollOption(cachedVote);
        } else {
          setHasVotedPoll(false);
          setSelectedPollOption(null);
        }
        setHasSubmittedQuiz(false);
        setSelectedQuizOption(null);
        loadData();
      });

      socket.on("activity:paused", (data) => {
        setActiveActivity((prev) =>
          prev
            ? {
                ...prev,
                status: "PAUSED",
                remainingSeconds: data?.remainingSeconds,
                endsAt: null,
              }
            : null
        );
      });

      socket.on("activity:resumed", (data) => {
        setActiveActivity({ ...data.activity, status: "LIVE" });
      });

      socket.on("activity:restarted", (data) => {
        const act = data.activity;
        const pId = participant?.id || (participant as any)?._id;
        const actId = act.id || act._id;
        if (pId) {
          localStorage.removeItem(`crowdpulse_poll_voted_${actId}_${pId}`);
        }
        setHasVotedPoll(false);
        setSelectedPollOption(null);
        setHasSubmittedQuiz(false);
        setSelectedQuizOption(null);
        setWordCloudList([]);
        setPollResults({ options: [], total: 0 });
        setActiveActivity({ ...act, status: "LIVE" });
        loadData();
      });

      socket.on("activity:closed", () => {
        setActiveActivity(null);
        setEvent((prev) =>
          prev ? { ...prev, activeActivityId: null, active_activity_id: null } : null
        );
      });

      socket.on("poll:results_updated", (data) => {
        setPollResults({ options: data.options, total: data.total });
      });

      socket.on("wordcloud:updated", (data) => {
        setWordCloudList(data.words);
      });

      socket.on("quiz:question_changed", (data) => {
        setHasSubmittedQuiz(false);
        setSelectedQuizOption(null);
        setActiveActivity((prev) =>
          prev ? { ...prev, activeQuestionIndex: data.questionIndex } : null
        );
        loadData();
      });

      socket.on("quiz:leaderboard_updated", (data) => {
        setQuizLeaderboard(data.leaderboard);
      });

      socket.on("quiz:finished", (data) => {
        setQuizLeaderboard(data.leaderboard);
        setActiveActivity((prev) =>
          prev ? { ...prev, settings: { ...prev.settings, quiz_state: "leaderboard" } } : null
        );
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
        socket.off("quiz:question_changed");
        socket.off("quiz:leaderboard_updated");
        socket.off("quiz:finished");
      };
    }
  }, [eventId]);

  const getActivityRemainingSeconds = () => {
    if (!activeActivity) return null;
    if (activeActivity.status === "PAUSED" || activeActivity.status === "paused") {
      return typeof activeActivity.remainingSeconds === "number"
        ? activeActivity.remainingSeconds
        : typeof (activeActivity as any).remaining_seconds === "number"
        ? (activeActivity as any).remaining_seconds
        : activeActivity.duration || 30;
    }
    const endsAtValue = activeActivity.endsAt || (activeActivity as any).ends_at;
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

  // Quiz Countdown Timer
  useEffect(() => {
    if (activeActivity?.type === "quiz" && activeActivity.questions) {
      const qIndex = activeActivity.activeQuestionIndex || 0;
      const currentQ = activeActivity.questions[qIndex];
      if (currentQ) {
        setQuizTimer(currentQ.time_limit_sec || 15);
        questionStartTimeRef.current = Date.now();

        const timer = setInterval(() => {
          setQuizTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [activeActivity?.id, activeActivity?.activeQuestionIndex]);

  // Submit Poll
  const handleVotePoll = async () => {
    if (!selectedPollOption || !activeActivity || !participant) return;
    try {
      const actId = activeActivity.id || activeActivity._id;
      const pId = participant.id || participant._id;
      const res = await api.post(`/activities/${actId}/respond`, {
        optionId: selectedPollOption,
        participantId: pId,
        participantName: participant.name,
      });
      setHasVotedPoll(true);
      if (pId) {
        localStorage.setItem(`crowdpulse_poll_voted_${actId}_${pId}`, selectedPollOption);
      }
      setPollResults({ options: res.options, total: res.total });
    } catch (e) {
      console.error("Vote failed", e);
    }
  };

  // Submit Word
  const handleSubmitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || !activeActivity || !participant) return;
    setSubmittingWord(true);
    try {
      const actId = activeActivity.id || activeActivity._id;
      const res = await api.post(`/activities/${actId}/respond`, {
        word: wordInput.trim(),
        participantId: participant.id || participant._id,
      });
      setWordInput("");
      setShowWordInputModal(false);
      setWordCloudList(res.words);
    } catch (e) {
      console.error("Word cloud response error", e);
    } finally {
      setSubmittingWord(false);
    }
  };

  // Submit Quiz Answer
  const handleAnswerQuiz = async () => {
    if (!selectedQuizOption || !activeActivity || !participant || !activeActivity.questions) return;
    const qIndex = activeActivity.activeQuestionIndex || 0;
    const currentQ = activeActivity.questions[qIndex];
    if (!currentQ) return;

    const timeTaken = Date.now() - questionStartTimeRef.current;
    try {
      const actId = activeActivity.id || activeActivity._id;
      await api.post(`/quizzes/${actId}/answer`, {
        questionId: currentQ.id || (currentQ as any)._id,
        optionId: selectedQuizOption,
        participantId: participant.id || participant._id,
        participantName: participant.name,
        timeTakenMs: timeTaken,
      });
      setHasSubmittedQuiz(true);
    } catch (e) {
      console.error("Quiz answer submission failed", e);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Connecting to interactive session...</p>
        </div>
      </div>
    );
  }

  const joinCode = event.joinCode || event.join_code || "";
  const partId = participant?.id || participant?._id;
  const myLeaderboardEntry = quizLeaderboard.find((e) => e.participant_id === partId);

  const isWaiting = event.status === "WAITING" || event.status === "waiting" || event.status === "draft";
  const isLive = event.status === "LIVE" || event.status === "live" || event.status === "active";
  const isPaused = event.status === "PAUSED" || event.status === "paused";
  const isEnded = event.status === "ENDED" || event.status === "ended";

  const isActPaused = activeActivity?.status === "PAUSED" || activeActivity?.status === "paused";
  const actRemaining = (isLive || isActPaused) && activeActivity ? getActivityRemainingSeconds() : null;
  const actTotalDur = activeActivity?.duration || 30;
  const actProgressPct = actRemaining !== null ? Math.max(0, Math.min(100, (actRemaining / actTotalDur) * 100)) : 0;
  const actIsUrgent = !isActPaused && actRemaining !== null && actRemaining <= 10 && actRemaining > 0;

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-800/60 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Mobile Top Bar with Required QR Icon in Top-Right */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-white truncate tracking-tight">
              {event.title}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span className="font-bold text-slate-300">#{joinCode}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Users className="w-2.5 h-2.5" />
                <span className="tabular-nums font-bold">{participantCount}</span>
              </span>
              {isWaiting && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">WAITING</span>
                </>
              )}
              {isLive && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE
                  </span>
                </>
              )}
              {isPaused && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Pause className="w-2.5 h-2.5 text-amber-400" />
                    PAUSED
                  </span>
                </>
              )}
              {isEnded && (
                <>
                  <span>•</span>
                  <span className="text-rose-400 font-bold">ENDED</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* QR Button in Top Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all active:scale-95 shadow-sm"
            title="Event QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm"
            title={participant?.name}
          >
            {participant?.name ? participant.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-20 flex flex-col justify-center">
        {/* CASE 1: WAITING ROOM */}
        {isWaiting && (
          <div className="space-y-6 my-auto animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  WAITING FOR HOST
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {event.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
                  The event will begin when the host starts it.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <div className="px-3 py-1.5 bg-[#121722] border border-slate-800 rounded-xl text-xs text-slate-300 font-medium shadow-inner">
                  Participants: <span className="font-bold text-cyan-400 font-mono tabular-nums">{participantCount}</span>
                </div>
                <div className="px-3 py-1.5 bg-[#121722] border border-slate-800 rounded-xl text-xs text-slate-300 font-mono shadow-inner">
                  Join Code: <span className="font-bold text-emerald-400">#{joinCode}</span>
                </div>
              </div>

              <div className="p-2 bg-[#121722] border border-slate-800 rounded-2xl inline-flex items-center gap-2 text-xs text-slate-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>You joined as <strong className="text-white">{participant?.name}</strong></span>
              </div>
            </div>

            {/* Live Participant Name Cloud */}
            <div className="space-y-2">
              <ParticipantNameCloud
                participants={participants}
                currentParticipantName={participant?.name}
                variant="participant"
                emptyMessage="You are the first attendee in the waiting room!"
              />
            </div>
          </div>
        )}

        {/* CASE 2: EVENT PAUSED */}
        {isPaused && (
          <div className="text-center space-y-5 my-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <Pause className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                ⏸ Event Paused
              </span>
              <h2 className="text-2xl font-black text-white">
                Session Is On Hold
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
                The host has temporarily paused the event. Please keep this screen open — the session will resume shortly!
              </p>
            </div>
          </div>
        )}

        {/* CASE 3: EVENT ENDED */}
        {isEnded && (
          <div className="text-center space-y-5 my-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-xl">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-950/40 px-3 py-1 rounded-full border border-red-500/30">
                🔴 Event Ended
              </span>
              <h2 className="text-2xl font-black text-white">
                Thank You for Participating!
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                This event has concluded. All activity responses and submissions are closed.
              </p>
            </div>

            {myLeaderboardEntry && (
              <div className="p-4 bg-[#161b26] border border-slate-800 rounded-2xl max-w-xs mx-auto text-center space-y-1">
                <p className="text-xs text-slate-400">Your Final Rank</p>
                <p className="text-xl font-black text-amber-400">#{myLeaderboardEntry.rank} Place</p>
                <p className="text-xs font-mono text-slate-300">{myLeaderboardEntry.total_score} points</p>
              </div>
            )}
          </div>
        )}

        {/* CASE 4: LIVE EVENT — WAITING FOR FIRST/NEXT ACTIVITY */}
        {isLive && !activeActivity && (
          <div className="text-center space-y-5 my-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400">Event is LIVE!</span>
              <h2 className="text-2xl font-black text-white">
                Waiting for the next activity...
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
                The host will launch a poll, word cloud, or quiz question shortly. Keep your screen open!
              </p>
            </div>
          </div>
        )}

        {/* CASE 5: LIVE POLL */}
        {isLive && activeActivity && activeActivity.type === "poll" && (
          <div className="space-y-5 my-auto animate-in fade-in duration-300">
            {/* Prominent Activity Authoritative Timer Banner */}
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isActPaused ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <Pause className="w-2.5 h-2.5 text-amber-400" />
                      PAUSED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-300">
                    Live Poll
                  </span>
                </div>

                {actRemaining !== null && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs transition-all ${
                      isActPaused
                        ? "bg-amber-950/50 border-amber-500/40 text-amber-300"
                        : actIsUrgent
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-sm shadow-rose-950/40"
                        : "bg-[#090d14] border-slate-700/80 text-emerald-300"
                    }`}
                  >
                    {isActPaused ? (
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Clock className={`w-3.5 h-3.5 ${actIsUrgent ? "text-rose-400" : "text-emerald-400"}`} />
                    )}
                    <span className="tabular-nums">{formatSeconds(actRemaining)}</span>
                  </div>
                )}
              </div>

              {actRemaining !== null && (
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                      isActPaused
                        ? "bg-amber-500"
                        : actIsUrgent
                        ? "bg-rose-500"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${actProgressPct}%` }}
                  />
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-white tracking-tight pt-1">
                {activeActivity.title}
              </h2>
            </div>

            {/* Options list with live layout reordering */}
            <div className="space-y-2.5 pt-2 relative">
              {displayPollOptions.map((option, idx) => {
                const optId = option.id || option._id || "";
                const isSelected = selectedPollOption === optId;
                const votes = option.votes || 0;
                const total = pollResults.total || 0;
                const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
                const isLeader = votes > 0 && idx === 0;
                const letterIdx = typeof option.order_index === "number" ? option.order_index : idx;
                const optKey = optId || `poll-opt-${option.text}-${letterIdx}`;

                return (
                  <motion.button
                    layout
                    key={optKey}
                    layoutId={optKey}
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 28,
                      mass: 0.8,
                    }}
                    disabled={hasVotedPoll || isActPaused}
                    onClick={() => setSelectedPollOption(optId)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/30"
                        : "bg-[#121722] border-slate-800/90 text-slate-200 hover:border-slate-700/80"
                    } ${hasVotedPoll || isActPaused ? "cursor-default" : "active:scale-[0.99]"}`}
                  >
                    {/* Live progress background if participant has voted */}
                    {hasVotedPoll && (
                      <div
                        className={`absolute top-0 bottom-0 left-0 transition-[width] duration-500 ease-out rounded-r-xl ${
                          isSelected
                            ? "bg-emerald-500/25 border-r-2 border-emerald-400"
                            : isLeader
                            ? "bg-cyan-500/15"
                            : "bg-slate-700/20"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black"
                            : isLeader
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold"
                            : "bg-slate-800 text-slate-300 border-slate-700 font-mono"
                        }`}
                      >
                        {isLeader && votes > 0 ? (
                          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          String.fromCharCode(65 + (letterIdx % 26))
                        )}
                      </span>
                      <span className="text-sm font-semibold truncate">{option.text}</span>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
                      {hasVotedPoll && (
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-400 text-[11px] tabular-nums">{votes}v</span>
                          <span className="font-bold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                            {percentage}%
                          </span>
                        </div>
                      )}

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Action button */}
            {!hasVotedPoll ? (
              <button
                onClick={handleVotePoll}
                disabled={!selectedPollOption || isActPaused}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-950/40 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isActPaused ? "Activity is Paused" : "Submit Response"}
              </button>
            ) : (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Response submitted ✓</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Live ranking updates dynamically as votes come in!
                </p>
              </div>
            )}
          </div>
        )}

        {/* CASE 6: WORD CLOUD */}
        {activeActivity && activeActivity.type === "word_cloud" && (
          <div className="space-y-5 my-auto animate-in fade-in duration-300">
            {/* Prominent Activity Authoritative Timer Banner */}
            <div className="bg-[#121722] border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isActPaused ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <Pause className="w-2.5 h-2.5 text-amber-400" />
                      PAUSED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      LIVE
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-300">
                    Word Cloud
                  </span>
                </div>

                {actRemaining !== null && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs transition-all ${
                      isActPaused
                        ? "bg-amber-950/50 border-amber-500/40 text-amber-300"
                        : actIsUrgent
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-sm shadow-rose-950/40"
                        : "bg-[#090d14] border-slate-700/80 text-cyan-300"
                    }`}
                  >
                    {isActPaused ? (
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Clock className={`w-3.5 h-3.5 ${actIsUrgent ? "text-rose-400" : "text-cyan-400"}`} />
                    )}
                    <span className="tabular-nums">{formatSeconds(actRemaining)}</span>
                  </div>
                )}
              </div>

              {actRemaining !== null && (
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                      isActPaused
                        ? "bg-amber-500"
                        : actIsUrgent
                        ? "bg-rose-500"
                        : "bg-cyan-400"
                    }`}
                    style={{ width: `${actProgressPct}%` }}
                  />
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-white tracking-tight pt-1">
                {activeActivity.title}
              </h2>
            </div>

            <div className="bg-[#121620] border border-slate-800/80 rounded-3xl p-5 min-h-[260px] flex flex-wrap items-center justify-center gap-2 shadow-inner">
              {wordCloudList.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700/60 text-slate-200 shadow-sm"
                >
                  {item.text}
                </span>
              ))}

              {wordCloudList.length === 0 && (
                <p className="text-xs text-slate-500">No words submitted yet.</p>
              )}
            </div>

            <button
              onClick={() => setShowWordInputModal(true)}
              disabled={isActPaused}
              className="w-full py-3.5 rounded-2xl bg-[#121722] hover:bg-[#182030] text-white font-bold text-sm border border-slate-700/80 shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isActPaused ? "Activity is Paused" : "Add response"}
            </button>
          </div>
        )}

        {/* CASE 4: LIVE QUIZ */}
        {activeActivity && activeActivity.type === "quiz" && activeActivity.questions && (
          <div className="space-y-5 my-auto animate-in fade-in duration-300">
            {activeActivity.settings?.quiz_state === "leaderboard" ? (
              <QuizLeaderboard
                leaderboard={quizLeaderboard}
                isFinal={true}
                userRank={myLeaderboardEntry?.rank}
                userScore={myLeaderboardEntry?.total_score || 0}
                userCorrect={myLeaderboardEntry?.correct_answers || 0}
                totalQuestions={activeActivity.questions.length}
                userTimeMs={myLeaderboardEntry?.total_time_ms || 0}
              />
            ) : (
              (() => {
                const qIdx = activeActivity.activeQuestionIndex || 0;
                const currentQ = activeActivity.questions[qIdx];
                if (!currentQ) return null;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-full">
                        Question {qIdx + 1} / {activeActivity.questions.length}
                      </span>

                      <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1 rounded-full border ${
                        isActPaused
                          ? "bg-amber-950/50 border-amber-500/40 text-amber-300"
                          : actIsUrgent || quizTimer <= 5
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                          : "bg-slate-800/80 text-slate-200 border-slate-700/60"
                      }`}>
                        {isActPaused ? (
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Clock className={`w-3.5 h-3.5 ${actIsUrgent || quizTimer <= 5 ? "text-rose-400" : "text-cyan-400"}`} />
                        )}
                        <span className="tabular-nums">
                          {actRemaining !== null ? formatSeconds(actRemaining) : `00:${quizTimer.toString().padStart(2, "0")}`}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#121722] border border-slate-800/90 rounded-2xl p-5 text-center shadow-lg">
                      <h3 className="text-base font-bold text-white leading-snug">
                        {currentQ.question_text}
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {(currentQ.options || []).map((opt, idx) => {
                        const optId = opt.id || opt._id || "";
                        const isSelected = selectedQuizOption === optId;
                        return (
                          <button
                            key={optId || idx}
                            disabled={hasSubmittedQuiz || quizTimer === 0 || isActPaused}
                            onClick={() => setSelectedQuizOption(optId)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-lg shadow-purple-950/30"
                                : "bg-[#121722] border-slate-800/90 text-slate-200 hover:border-slate-700/80"
                            } ${(hasSubmittedQuiz || quizTimer === 0 || isActPaused) ? "opacity-80" : "active:scale-[0.99]"}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center border border-slate-700">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="text-sm font-semibold">{opt.option_text}</span>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!hasSubmittedQuiz ? (
                      <button
                        onClick={handleAnswerQuiz}
                        disabled={!selectedQuizOption || quizTimer === 0 || isActPaused}
                        className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-950/40 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isActPaused ? "Quiz is Paused" : "Submit Answer"}
                      </button>
                    ) : (
                      <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-center space-y-0.5">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-300">
                          <Check className="w-4 h-4" />
                          <span>Answer locked in!</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Waiting for presenter to advance question...
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}
      </main>

      {/* Word Cloud Input Modal */}
      <AnimatePresence>
        {showWordInputModal && (
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
              className="w-full max-w-sm bg-[#121722] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white tracking-tight">Add your response</h4>
                <button
                  onClick={() => setShowWordInputModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitWord} className="space-y-4">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={40}
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type word or short phrase..."
                  className="w-full bg-[#090d14] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner transition-colors"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWordInputModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors border border-slate-700/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWord}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 disabled:opacity-50 transition-all active:scale-95"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Bar */}
      <footer className="border-t border-slate-800/60 bg-[#0c1017] px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>quzantagonic Live</span>
        <span>Connected as {participant?.name}</span>
      </footer>

      {/* Dedicated QR Modal */}
      <QrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        joinCode={joinCode}
        eventName={event.title}
      />
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, Zap, Maximize2, Minimize2, Radio, ArrowLeft, Clock, Award, CheckCircle2, Pause } from "lucide-react";
import { api } from "../services/api";
import { getSocket, joinEventRoom, leaveEventRoom } from "../services/socket";
import { Activity, EventItem, PollOption, Participant } from "../types";
import { QrCard } from "../components/qr/QrCard";
import { PollVisualizer } from "../components/activities/PollVisualizer";
import { WordCloudVisualizer } from "../components/activities/WordCloudVisualizer";
import { QuizArena } from "../components/activities/QuizArena";
import { QuizLeaderboard } from "../components/activities/QuizLeaderboard";
import { ParticipantNameCloud } from "../components/waiting/ParticipantNameCloud";

export const PresentationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Authoritative 1-second ticker for live activity countdown
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // Poll state
  const [pollResults, setPollResults] = useState<{ options: PollOption[]; total: number }>({
    options: [],
    total: 0,
  });

  // Word cloud state
  const [wordCloudWords, setWordCloudWords] = useState<any[]>([]);

  // Quiz state
  const [quizLeaderboard, setQuizLeaderboard] = useState<any[]>([]);

  const loadData = async () => {
    if (!eventId) return;
    try {
      const ev = await api.get(`/events/${eventId}`);
      setEvent(ev);
      setParticipantCount(ev.participant_count || 0);

      // Load participant list for the cloud
      try {
        const pList = await api.get(`/events/${eventId}/participants`);
        if (Array.isArray(pList)) {
          setParticipants(pList);
          if (pList.length > (ev.participant_count || 0)) {
            setParticipantCount(pList.length);
          }
        }
      } catch (err) {
        console.warn("Failed to load participants list:", err);
      }

      const activeActId = ev.activeActivityId || ev.active_activity_id;
      if (activeActId) {
        const act = await api.get(`/activities/${activeActId}`);
        setActiveActivity(act);

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
      } else {
        setActiveActivity(null);
      }
    } catch (e) {
      console.error("Presentation load error:", e);
    }
  };

  useEffect(() => {
    loadData();

    if (eventId) {
      joinEventRoom(eventId);
      const socket = getSocket();

      // Lifecycle handlers
      socket.on("event:started", (data) => {
        setEvent((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: "LIVE",
            startedAt: data.startedAt || new Date().toISOString(),
            endsAt: null,
          };
        });
      });

      socket.on("event:ended", () => {
        setEvent((prev) => (prev ? { ...prev, status: "ENDED", activeActivityId: null } : null));
        setActiveActivity(null);
      });

      socket.on("event:paused", () => {
        setEvent((prev) => (prev ? { ...prev, status: "PAUSED" } : null));
        setActiveActivity((prev) => (prev ? { ...prev, status: "PAUSED" } : null));
      });

      socket.on("event:resumed", (data: any) => {
        setEvent((prev) => (prev ? { ...prev, status: "LIVE" } : null));
        if (data?.activity) {
          setActiveActivity(data.activity);
        }
        loadData();
      });

      socket.on("participant:joined", (data: any) => {
        if (typeof data?.count === "number") {
          setParticipantCount(data.count);
        } else {
          setParticipantCount((prev) => prev + 1);
        }
        if (data?.participant) {
          setParticipants((prev) => {
            const exists = prev.some(
              (p) =>
                (p.id && data.participant.id && p.id === data.participant.id) ||
                p.name?.toLowerCase() === data.participant.name?.toLowerCase()
            );
            if (!exists) {
              return [...prev, data.participant];
            }
            return prev;
          });
        }
      });

      socket.on("participants:updated", (data) => {
        if (data && typeof data.count === "number") {
          setParticipantCount(data.count);
        }
      });

      socket.on("activity:started", (data) => {
        setActiveActivity(data.activity);
        loadData();
      });

      socket.on("activity:paused", (data: any) => {
        if (data?.activity) {
          setActiveActivity(data.activity);
        } else {
          setActiveActivity((prev) =>
            prev
              ? {
                  ...prev,
                  status: "PAUSED",
                  remainingSeconds: data?.remainingSeconds ?? prev.remainingSeconds,
                }
              : null
          );
        }
      });

      socket.on("activity:resumed", (data: any) => {
        if (data?.activity) {
          setActiveActivity(data.activity);
        } else {
          setActiveActivity((prev) =>
            prev ? { ...prev, status: "LIVE", endsAt: data?.endsAt } : null
          );
        }
      });

      socket.on("activity:restarted", (data: any) => {
        if (data?.activity) {
          setActiveActivity(data.activity);
        }
        loadData();
      });

      socket.on("activity:closed", () => {
        setActiveActivity(null);
      });

      socket.on("poll:results_updated", (data) => {
        setPollResults({ options: data.options, total: data.total });
      });

      socket.on("wordcloud:updated", (data) => {
        setWordCloudWords(data.words);
      });

      socket.on("quiz:question_changed", () => {
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
        socket.off("event:started");
        socket.off("event:ended");
        socket.off("event:paused");
        socket.off("event:resumed");
        socket.off("participant:joined");
        socket.off("participants:updated");
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const getActivityRemainingSeconds = () => {
    if (!activeActivity) return null;
    if (activeActivity.status === "PAUSED" || activeActivity.status === "paused") {
      return typeof activeActivity.remainingSeconds === "number" ? activeActivity.remainingSeconds : 0;
    }
    const endsAtValue = activeActivity.endsAt || (activeActivity as any).ends_at;
    if (!endsAtValue) return null;
    return Math.max(0, Math.ceil((new Date(endsAtValue).getTime() - nowTimestamp) / 1000));
  };

  const formatSeconds = (totalSeconds: number | null) => {
    if (totalSeconds === null || isNaN(totalSeconds)) return "00:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400 font-mono">
        Connecting to Presentation Stage...
      </div>
    );
  }

  const joinCode = event.joinCode || event.join_code || "";
  const isWaiting = event.status === "WAITING" || event.status === "draft";
  const isEnded = event.status === "ENDED" || event.status === "ended";
  const isPaused = event.status === "PAUSED" || event.status === "paused";
  const isActPaused = activeActivity?.status === "PAUSED" || activeActivity?.status === "paused";

  const actRemaining = activeActivity ? getActivityRemainingSeconds() : null;
  const actTotalDur = activeActivity?.duration || 30;
  const actProgressPct = actRemaining !== null ? Math.max(0, Math.min(100, (actRemaining / actTotalDur) * 100)) : 0;
  const actIsUrgent = actRemaining !== null && !isActPaused && actRemaining <= 10 && actRemaining > 0;

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex flex-col justify-between select-none overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* 16:9 Projector Top Header */}
      <header className="px-8 py-4 border-b border-slate-800/80 bg-[#0c1017]/90 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Zap className="w-4 h-4 text-[#080c14] fill-current" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              quz<span className="text-emerald-400">antagonic</span>
            </span>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {isWaiting ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Waiting Room</span>
            </div>
          ) : isEnded ? (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Event Ended</span>
            </div>
          ) : isPaused ? (
            <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-amber-400 shadow-sm shadow-amber-950/20">
              <Pause className="w-3 h-3 text-amber-400" />
              <span>Event Paused</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Event LIVE</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right hidden md:block">
            <h2 className="text-sm font-bold text-slate-200 line-clamp-1 tracking-tight">
              {event.title}
            </h2>
          </div>

          {/* Active Activity Live Countdown badge in top header */}
          {activeActivity && actRemaining !== null && !isWaiting && !isEnded && (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
                isActPaused
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-md shadow-amber-950/20"
                  : actIsUrgent
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse shadow-md shadow-rose-950/30"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {isActPaused ? (
                <Pause className="w-4 h-4 text-amber-400" />
              ) : (
                <Clock className={`w-4 h-4 ${actIsUrgent ? "text-rose-400" : "text-emerald-400"}`} />
              )}
              <span className="tabular-nums">
                {isActPaused ? `PAUSED (${formatSeconds(actRemaining)})` : formatSeconds(actRemaining)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#121722] border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold text-cyan-400 shadow-inner">
            <Users className="w-4 h-4" />
            <span className="tabular-nums">{participantCount} participants</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => navigate(`/dashboard/events/${eventId}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors shadow-sm"
            title="Exit back to event dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Presentation Stage */}
      {isWaiting ? (
        /* Waiting Room 16:9 Presentation Stage */
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 md:p-12 flex flex-col lg:flex-row items-stretch justify-between gap-8 md:gap-12 relative z-10">
          {/* Left: Huge QR and Join instructions */}
          <div className="w-full lg:w-96 flex-shrink-0 flex flex-col items-center justify-center p-8 bg-[#121722]/95 rounded-3xl border border-slate-800/90 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-full max-w-xs space-y-6 text-center z-10">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                  Scan to Join Now
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight">Join the Crowd</h1>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/40 inline-block mx-auto">
                <QrCard
                  joinCode={joinCode}
                  size={200}
                  className="w-full max-w-xs border-0 bg-transparent p-0"
                />
              </div>

              <div className="p-3 bg-[#090d14] rounded-2xl border border-slate-800/90 space-y-1 shadow-inner">
                <p className="text-xs text-slate-400">Or enter code manually:</p>
                <div className="text-2xl font-black font-mono tracking-widest text-emerald-400">
                  {joinCode}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Host will start the event soon</span>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Fullscreen Participant Cloud */}
          <div className="flex-1 w-full bg-[#121722]/90 rounded-3xl border border-slate-800/90 p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Joined Participants</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Watch names float in as attendees join via phone
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black font-mono text-cyan-400 tabular-nums">{participantCount}</span>
                <span className="text-xs text-slate-400 block font-mono">in waiting room</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[360px]">
              <ParticipantNameCloud
                participants={participants}
                maxDisplay={50}
                variant="presentation"
                className="w-full h-full"
              />
            </div>
          </div>
        </main>
      ) : isEnded ? (
        /* Event Concluded Presentation Stage */
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 md:p-12 flex items-center justify-center relative z-10">
          <div className="max-w-2xl w-full text-center space-y-8 p-12 bg-[#121722]/95 rounded-3xl border border-slate-800/90 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                Session Complete
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Event Has Concluded
              </h1>
              <p className="text-slate-300 text-lg max-w-lg mx-auto">
                Thank you to all <span className="text-emerald-400 font-bold tabular-nums font-mono">{participantCount} participants</span> for joining and contributing!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
              <div className="p-4 bg-[#090d14] rounded-2xl border border-slate-800 shadow-inner text-center">
                <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-2xl font-black text-white font-mono tabular-nums">{participantCount}</div>
                <div className="text-xs text-slate-400">Total Participants</div>
              </div>
              <div className="p-4 bg-[#090d14] rounded-2xl border border-slate-800 shadow-inner text-center">
                <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-2xl font-black text-white font-mono tabular-nums">Concluded</div>
                <div className="text-xs text-slate-400">Session Status</div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate(`/dashboard/events/${eventId}`)}
                className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700/60 transition-colors inline-flex items-center gap-2 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Return to Event Dashboard</span>
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* LIVE Interactive Stage */
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 relative z-10">
          {/* Left Side: Persistent QR Card */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col items-center justify-center order-2 lg:order-1">
            <QrCard
              joinCode={joinCode}
              size={220}
              className="w-full max-w-xs border-slate-700/80 bg-[#121722]/95 shadow-2xl"
            />
          </div>

          {/* Center/Right Stage: Active Activity */}
          <div className="flex-1 w-full flex items-center justify-center order-1 lg:order-2">
            {activeActivity ? (
              <div className="w-full animate-in fade-in zoom-in-95 duration-300 space-y-6">
                {/* Large Projector Activity Timer Banner */}
                <div className="bg-[#121722]/95 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      {isActPaused ? (
                        <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-2">
                          <Pause className="w-3 h-3 text-amber-400" />
                          ACTIVITY PAUSED
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          LIVE ACTIVITY
                        </span>
                      )}
                      <span className="text-xs font-mono font-semibold text-slate-400 capitalize">
                        {activeActivity.type.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                      {activeActivity.title}
                    </h3>
                  </div>

                  {actRemaining !== null && (
                    <div className={`flex items-center gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-mono border transition-all ${
                      isActPaused
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/20"
                        : actIsUrgent
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-xl shadow-rose-950/40"
                        : "bg-[#090d14] border-emerald-500/40 text-emerald-300 shadow-inner"
                    }`}>
                      {isActPaused ? (
                        <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                      ) : (
                        <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${actIsUrgent ? "text-rose-400 animate-bounce" : "text-emerald-400"}`} />
                      )}
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest tabular-nums">
                        {isActPaused ? `PAUSED` : formatSeconds(actRemaining)}
                      </span>
                    </div>
                  )}
                </div>
                {activeActivity.type === "poll" && (
                  <PollVisualizer
                    question={activeActivity.title}
                    options={pollResults.options}
                    totalVotes={pollResults.total}
                    isPresentation={true}
                  />
                )}

                {activeActivity.type === "word_cloud" && (
                  <WordCloudVisualizer
                    question={activeActivity.title}
                    words={wordCloudWords}
                    isPresentation={true}
                  />
                )}

                {activeActivity.type === "quiz" && activeActivity.questions && (
                  activeActivity.settings?.quiz_state === "leaderboard" ? (
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                      <QuizLeaderboard
                        leaderboard={quizLeaderboard}
                        isFinal={true}
                        totalQuestions={activeActivity.questions.length}
                      />
                    </div>
                  ) : (
                    <QuizArena
                      question={activeActivity.questions[activeActivity.activeQuestionIndex || 0]}
                      questionIndex={activeActivity.activeQuestionIndex || 0}
                      totalQuestions={activeActivity.questions.length}
                      leaderboard={quizLeaderboard}
                      isPresentation={true}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="text-center max-w-xl mx-auto space-y-6 py-12">
                <div className={`w-20 h-20 rounded-3xl ${isPaused ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"} flex items-center justify-center mx-auto shadow-2xl`}>
                  {isPaused ? <Pause className="w-10 h-10 animate-pulse" /> : <Radio className="w-10 h-10 animate-pulse" />}
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {isPaused ? "Event is Paused" : "Waiting for Next Activity"}
                  </h2>
                  <p className="text-base text-slate-400 max-w-md mx-auto">
                    {isPaused ? (
                      "The host has temporarily paused the event session. Please hold on."
                    ) : (
                      <>
                        Scan the QR code on the left or join using code{" "}
                        <span className="font-mono text-emerald-400 font-bold">
                          #{joinCode}
                        </span>{" "}
                        to participate from your phone.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Projector Footer ticker */}
      <footer className="px-8 py-3 border-t border-slate-800/80 bg-[#0c1017]/90 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 font-medium z-20">
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isWaiting ? "bg-amber-400 animate-pulse" : isEnded ? "bg-rose-400" : isPaused ? "bg-amber-400" : "bg-emerald-500"}`} />
          <span>quzantagonic Live Interactive Stage {isWaiting ? "(Waiting Room)" : isEnded ? "(Concluded)" : isPaused ? "(Paused)" : "(Live)"}</span>
        </span>
        <span className="font-mono text-slate-400">
          Join URL: <span className="text-emerald-400 font-bold">{window.location.origin}/join/{joinCode}</span>
        </span>
      </footer>
    </div>
  );
};


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, Zap, Maximize2, Minimize2, Radio, ArrowLeft, Clock, Award, CheckCircle2 } from "lucide-react";
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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
        const pList = await api.get(`/participants/event/${eventId}`);
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

  // Timer countdown effect based on endsAt
  useEffect(() => {
    if (!event?.endsAt || (event.status !== "LIVE" && event.status !== "active")) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const end = new Date(event.endsAt!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0 && (event.status === "LIVE" || event.status === "active")) {
        setEvent((prev) => (prev ? { ...prev, status: "ENDED" } : null));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event?.endsAt, event?.status]);

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
            endsAt: data.endsAt,
            duration: data.duration || prev.duration,
          };
        });
      });

      socket.on("event:ended", () => {
        setEvent((prev) => (prev ? { ...prev, status: "ENDED" } : null));
        setActiveActivity(null);
      });

      socket.on("participant:joined", (data: any) => {
        setParticipantCount((prev) => prev + 1);
        if (data?.participant) {
          setParticipants((prev) => {
            const exists = prev.some((p) => p.id === data.participant.id || p.name.toLowerCase() === data.participant.name.toLowerCase());
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
        socket.off("participant:joined");
        socket.off("participants:updated");
        socket.off("activity:started");
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* 16:9 Projector Top Header */}
      <header className="px-8 py-4 border-b border-slate-800/80 bg-[#0d121c]/90 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950">
              <Zap className="w-4 h-4 text-[#0c1017] fill-current" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              Crowd<span className="text-emerald-400">Pulse</span>
            </span>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {isWaiting ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Waiting Room</span>
            </div>
          ) : isEnded ? (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Event Ended</span>
            </div>
          ) : activeActivity ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active {activeActivity.type.replace("_", " ")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold text-slate-400">
              <span>● Event Stage Ready</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="text-right hidden md:block">
            <h2 className="text-sm font-bold text-slate-200 line-clamp-1">
              {event.title}
            </h2>
          </div>

          {/* Live countdown timer badge */}
          {timeLeft !== null && !isWaiting && !isEnded && (
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
              timeLeft < 180
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold text-cyan-400">
            <Users className="w-4 h-4" />
            <span>{participantCount} participants</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => navigate(`/dashboard/events/${eventId}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
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
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 md:p-12 flex flex-col lg:flex-row items-stretch justify-between gap-8 md:gap-12 relative">
          {/* Left: Huge QR and Join instructions */}
          <div className="w-full lg:w-96 flex-shrink-0 flex flex-col items-center justify-center p-8 bg-[#0d121c]/90 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-full max-w-xs space-y-6 text-center z-10">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Scan to Join Now
                </span>
                <h1 className="text-2xl font-black text-white">Join the Crowd</h1>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/40 inline-block mx-auto">
                <QrCard
                  joinCode={joinCode}
                  size={200}
                  className="w-full max-w-xs border-0 bg-transparent p-0"
                />
              </div>

              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-xs text-slate-400">Or enter code manually:</p>
                <div className="text-2xl font-black font-mono tracking-widest text-emerald-400">
                  {joinCode}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Host will start the event soon</span>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Fullscreen Participant Cloud */}
          <div className="flex-1 w-full bg-[#0d121c]/70 rounded-3xl border border-slate-800/80 p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
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
                <span className="text-3xl font-black font-mono text-cyan-400">{participantCount}</span>
                <span className="text-xs text-slate-400 block">in waiting room</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[360px]">
              <ParticipantNameCloud
                participants={participants}
                maxDisplay={50}
                className="w-full h-full"
              />
            </div>
          </div>
        </main>
      ) : isEnded ? (
        /* Event Concluded Presentation Stage */
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 md:p-12 flex items-center justify-center relative">
          <div className="max-w-2xl w-full text-center space-y-8 p-12 bg-[#0d121c]/90 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Session Complete
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Event Has Concluded
              </h1>
              <p className="text-slate-400 text-lg max-w-lg mx-auto">
                Thank you to all <span className="text-emerald-400 font-bold">{participantCount} participants</span> for joining and contributing!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-center">
                <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-2xl font-black text-white">{participantCount}</div>
                <div className="text-xs text-slate-400">Total Participants</div>
              </div>
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-center">
                <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-2xl font-black text-white">{event.duration || 30}m</div>
                <div className="text-xs text-slate-400">Event Duration</div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate(`/dashboard/events/${eventId}`)}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Return to Event Dashboard</span>
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* LIVE Interactive Stage */
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 relative">
          {/* Left Side: Persistent QR Card */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col items-center justify-center order-2 lg:order-1">
            <QrCard
              joinCode={joinCode}
              size={220}
              className="w-full max-w-xs border-slate-700/80 bg-[#121620]"
            />
          </div>

          {/* Center/Right Stage: Active Activity */}
          <div className="flex-1 w-full flex items-center justify-center order-1 lg:order-2">
            {activeActivity ? (
              <div className="w-full animate-in fade-in zoom-in-95 duration-300">
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
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
                  <Radio className="w-10 h-10 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Waiting for Next Activity
                  </h2>
                  <p className="text-base text-slate-400 max-w-md mx-auto">
                    Scan the QR code on the left or join using code{" "}
                    <span className="font-mono text-emerald-400 font-bold">
                      #{joinCode}
                    </span>{" "}
                    to participate from your phone.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Projector Footer ticker */}
      <footer className="px-8 py-3 border-t border-slate-900 bg-[#0a0d14] flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isWaiting ? "bg-amber-400 animate-pulse" : isEnded ? "bg-rose-400" : "bg-emerald-500"}`} />
          CrowdPulse Live Interactive Display {isWaiting ? "(Waiting Room)" : isEnded ? "(Ended)" : "(Live)"}
        </span>
        <span className="font-mono">
          Join URL: {window.location.origin}/join/{joinCode}
        </span>
      </footer>
    </div>
  );
};


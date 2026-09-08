import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Users, Zap, Maximize2, Minimize2, Radio } from "lucide-react";
import { api } from "../services/api";
import { getSocket, joinEventRoom, leaveEventRoom } from "../services/socket";
import { Activity, EventItem, PollOption } from "../types";
import { QrCard } from "../components/qr/QrCard";
import { PollVisualizer } from "../components/activities/PollVisualizer";
import { WordCloudVisualizer } from "../components/activities/WordCloudVisualizer";
import { QuizArena } from "../components/activities/QuizArena";
import { QuizLeaderboard } from "../components/activities/QuizLeaderboard";

export const PresentationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

      socket.on("participant:joined", () => {
        setParticipantCount((prev) => prev + 1);
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

  if (!event) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400 font-mono">
        Connecting to Presentation Stage...
      </div>
    );
  }

  const joinCode = event.joinCode || event.join_code || "";

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* 16:9 Projector Top Header */}
      <header className="px-8 py-5 border-b border-slate-800/80 bg-[#0d121c]/90 backdrop-blur-md flex items-center justify-between z-20">
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

          {activeActivity ? (
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

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <h2 className="text-sm font-bold text-slate-200 line-clamp-1">
              {event.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl font-mono text-sm font-bold text-cyan-400">
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
        </div>
      </header>

      {/* Main Presentation Stage */}
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

      {/* Projector Footer ticker */}
      <footer className="px-8 py-3 border-t border-slate-900 bg-[#0a0d14] flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          CrowdPulse Live Interactive Display
        </span>
        <span className="font-mono">
          Join URL: {window.location.origin}/join/{joinCode}
        </span>
      </footer>
    </div>
  );
};

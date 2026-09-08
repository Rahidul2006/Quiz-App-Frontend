import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Menu,
  QrCode,
  Users,
  Check,
  Clock,
  Sparkles,
  X,
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

export const ParticipantEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // QR Modal (Requirement: Top right QR button)
  const [showQrModal, setShowQrModal] = useState(false);

  // Poll state
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [pollResults, setPollResults] = useState<{ options: PollOption[]; total: number }>({
    options: [],
    total: 0,
  });

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
        setHasVotedPoll(false);
        setSelectedPollOption(null);
        setHasSubmittedQuiz(false);
        setSelectedQuizOption(null);
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
      const res = await api.post(`/activities/${actId}/respond`, {
        optionId: selectedPollOption,
        participantId: participant.id || participant._id,
        participantName: participant.name,
      });
      setHasVotedPoll(true);
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
      console.error("Word submit failed", e);
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

  return (
    <div className="min-h-screen bg-[#0c1017] flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-800/40">
      {/* Mobile Top Bar with Required QR Icon in Top-Right */}
      <header className="sticky top-0 z-40 bg-[#121620]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Event Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate tracking-tight">
              {event.title}
            </h1>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <span>#{joinCode}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-cyan-400">
                <Users className="w-2.5 h-2.5" />
                {participantCount}
              </span>
            </div>
          </div>
        </div>

        {/* QR Button in Top Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors active:scale-95 shadow-sm"
            aria-label="Open Event QR Code"
            title="Event QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0"
            title={participant?.name}
          >
            {participant?.name ? participant.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-20 flex flex-col justify-center">
        {/* CASE 1: WAITING ROOM */}
        {!activeActivity && (
          <div className="text-center space-y-5 my-auto animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400">You&apos;re in!</span>
              <h2 className="text-2xl font-black text-white">
                Waiting for the next activity...
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
                The presenter will launch a poll, word cloud, or quiz shortly. Keep this page open!
              </p>
            </div>

            <div className="p-3.5 bg-[#161b26] border border-slate-800 rounded-2xl inline-flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Joined as <strong>{participant?.name}</strong></span>
            </div>
          </div>
        )}

        {/* CASE 2: LIVE POLL */}
        {activeActivity && activeActivity.type === "poll" && (
          <div className="space-y-5 my-auto animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                ● Live Poll
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight pt-1">
                {activeActivity.title}
              </h2>
            </div>

            {/* Options list */}
            <div className="space-y-2.5 pt-2">
              {(activeActivity.options || []).map((option, idx) => {
                const optId = option.id || option._id || "";
                const isSelected = selectedPollOption === optId;
                return (
                  <button
                    key={optId || idx}
                    disabled={hasVotedPoll}
                    onClick={() => setSelectedPollOption(optId)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500/40"
                        : "bg-[#161b26] border-slate-800 text-slate-200 hover:border-slate-700"
                    } ${hasVotedPoll ? "opacity-90 cursor-default" : "active:scale-[0.99]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-semibold">{option.text}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action button */}
            {!hasVotedPoll ? (
              <button
                onClick={handleVotePoll}
                disabled={!selectedPollOption}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950 active:scale-95 disabled:opacity-40"
              >
                Submit Response
              </button>
            ) : (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Response submitted ✓</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Watch live results on the presentation screen!
                </p>
              </div>
            )}
          </div>
        )}

        {/* CASE 3: WORD CLOUD */}
        {activeActivity && activeActivity.type === "word_cloud" && (
          <div className="space-y-6 my-auto animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                ☁ Word Cloud
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight pt-1">
                {activeActivity.title}
              </h2>
            </div>

            <div className="bg-[#121620] border border-slate-800/80 rounded-3xl p-5 min-h-[260px] flex flex-wrap items-center justify-center gap-2 shadow-inner">
              {wordCloudList.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700/60 text-slate-200"
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
              className="w-full py-3.5 rounded-2xl bg-[#1c2333] hover:bg-[#222b3f] text-white font-bold text-sm border border-slate-700/80 shadow-lg active:scale-95 transition-all"
            >
              Add response
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
                      <span className="text-xs font-bold text-purple-400 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-full">
                        Question {qIdx + 1} / {activeActivity.questions.length}
                      </span>

                      <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-slate-200 bg-slate-800 px-3 py-1 rounded-full">
                        <Clock className={`w-3.5 h-3.5 ${quizTimer <= 5 ? "text-red-400" : "text-cyan-400"}`} />
                        <span>00:{quizTimer.toString().padStart(2, "0")}</span>
                      </div>
                    </div>

                    <div className="bg-[#161b26] border border-slate-700/80 rounded-2xl p-5 text-center shadow-lg">
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
                            disabled={hasSubmittedQuiz || quizTimer === 0}
                            onClick={() => setSelectedQuizOption(optId)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/50"
                                : "bg-[#161b26] border-slate-800 text-slate-200 hover:border-slate-700"
                            } ${(hasSubmittedQuiz || quizTimer === 0) ? "opacity-80" : "active:scale-[0.99]"}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700">
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
                        disabled={!selectedQuizOption || quizTimer === 0}
                        className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-950 active:scale-95 transition-all disabled:opacity-40"
                      >
                        Submit Answer
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
      {showWordInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#161b26] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white">Add your word</h4>
              <button
                onClick={() => setShowWordInputModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
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
                className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWordInputModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWord}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <footer className="border-t border-slate-800/60 bg-[#0c1017] px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>CrowdPulse Live</span>
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

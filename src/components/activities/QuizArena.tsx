import React, { useState, useEffect } from "react";
import { QuizQuestion, LeaderboardEntry } from "../../types";
import { QuizLeaderboard } from "./QuizLeaderboard";
import {
  Timer,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Eye,
  Users,
  Play,
  Pause,
  RotateCcw,
  Plus,
  HelpCircle,
  ListOrdered,
} from "lucide-react";

interface QuizArenaProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  questions?: QuizQuestion[];
  leaderboard: LeaderboardEntry[];
  isPresentation?: boolean;
  quizState?: "ready" | "answering" | "paused" | "revealed" | "leaderboard";
  correctOptionId?: string | null;
  optionCounts?: Record<string, number>;
  totalResponses?: number;
  questionStartedAt?: Date | string | null;
  questionEndsAt?: Date | string | null;
  remainingSeconds?: number | null;
  onSwitchQuestion?: (questionIndex: number) => void;
  onStartTimer?: (durationSeconds?: number) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onResetTimer?: () => void;
  onAddTime?: (extraSeconds: number) => void;
  onReveal?: () => void;
  onShowLeaderboard?: () => void;
  onAdvance?: () => void;
  onFinish?: () => void;
  isAdmin?: boolean;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  question,
  questionIndex,
  totalQuestions,
  questions = [],
  leaderboard,
  isPresentation = false,
  quizState = "ready",
  correctOptionId,
  optionCounts = {},
  totalResponses = 0,
  questionEndsAt,
  remainingSeconds,
  onSwitchQuestion,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onAddTime,
  onReveal,
  onShowLeaderboard,
  onAdvance,
  onFinish,
  isAdmin = false,
}) => {
  const defaultLimit = question?.time_limit_sec || 15;
  const [timeLeft, setTimeLeft] = useState<number>(defaultLimit);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [customSeconds, setCustomSeconds] = useState<number>(defaultLimit);

  const isRevealed = quizState === "revealed";
  const isAnswering = quizState === "answering";
  const isPaused = quizState === "paused";
  const isReady = quizState === "ready" || (!isAnswering && !isPaused && !isRevealed && quizState !== "leaderboard");

  // Keep customSeconds synced when question changes
  useEffect(() => {
    setCustomSeconds(question?.time_limit_sec || 15);
  }, [question?.time_limit_sec, questionIndex]);

  // Server-authoritative timer countdown
  useEffect(() => {
    if (isAnswering && questionEndsAt) {
      const updateTimer = () => {
        const deadline = new Date(questionEndsAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((deadline - now) / 1000));
        setTimeLeft(diff);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 250);
      return () => clearInterval(interval);
    } else if (isPaused) {
      if (typeof remainingSeconds === "number") {
        setTimeLeft(remainingSeconds);
      }
    } else if (isReady) {
      setTimeLeft(question?.time_limit_sec || 15);
    }
  }, [isAnswering, isPaused, isReady, questionEndsAt, remainingSeconds, question?.time_limit_sec]);

  const timerPercent = Math.min(100, Math.max(0, (timeLeft / (question?.time_limit_sec || 15)) * 100));
  const isLastQuestion = questionIndex + 1 >= totalQuestions;

  const handleReveal = () => {
    if (onReveal) {
      onReveal();
    }
  };

  if (showLeaderboard || quizState === "leaderboard") {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">Live Leaderboard Standings</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowLeaderboard(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
            >
              Back to Question View
            </button>
          )}
        </div>

        <QuizLeaderboard
          leaderboard={leaderboard}
          isFinal={isLastQuestion}
          totalQuestions={totalQuestions}
        />

        {isAdmin && (
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Question Quick Jump Bar from Leaderboard */}
            {questions.length > 1 && (
              <div className="w-full flex items-center justify-center gap-1.5 flex-wrap pb-2">
                <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                  <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Jump to:</span>
                </span>
                {questions.map((q, idx) => (
                  <button
                    key={q.id || (q as any)._id || idx}
                    onClick={() => {
                      setShowLeaderboard(false);
                      onSwitchQuestion?.(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      idx === questionIndex
                        ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            )}

            {!isLastQuestion ? (
              <button
                onClick={() => {
                  setShowLeaderboard(false);
                  onAdvance?.();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 font-black text-slate-950 transition-all shadow-lg shadow-emerald-950/40 active:scale-95 text-sm"
              >
                <span>Pass Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onFinish}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 font-black text-slate-950 transition-all shadow-xl shadow-amber-950/40 active:scale-95 text-sm"
              >
                <Trophy className="w-4 h-4" />
                <span>Show Champion Winner</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full ${isPresentation ? "max-w-4xl" : "max-w-3xl"} mx-auto space-y-6`}>
      {/* ── ADMIN QUESTION SWITCHER & NAVIGATION BAR ── */}
      {isAdmin && (
        <div className="bg-[#121722]/95 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Question Switcher</span>
              </span>
              <span className="text-xs text-slate-400">
                Click any question to switch immediately:
              </span>
            </div>

            {/* Quick jump navigation arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSwitchQuestion?.(Math.max(0, questionIndex - 1))}
                disabled={questionIndex <= 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-1"
                title="Previous Question"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <button
                onClick={() => onSwitchQuestion?.(Math.min(totalQuestions - 1, questionIndex + 1))}
                disabled={questionIndex >= totalQuestions - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold flex items-center gap-1"
                title="Next Question"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Question Pill Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isCurrent = idx === questionIndex;
              const qObj = questions[idx];
              const qText = qObj?.question_text || `Question ${idx + 1}`;

              return (
                <button
                  key={idx}
                  onClick={() => onSwitchQuestion?.(idx)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                    isCurrent
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg shadow-purple-950/40 ring-2 ring-purple-500/40 scale-105"
                      : "bg-slate-800/80 hover:bg-slate-700 border-slate-700/60 text-slate-300"
                  }`}
                  title={`Switch to Question ${idx + 1}: ${qText}`}
                >
                  <span>Q{idx + 1}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Banner: Question Progress & Timer */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded-full">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          {isLastQuestion && (
            <span className="text-[10px] md:text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase">
              Final Question
            </span>
          )}

          {/* Timer status badge */}
          {isReady && (
            <span className="text-[10px] md:text-xs font-mono font-bold text-slate-400 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-full">
              Timer Ready (Not Started)
            </span>
          )}
          {isPaused && (
            <span className="text-[10px] md:text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Pause className="w-3 h-3" />
              <span>Paused</span>
            </span>
          )}
          {isAnswering && (
            <span className="text-[10px] md:text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Timer Running</span>
            </span>
          )}
          {isRevealed && (
            <span className="text-[10px] md:text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Revealed</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {totalResponses > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{totalResponses} answered</span>
            </div>
          )}

          <div
            className={`flex items-center gap-2 font-mono font-bold text-lg px-3.5 py-1 rounded-2xl border transition-all ${
              isReady
                ? "bg-slate-800/60 border-slate-700 text-slate-400"
                : isPaused
                ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                : timeLeft <= 5
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse shadow-lg shadow-rose-950/40"
                : "bg-[#121722] border-slate-700 text-slate-200"
            }`}
          >
            {isPaused ? (
              <Pause className="w-5 h-5 text-amber-400" />
            ) : (
              <Timer
                className={`w-5 h-5 ${
                  isReady
                    ? "text-slate-400"
                    : timeLeft <= 5
                    ? "text-rose-400 animate-pulse"
                    : "text-cyan-400"
                }`}
              />
            )}
            <span className="tabular-nums">
              {isReady ? `${question?.time_limit_sec || 15}s` : `${timeLeft}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-linear rounded-full ${
            isReady
              ? "bg-slate-600/40 w-full"
              : isPaused
              ? "bg-amber-500"
              : timeLeft <= 5
              ? "bg-rose-500"
              : "bg-gradient-to-r from-emerald-500 to-cyan-500"
          }`}
          style={{ width: isReady ? "100%" : `${timerPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-[#121722] border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
        {isRevealed && (
          <div className="absolute top-2.5 right-4 flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Answer Revealed</span>
          </div>
        )}
        <h2
          className={`font-black text-white tracking-tight ${
            isPresentation ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
          }`}
        >
          {question.question_text}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(question.options || []).map((opt, idx) => {
          const optId = opt.id || (opt as any)._id || "";
          const isCorrect = Boolean(opt.is_correct || (correctOptionId && optId === correctOptionId));
          const count = optionCounts[optId] || 0;
          const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

          let cardStyle = "bg-[#121722] border-slate-800/90 text-slate-200 hover:border-slate-700/80";
          if (isRevealed) {
            if (isCorrect) {
              cardStyle =
                "bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-950/40";
            } else {
              cardStyle = "bg-[#090d14]/60 border-slate-800/40 text-slate-500 opacity-60";
            }
          }

          return (
            <div
              key={optId || idx}
              className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${cardStyle}`}
            >
              {/* Option votes progress background if revealed */}
              {isRevealed && count > 0 && (
                <div
                  className={`absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all duration-500 ${
                    isCorrect ? "bg-emerald-400" : "bg-slate-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}

              <span
                className={`w-8 h-8 rounded-xl border text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 ${
                  isRevealed && isCorrect
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-slate-800 text-slate-200 border-slate-700"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>

              <span className="font-semibold text-sm md:text-base flex-1">
                {opt.option_text}
              </span>

              {isRevealed && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {count > 0 && (
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-700/50">
                      {count} ({pct}%)
                    </span>
                  )}
                  {isCorrect && (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {isRevealed && question.explanation && (
        <div className="bg-[#090d14] border border-emerald-500/30 rounded-2xl p-4 text-sm text-slate-300 flex items-start gap-3 shadow-inner animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-400">Explanation: </span>
            {question.explanation}
          </div>
        </div>
      )}

      {/* ── ADMIN LIVE TIMER & FLOW CONTROLS PANEL ── */}
      {isAdmin && (
        <div className="bg-[#121722]/95 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Host Quiz & Timer Control Panel
              </h4>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              State: <strong className="text-emerald-400 uppercase">{quizState}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Timer Management Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* START TIMER BUTTON (Active when ready or paused or reset) */}
              {isReady && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartTimer?.(customSeconds)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START TIMER ({customSeconds}s)</span>
                  </button>

                  {/* Quick time selector */}
                  <select
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                    title="Select timer duration"
                  >
                    <option value={10}>10s</option>
                    <option value={15}>15s (default)</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                    <option value={45}>45s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
              )}

              {/* PAUSE / RESUME BUTTONS */}
              {isAnswering && (
                <>
                  <button
                    onClick={onPauseTimer}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Timer</span>
                  </button>

                  <button
                    onClick={() => onAddTime?.(10)}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all active:scale-95"
                    title="Add 10 extra seconds"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+10s</span>
                  </button>
                </>
              )}

              {isPaused && (
                <>
                  <button
                    onClick={onResumeTimer}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-950/30 transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume Timer</span>
                  </button>

                  <button
                    onClick={onResetTimer}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all active:scale-95"
                    title="Reset question timer to ready"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </>
              )}

              {/* Reset timer button if answering */}
              {isAnswering && (
                <button
                  onClick={onResetTimer}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all active:scale-95"
                  title="Reset question timer to ready"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Answer & Flow Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isRevealed ? (
                <button
                  onClick={handleReveal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Show Answer</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (onShowLeaderboard) {
                        onShowLeaderboard();
                      } else {
                        setShowLeaderboard(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Leaderboard Standings</span>
                  </button>

                  {!isLastQuestion ? (
                    <button
                      onClick={onAdvance}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
                    >
                      <span>Pass Next Question</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={onFinish}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-xl shadow-amber-950/40 active:scale-95 transition-all"
                    >
                      <Trophy className="w-4 h-4 text-slate-950" />
                      <span>Show Champion Winner</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

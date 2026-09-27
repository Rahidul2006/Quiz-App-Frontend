import React, { useState, useEffect } from "react";
import { QuizQuestion, LeaderboardEntry } from "../../types";
import { QuizLeaderboard } from "./QuizLeaderboard";
import { Timer, CheckCircle, AlertCircle, ArrowRight, Trophy, Eye, Users } from "lucide-react";

interface QuizArenaProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  isPresentation?: boolean;
  quizState?: "answering" | "revealed" | "leaderboard";
  correctOptionId?: string | null;
  optionCounts?: Record<string, number>;
  totalResponses?: number;
  onReveal?: () => void;
  onAdvance?: () => void;
  onFinish?: () => void;
  isAdmin?: boolean;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  question,
  questionIndex,
  totalQuestions,
  leaderboard,
  isPresentation = false,
  quizState,
  correctOptionId,
  optionCounts = {},
  totalResponses = 0,
  onReveal,
  onAdvance,
  onFinish,
  isAdmin = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(question.time_limit_sec || 15);
  const [localRevealed, setLocalRevealed] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Sync with external quizState if provided
  const isRevealed = quizState === "revealed" || localRevealed;

  useEffect(() => {
    setTimeLeft(question.time_limit_sec || 15);
    setLocalRevealed(false);
    setShowLeaderboard(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLocalRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question]);

  const timerPercent = (timeLeft / (question.time_limit_sec || 15)) * 100;
  const isLastQuestion = questionIndex + 1 >= totalQuestions;

  const handleReveal = () => {
    setLocalRevealed(true);
    if (onReveal) {
      onReveal();
    }
  };

  if (showLeaderboard || quizState === "leaderboard") {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <QuizLeaderboard
          leaderboard={leaderboard}
          isFinal={isLastQuestion}
          totalQuestions={totalQuestions}
        />

        {isAdmin && (
          <div className="flex justify-center gap-4 pt-4">
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
    <div className={`w-full ${isPresentation ? "max-w-4xl" : "max-w-2xl"} mx-auto space-y-6`}>
      {/* Top Banner: Question Progress & Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded-full">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          {isLastQuestion && (
            <span className="text-[10px] md:text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase">
              Final Question
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
          <div className="flex items-center gap-2 font-mono font-bold text-lg text-slate-200">
            <Timer className={`w-5 h-5 ${timeLeft <= 5 ? "text-rose-400 animate-pulse" : "text-cyan-400"}`} />
            <span className={`tabular-nums ${timeLeft <= 5 ? "text-rose-400" : ""}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            timeLeft <= 5 ? "bg-rose-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"
          }`}
          style={{ width: `${timerPercent}%` }}
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
          const optId = opt.id || opt._id || "";
          const isCorrect = Boolean(opt.is_correct || (correctOptionId && (optId === correctOptionId)));
          const count = optionCounts[optId] || 0;
          const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

          let cardStyle = "bg-[#121722] border-slate-800/90 text-slate-200 hover:border-slate-700/80";
          if (isRevealed) {
            if (isCorrect) {
              cardStyle = "bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-950/40";
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

      {/* Admin Live Controls */}
      {isAdmin && (
        <div className="flex items-center justify-end gap-3 pt-3">
          {!isRevealed ? (
            <button
              onClick={handleReveal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 active:scale-95 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Show Answer</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors"
              >
                Leaderboard Standings
              </button>

              {!isLastQuestion ? (
                <button
                  onClick={onAdvance}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
                >
                  <span>Pass Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onFinish}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-xl shadow-amber-950/40 active:scale-95 transition-all"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>Show Winner & Final Results</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

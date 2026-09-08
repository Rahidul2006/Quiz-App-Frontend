import React, { useState, useEffect } from "react";
import { QuizQuestion, LeaderboardEntry } from "../../types";
import { QuizLeaderboard } from "./QuizLeaderboard";
import { Timer, CheckCircle, AlertCircle, ArrowRight, Trophy } from "lucide-react";

interface QuizArenaProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  isPresentation?: boolean;
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
  onAdvance,
  onFinish,
  isAdmin = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(question.time_limit_sec || 15);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    setTimeLeft(question.time_limit_sec || 15);
    setIsRevealed(false);
    setShowLeaderboard(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question]);

  const timerPercent = (timeLeft / (question.time_limit_sec || 15)) * 100;

  if (showLeaderboard) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <QuizLeaderboard
          leaderboard={leaderboard}
          isFinal={questionIndex + 1 >= totalQuestions}
          totalQuestions={totalQuestions}
        />

        {isAdmin && (
          <div className="flex justify-center gap-4 pt-4">
            {questionIndex + 1 < totalQuestions ? (
              <button
                onClick={() => {
                  setShowLeaderboard(false);
                  onAdvance?.();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-all shadow-lg shadow-emerald-950"
              >
                <span>Next Question</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onFinish}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white transition-all shadow-lg shadow-purple-950"
              >
                <Trophy className="w-5 h-5" />
                <span>Finish Quiz</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full ${isPresentation ? "max-w-4xl" : "max-w-2xl"} mx-auto space-y-6`}>
      <div className="flex items-center justify-between">
        <span className="text-sm md:text-base font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
          Question {questionIndex + 1} of {totalQuestions}
        </span>

        <div className="flex items-center gap-2 font-mono font-bold text-lg text-slate-200">
          <Timer className={`w-5 h-5 ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-cyan-400"}`} />
          <span className={timeLeft <= 5 ? "text-red-400" : ""}>{timeLeft}s</span>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      <div className="bg-[#161b26] border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-2xl text-center">
        <h2
          className={`font-bold text-white tracking-tight ${
            isPresentation ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
          }`}
        >
          {question.question_text}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(question.options || []).map((opt, idx) => {
          let cardStyle = "bg-[#161b26] border-slate-800 text-slate-200";
          if (isRevealed) {
            if (opt.is_correct) {
              cardStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50";
            } else {
              cardStyle = "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-60";
            }
          }

          return (
            <div
              key={opt.id || opt._id || idx}
              className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-300 ${cardStyle}`}
            >
              <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="font-semibold text-base md:text-lg flex-1">
                {opt.option_text}
              </span>
              {isRevealed && opt.is_correct && (
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {isRevealed && question.explanation && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 text-sm text-slate-300 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-emerald-400">Explanation: </span>
            {question.explanation}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isRevealed ? (
            <button
              onClick={() => setIsRevealed(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700"
            >
              Reveal Answer
            </button>
          ) : (
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md"
            >
              <Trophy className="w-4 h-4" />
              <span>Show Leaderboard</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

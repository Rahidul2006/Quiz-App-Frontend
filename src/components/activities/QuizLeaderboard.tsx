import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, Clock, CheckCircle2 } from "lucide-react";
import { LeaderboardEntry } from "../../types";
import { formatTime } from "../../utils";

interface QuizLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  isFinal?: boolean;
  userRank?: number;
  userScore?: number;
  userCorrect?: number;
  totalQuestions?: number;
  userTimeMs?: number;
}

export const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({
  leaderboard,
  isFinal = false,
  userRank,
  userCorrect,
  totalQuestions = 10,
  userTimeMs = 0,
}) => {
  useEffect(() => {
    if (isFinal) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899"],
      });
    }
  }, [isFinal]);

  const getRankSuffix = (rank: number) => {
    const j = rank % 10;
    const k = rank % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {userRank !== undefined && (
        <div className="bg-gradient-to-b from-[#1c2333] to-[#131824] border border-emerald-500/30 rounded-3xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3 text-amber-400">
            <Trophy className="w-12 h-12 md:w-16 md:h-16 stroke-[1.5]" />
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white">
            You finished {userRank}
            <sup>{getRankSuffix(userRank)}</sup>
          </h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            {userRank <= 3
              ? "Phenomenal performance! You're on the podium!"
              : "You gave it your best shot!"}
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Correct answers</span>
              </div>
              <p className="text-lg font-bold font-mono text-emerald-400">
                {userCorrect ?? 0} / {totalQuestions}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Voting time</span>
              </div>
              <p className="text-lg font-bold font-mono text-slate-200">
                {formatTime(userTimeMs)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="bg-[#161b26] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top Leaderboard
          </span>
          <span>Score / Time</span>
        </div>

        <div className="divide-y divide-slate-800/60 mt-2">
          {leaderboard.slice(0, 10).map((entry) => {
            const rankBadge =
              entry.rank === 1
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : entry.rank === 2
                ? "bg-slate-300/20 text-slate-200 border-slate-400/40"
                : entry.rank === 3
                ? "bg-amber-700/20 text-amber-400 border-amber-700/40"
                : "bg-slate-800 text-slate-400 border-slate-700";

            return (
              <div
                key={entry.participant_id}
                className="flex items-center justify-between py-3 px-2 rounded-xl transition-colors hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full border text-xs font-black flex items-center justify-center flex-shrink-0 ${rankBadge}`}
                  >
                    {entry.rank}
                  </span>
                  <span className="font-semibold text-slate-100 truncate text-sm md:text-base">
                    {entry.participant_name}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {entry.total_score} pts
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {entry.correct_answers}/{entry.total_questions || totalQuestions} • {formatTime(entry.total_time_ms)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No scores recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

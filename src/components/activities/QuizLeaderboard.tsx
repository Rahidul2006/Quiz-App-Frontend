import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Clock, CheckCircle2, Medal, Crown } from "lucide-react";
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
  currentParticipantId?: string;
}

export const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({
  leaderboard,
  isFinal = false,
  userRank,
  userCorrect,
  totalQuestions = 10,
  userTimeMs = 0,
  currentParticipantId,
}) => {
  useEffect(() => {
    if (isFinal) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#f59e0b", "#3b82f6"],
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-b from-[#161d2d] to-[#0f1420] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl mb-3 text-amber-400 shadow-inner">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.75]" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            You finished {userRank}
            <sup>{getRankSuffix(userRank)}</sup>
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-5">
            {userRank <= 3
              ? "🏆 Phenomenal performance! You made the podium!"
              : "Outstanding effort! Thanks for participating."}
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-[#090d14]/80 border border-slate-800 rounded-2xl p-3 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Correct</span>
              </div>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-400 tabular-nums">
                {userCorrect ?? 0} / {totalQuestions}
              </p>
            </div>

            <div className="bg-[#090d14]/80 border border-slate-800 rounded-2xl p-3 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Time</span>
              </div>
              <p className="text-base sm:text-lg font-bold font-mono text-slate-200 tabular-nums">
                {formatTime(userTimeMs)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard list */}
      <div className="bg-[#121722] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2 text-amber-400 font-bold">
            <Crown className="w-4 h-4" />
            Top Leaderboard
          </span>
          <span>Score / Time</span>
        </div>

        <div className="divide-y divide-slate-800/50 mt-2 relative">
          <AnimatePresence>
            {leaderboard.slice(0, 10).map((entry) => {
              const isSelf = currentParticipantId && entry.participant_id === currentParticipantId;
              const rankBadge =
                entry.rank === 1
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10 shadow-sm"
                  : entry.rank === 2
                  ? "bg-slate-300/20 text-slate-200 border-slate-400/50 shadow-sm"
                  : entry.rank === 3
                  ? "bg-amber-700/25 text-amber-400 border-amber-700/50 shadow-sm"
                  : "bg-slate-800/80 text-slate-400 border-slate-700/80";

              return (
                <motion.div
                  layout
                  key={entry.participant_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 28,
                    mass: 0.8,
                  }}
                  className={`flex items-center justify-between py-3 px-3 rounded-2xl transition-all ${
                    isSelf
                      ? "bg-emerald-950/40 border border-emerald-500/40 my-1"
                      : "hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center flex-shrink-0 font-mono tabular-nums ${rankBadge}`}
                    >
                      {entry.rank}
                    </span>
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate text-xs sm:text-sm">
                        {entry.participant_name}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tabular-nums">
                        {entry.total_score} pts
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 tabular-nums">
                        {entry.correct_answers}/{entry.total_questions || totalQuestions} • {formatTime(entry.total_time_ms)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {leaderboard.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs sm:text-sm">
              No scores recorded yet. Responses will appear here in real-time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

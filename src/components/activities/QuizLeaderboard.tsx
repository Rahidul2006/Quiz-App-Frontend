import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Clock, CheckCircle2, Crown, Zap, Flame } from "lucide-react";
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
  userScore,
  userCorrect,
  totalQuestions = 10,
  userTimeMs = 0,
  currentParticipantId,
}) => {
  useEffect(() => {
    if (isFinal) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#10b981", "#06b6d4", "#f59e0b", "#a855f7", "#ec4899"],
      });
      // Second confetti burst for extra celebration
      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 120,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#eab308", "#10b981", "#38bdf8"],
        });
      }, 600);
      return () => clearTimeout(timer);
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

  const winner = leaderboard.length > 0 ? leaderboard[0] : null;
  const runnerUp = leaderboard.length > 1 ? leaderboard[1] : null;
  const thirdPlace = leaderboard.length > 2 ? leaderboard[2] : null;

  const userEntry = currentParticipantId
    ? leaderboard.find((e) => e.participant_id === currentParticipantId)
    : null;
  const userAvgSec = userEntry?.average_time_sec ?? (userTimeMs && totalQuestions ? +(userTimeMs / (totalQuestions * 1000)).toFixed(2) : 0);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* ── GRAND WINNER SPOTLIGHT (Displayed on final reveal) ── */}
      {isFinal && winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-[#1c180f] via-[#141824] to-[#0c0f17] p-6 sm:p-8 text-center shadow-2xl shadow-amber-950/40"
        >
          {/* Animated golden glow backdrop */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-10 w-60 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Winner Title Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wider mb-4 shadow-inner">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>🏆 Quiz Champion & Winner 🏆</span>
          </div>

          {/* Winner Name */}
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-tight drop-shadow-md">
            {winner.participant_name}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            1st Place Champion • Awarded for highest accuracy & fastest response speed!
          </p>

          {/* Prominent Winner Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 max-w-xl mx-auto">
            {/* Average Time Taken (Highlight as requested) */}
            <div className="bg-[#0b0e17]/90 border border-cyan-500/40 rounded-2xl p-4 text-center shadow-inner relative group">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-400 mb-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Average Time</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tabular-nums">
                {winner.average_time_sec !== undefined ? `${winner.average_time_sec}s` : formatTime(winner.average_time_ms || 0)}
              </p>
              <span className="text-[10px] text-cyan-400/80 font-mono mt-0.5 block">per question</span>
            </div>

            {/* Total Score */}
            <div className="bg-[#0b0e17]/90 border border-amber-500/40 rounded-2xl p-4 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Total Score</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300 tabular-nums">
                {winner.total_score.toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-400/80 font-mono mt-0.5 block">points</span>
            </div>

            {/* Accuracy / Correct answers */}
            <div className="bg-[#0b0e17]/90 border border-emerald-500/40 rounded-2xl p-4 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Correct Answers</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tabular-nums">
                {winner.correct_answers} / {winner.total_questions || totalQuestions}
              </p>
              <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5 block">
                {Math.round((winner.correct_answers / Math.max(1, winner.total_questions || totalQuestions)) * 100)}% accuracy
              </span>
            </div>
          </div>

          {/* Runners up mini-podium if available */}
          {(runnerUp || thirdPlace) && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80 max-w-md mx-auto">
              {runnerUp && (
                <div className="bg-[#090d14]/70 border border-slate-700/60 rounded-xl p-2.5 text-center">
                  <div className="text-[11px] font-bold text-slate-300">🥈 2nd: {runnerUp.participant_name}</div>
                  <div className="text-xs font-mono text-cyan-300 font-semibold mt-0.5">
                    {runnerUp.average_time_sec !== undefined ? `${runnerUp.average_time_sec}s avg` : formatTime(runnerUp.total_time_ms)} • {runnerUp.total_score} pts
                  </div>
                </div>
              )}
              {thirdPlace && (
                <div className="bg-[#090d14]/70 border border-slate-700/60 rounded-xl p-2.5 text-center">
                  <div className="text-[11px] font-bold text-amber-500/90">🥉 3rd: {thirdPlace.participant_name}</div>
                  <div className="text-xs font-mono text-cyan-300 font-semibold mt-0.5">
                    {thirdPlace.average_time_sec !== undefined ? `${thirdPlace.average_time_sec}s avg` : formatTime(thirdPlace.total_time_ms)} • {thirdPlace.total_score} pts
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ── USER PERSONAL FINISH CARD (If participant viewing their result) ── */}
      {userRank !== undefined && !isFinal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-b from-[#161d2d] to-[#0f1420] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden"
        >
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

          <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
            <div className="bg-[#090d14]/80 border border-slate-800 rounded-2xl p-3 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Correct</span>
              </div>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-400 tabular-nums">
                {userCorrect ?? 0} / {totalQuestions}
              </p>
            </div>

            <div className="bg-[#090d14]/80 border border-slate-800 rounded-2xl p-3 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1 text-[11px] text-cyan-400 mb-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Avg Time</span>
              </div>
              <p className="text-base sm:text-lg font-bold font-mono text-cyan-300 tabular-nums">
                {userAvgSec ? `${userAvgSec}s` : formatTime(userTimeMs)}
              </p>
            </div>

            <div className="bg-[#090d14]/80 border border-slate-800 rounded-2xl p-3 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 mb-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Score</span>
              </div>
              <p className="text-base sm:text-lg font-bold font-mono text-amber-300 tabular-nums">
                {userScore ?? 0}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── LEADERBOARD LIST ── */}
      <div className="bg-[#121722] border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2 text-amber-400 font-bold">
            <Crown className="w-4 h-4" />
            <span>Leaderboard Rankings</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden sm:inline text-cyan-400/80">⚡ Avg Time</span>
            <span>Score</span>
          </span>
        </div>

        <div className="divide-y divide-slate-800/50 mt-2 relative">
          <AnimatePresence>
            {leaderboard.slice(0, 15).map((entry) => {
              const isSelf = currentParticipantId && entry.participant_id === currentParticipantId;
              const rankBadge =
                entry.rank === 1
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10 shadow-sm"
                  : entry.rank === 2
                  ? "bg-slate-300/20 text-slate-200 border-slate-400/50 shadow-sm"
                  : entry.rank === 3
                  ? "bg-amber-700/25 text-amber-400 border-amber-700/50 shadow-sm"
                  : "bg-slate-800/80 text-slate-400 border-slate-700/80";

              const avgSec = entry.average_time_sec !== undefined ? `${entry.average_time_sec}s` : formatTime(entry.total_time_ms);

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

                  <div className="flex items-center gap-3 flex-shrink-0 text-right">
                    {/* Average time badge */}
                    <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>{avgSec} avg</span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tabular-nums">
                        {entry.total_score.toLocaleString()} pts
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 tabular-nums">
                        {entry.correct_answers}/{entry.total_questions || totalQuestions} correct • <span className="sm:hidden text-cyan-400">{avgSec}</span>
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

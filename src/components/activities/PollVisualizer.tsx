import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, BarChart2 } from "lucide-react";
import { PollOption } from "../../types";

interface PollVisualizerProps {
  question: string;
  options: PollOption[];
  totalVotes: number;
  isPresentation?: boolean;
}

export const PollVisualizer: React.FC<PollVisualizerProps> = ({
  question,
  options,
  totalVotes,
  isPresentation = false,
}) => {
  // Stable ranking sort: votes descending, tied by original order_index
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      const aVotes = a.votes || 0;
      const bVotes = b.votes || 0;
      if (bVotes !== aVotes) {
        return bVotes - aVotes;
      }
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });
  }, [options]);

  const maxVotes = Math.max(...sortedOptions.map((o) => o.votes || 0), 0);

  return (
    <div className={`w-full ${isPresentation ? "max-w-4xl" : "max-w-2xl"} mx-auto`}>
      <h2
        className={`font-black text-white tracking-tight mb-8 text-center leading-tight ${
          isPresentation ? "text-3xl sm:text-4xl md:text-5xl" : "text-xl sm:text-2xl md:text-3xl"
        }`}
      >
        {question}
      </h2>

      <div className="space-y-3.5 relative">
        <AnimatePresence mode="popLayout">
          {sortedOptions.map((option, idx) => {
            const optKey = option.id || option._id || `opt-${option.text}-${option.order_index ?? idx}`;
            const votes = option.votes || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isLeader = votes === maxVotes && votes > 0;
            const letterIdx = typeof option.order_index === "number" ? option.order_index : idx;

            return (
              <motion.div
                layout
                key={optKey}
                layoutId={optKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                  mass: 0.8,
                }}
                className={`relative overflow-hidden rounded-2xl bg-[#121722] border p-4 sm:p-5 transition-colors duration-300 shadow-lg ${
                  isLeader
                    ? "border-emerald-500/60 shadow-emerald-950/30 ring-1 ring-emerald-500/20"
                    : "border-slate-800/80 hover:border-slate-700/80"
                }`}
              >
                {/* Animated background progress bar */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-[width] duration-500 ease-out rounded-r-xl ${
                    isLeader
                      ? "bg-gradient-to-r from-emerald-500/20 via-emerald-500/30 to-emerald-500/40 border-r-2 border-emerald-400"
                      : "bg-slate-700/25"
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Content overlay */}
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Option letter / Rank badge */}
                    <span
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                        isLeader
                          ? "bg-emerald-500 text-slate-950 font-black shadow-emerald-500/20 scale-105"
                          : "bg-slate-800/90 text-slate-300 border border-slate-700/80"
                      }`}
                    >
                      {isLeader ? (
                        <Trophy className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      ) : (
                        String.fromCharCode(65 + (letterIdx % 26))
                      )}
                    </span>

                    <span
                      className={`font-semibold text-slate-100 truncate tracking-tight ${
                        isPresentation ? "text-xl md:text-2xl" : "text-base sm:text-lg"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400 font-mono tabular-nums">
                      {votes} {votes === 1 ? "vote" : "votes"}
                    </span>
                    <span
                      className={`font-mono font-bold px-3 py-1 rounded-xl transition-all tabular-nums ${
                        isLeader
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-base sm:text-lg shadow-sm"
                          : "bg-slate-800 text-slate-300 text-sm sm:text-base border border-slate-700/60"
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-400 font-medium px-2">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <TrendingUp className="w-4 h-4" />
          <span>Real-time Dynamic FLIP Ranking</span>
        </span>
        <span className="font-mono bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-xl text-slate-300 tabular-nums">
          Total Votes: {totalVotes}
        </span>
      </div>
    </div>
  );
};


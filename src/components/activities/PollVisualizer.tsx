import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
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
        className={`font-bold text-white tracking-tight mb-8 text-center ${
          isPresentation ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
        }`}
      >
        {question}
      </h2>

      <div className="space-y-3.5 relative">
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
              initial={false}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 28,
                mass: 0.8,
              }}
              className={`relative overflow-hidden rounded-2xl bg-[#161b26] border p-4 md:p-5 transition-colors duration-300 shadow-md ${
                isLeader
                  ? "border-emerald-500/50 shadow-emerald-950/20"
                  : "border-slate-800/80 hover:border-slate-700"
              }`}
            >
              {/* Animated background progress bar */}
              <div
                className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out rounded-r-xl ${
                  isLeader
                    ? "bg-gradient-to-r from-emerald-500/25 via-emerald-500/35 to-emerald-500/45 border-r-2 border-emerald-400"
                    : "bg-slate-700/30"
                }`}
                style={{ width: `${percentage}%` }}
              />

              {/* Content overlay */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Option letter / Rank badge */}
                  <span
                    className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors shadow-sm ${
                      isLeader
                        ? "bg-emerald-500 text-slate-950 font-black"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {isLeader ? (
                      <Trophy className="w-4 h-4 text-slate-950" />
                    ) : (
                      String.fromCharCode(65 + (letterIdx % 26))
                    )}
                  </span>

                  <span
                    className={`font-semibold text-slate-100 truncate ${
                      isPresentation ? "text-xl md:text-2xl" : "text-base md:text-lg"
                    }`}
                  >
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-400 font-mono">
                    {votes} {votes === 1 ? "vote" : "votes"}
                  </span>
                  <span
                    className={`font-mono font-bold px-3 py-1 rounded-xl transition-all ${
                      isLeader
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-lg shadow-sm"
                        : "bg-slate-800 text-slate-300 text-base"
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-400 font-medium px-2">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Real-time Live Ranking</span>
        </span>
        <span className="font-mono bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg text-slate-300">
          Total Votes: {totalVotes}
        </span>
      </div>
    </div>
  );
};


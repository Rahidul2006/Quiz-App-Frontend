import React from "react";
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
  const maxVotes = Math.max(...options.map((o) => o.votes || 0), 1);

  return (
    <div className={`w-full ${isPresentation ? "max-w-4xl" : "max-w-2xl"} mx-auto`}>
      <h2
        className={`font-bold text-white tracking-tight mb-8 text-center ${
          isPresentation ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
        }`}
      >
        {question}
      </h2>

      <div className="space-y-4">
        {options.map((option, idx) => {
          const votes = option.votes || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isLeader = votes === maxVotes && votes > 0;

          return (
            <div
              key={option.id || option._id || idx}
              className="relative overflow-hidden rounded-2xl bg-[#161b26] border border-slate-700/60 p-4 md:p-5 transition-all duration-300"
            >
              {/* Animated background bar */}
              <div
                className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out rounded-r-xl ${
                  isLeader
                    ? "bg-gradient-to-r from-emerald-500/30 to-emerald-500/50 border-r-2 border-emerald-400"
                    : "bg-slate-700/30"
                }`}
                style={{ width: `${percentage}%` }}
              />

              {/* Content overlay */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span
                    className={`font-medium text-slate-100 truncate ${
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
                    className={`font-mono font-bold px-3 py-1 rounded-lg ${
                      isLeader
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-lg"
                        : "bg-slate-800 text-slate-300 text-base"
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-400 font-medium px-2">
        <span>● Live Poll Results</span>
        <span className="font-mono">Total Responses: {totalVotes}</span>
      </div>
    </div>
  );
};

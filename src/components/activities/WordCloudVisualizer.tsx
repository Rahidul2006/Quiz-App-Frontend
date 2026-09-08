import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Cloud, Sparkles } from "lucide-react";
import { WordFrequency } from "../../types";

interface WordCloudVisualizerProps {
  question: string;
  words: WordFrequency[];
  isPresentation?: boolean;
}

export const WordCloudVisualizer: React.FC<WordCloudVisualizerProps> = ({
  question,
  words,
  isPresentation = false,
}) => {
  const maxVal = useMemo(() => {
    return Math.max(...words.map((w) => w.value), 1);
  }, [words]);

  const minVal = useMemo(() => {
    return Math.min(...words.map((w) => w.value), 1);
  }, [words]);

  const getColorClass = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.8) {
      return "text-emerald-300 bg-emerald-950/40 border-emerald-500/50 font-black shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30";
    }
    if (ratio >= 0.5) {
      return "text-cyan-300 bg-cyan-950/30 border-cyan-500/40 font-bold";
    }
    if (ratio >= 0.3) {
      return "text-slate-200 bg-slate-800/90 border-slate-700/80 font-semibold";
    }
    return "text-slate-300 bg-slate-800/60 border-slate-700/60 font-medium";
  };

  const getFontSizeStyle = (value: number, max: number, min: number) => {
    const minSize = isPresentation ? 20 : 14;
    const maxSize = isPresentation ? 52 : 30;

    if (max === min) {
      return { fontSize: `${(minSize + maxSize) / 2}px` };
    }
    const weight = (value - min) / (max - min);
    const size = Math.round(minSize + weight * (maxSize - minSize));
    return { fontSize: `${size}px` };
  };

  return (
    <div className={`w-full ${isPresentation ? "max-w-5xl" : "max-w-2xl"} mx-auto`}>
      <h2
        className={`font-black text-white tracking-tight mb-8 text-center leading-tight ${
          isPresentation ? "text-3xl sm:text-4xl md:text-5xl" : "text-xl sm:text-2xl md:text-3xl"
        }`}
      >
        {question}
      </h2>

      {words.length === 0 ? (
        <div className="bg-[#121722] border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500">
          <Cloud className="w-10 h-10 mx-auto mb-3 text-slate-600 animate-pulse" />
          <p className="text-base font-semibold text-slate-300">Waiting for audience submissions...</p>
          <p className="text-xs text-slate-500 mt-1">
            Submitted words will instantly populate this cloud dynamically.
          </p>
        </div>
      ) : (
        <div className="bg-[#121722] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-wrap items-center justify-center gap-3 sm:gap-4 min-h-[300px] relative overflow-hidden">
          {words.map((item, index) => {
            const colorClass = getColorClass(item.value, maxVal);
            const style = getFontSizeStyle(item.value, maxVal, minVal);

            return (
              <motion.span
                layout
                key={`${item.text}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={style}
                whileHover={{ scale: 1.08 }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-2xl border transition-all cursor-default select-none shadow-sm ${colorClass}`}
              >
                <span>{item.text}</span>
                {item.value > 1 && (
                  <span className="text-[10px] sm:text-xs font-mono opacity-80 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 tabular-nums">
                    {item.value}
                  </span>
                )}
              </motion.span>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium px-2">
        <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Word Cloud</span>
        </span>
        <span className="font-mono bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-xl text-slate-300 tabular-nums">
          {words.reduce((acc, curr) => acc + curr.value, 0)} entries ({words.length} unique)
        </span>
      </div>
    </div>
  );
};

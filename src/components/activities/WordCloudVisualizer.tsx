import React, { useMemo } from "react";
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
      return "text-emerald-400 bg-emerald-950/40 border-emerald-500/40 font-black shadow-lg shadow-emerald-950/50";
    }
    if (ratio >= 0.5) {
      return "text-cyan-400 bg-cyan-950/30 border-cyan-500/30 font-bold";
    }
    if (ratio >= 0.3) {
      return "text-indigo-300 bg-indigo-950/20 border-indigo-500/20 font-semibold";
    }
    return "text-slate-300 bg-slate-800/60 border-slate-700/60 font-medium";
  };

  const getFontSizeStyle = (value: number, max: number, min: number) => {
    const minSize = isPresentation ? 18 : 14;
    const maxSize = isPresentation ? 54 : 32;

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
        className={`font-bold text-white tracking-tight mb-8 text-center ${
          isPresentation ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
        }`}
      >
        {question}
      </h2>

      {words.length === 0 ? (
        <div className="bg-[#161b26] border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <p className="text-lg">Waiting for responses...</p>
          <p className="text-xs text-slate-600 mt-1">
            Audience entries will appear dynamically as they are submitted.
          </p>
        </div>
      ) : (
        <div className="bg-[#121620] border border-slate-800/80 rounded-3xl p-6 md:p-12 shadow-2xl flex flex-wrap items-center justify-center gap-3 md:gap-4 min-h-[300px] transition-all duration-500">
          {words.map((item, index) => {
            const colorClass = getColorClass(item.value, maxVal);
            const style = getFontSizeStyle(item.value, maxVal, minVal);

            return (
              <span
                key={`${item.text}-${index}`}
                style={style}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 cursor-default select-none animate-in zoom-in-95 duration-200 ${colorClass}`}
              >
                <span>{item.text}</span>
                {item.value > 1 && (
                  <span className="text-[10px] md:text-xs opacity-70 bg-black/40 px-1.5 py-0.5 rounded-full">
                    {item.value}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium px-2">
        <span>☁ Real-Time Word Cloud</span>
        <span className="font-mono">
          {words.reduce((acc, curr) => acc + curr.value, 0)} total entries ({words.length} unique)
        </span>
      </div>
    </div>
  );
};

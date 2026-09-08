import React, { useMemo } from "react";
import { Users, Sparkles } from "lucide-react";

interface ParticipantItem {
  id?: string;
  name: string;
}

interface ParticipantNameCloudProps {
  participants: (ParticipantItem | string)[];
  currentParticipantName?: string;
  variant?: "admin" | "participant" | "presentation";
  emptyMessage?: string;
  className?: string;
  maxDisplay?: number;
}

// Curated modern color palettes for cloud badges
const BADGE_COLORS = [
  "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400",
  "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 hover:border-cyan-400",
  "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30 hover:border-violet-400",
  "from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30 hover:border-amber-400",
  "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30 hover:border-rose-400",
  "from-indigo-500/20 to-cyan-500/20 text-indigo-300 border-indigo-500/30 hover:border-indigo-400",
];

const FONT_SIZES_MAP = {
  admin: [
    "text-xs px-3 py-1.5",
    "text-sm px-3.5 py-1.5 font-medium",
    "text-base px-4 py-2 font-semibold",
  ],
  participant: [
    "text-xs px-3 py-1.5",
    "text-sm px-3.5 py-2 font-medium",
    "text-base px-4 py-2 font-semibold",
  ],
  presentation: [
    "text-base px-4 py-2 font-medium",
    "text-lg sm:text-xl px-5 py-2.5 font-semibold",
    "text-xl sm:text-2xl px-6 py-3 font-bold",
    "text-2xl sm:text-3xl px-7 py-3.5 font-extrabold",
  ],
};

export const ParticipantNameCloud: React.FC<ParticipantNameCloudProps> = ({
  participants,
  currentParticipantName,
  variant = "participant",
  emptyMessage = "Waiting for participants to join with the QR or code...",
  className = "",
  maxDisplay,
}) => {
  // Normalize participant names list and extract unique names
  const normalizedList = useMemo(() => {
    const list: { name: string; id: string; isSelf: boolean; colorIndex: number; sizeIndex: number; animDelay: number }[] = [];
    const seen = new Set<string>();

    const sliceList = maxDisplay ? participants.slice(0, maxDisplay) : participants;
    sliceList.forEach((p, idx) => {
      const name = typeof p === "string" ? p : p.name;
      if (!name || !name.trim()) return;
      const cleanName = name.trim();
      const id = typeof p === "string" ? `${cleanName}-${idx}` : (p.id || `${cleanName}-${idx}`);
      
      const isSelf = !!(
        currentParticipantName &&
        cleanName.toLowerCase() === currentParticipantName.trim().toLowerCase()
      );

      // Deterministic pseudo-random seed based on name string
      let hash = 0;
      for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colorIndex = Math.abs(hash) % BADGE_COLORS.length;
      const fontSizes = FONT_SIZES_MAP[variant];
      const sizeIndex = Math.abs(hash >> 2) % fontSizes.length;
      const animDelay = (Math.abs(hash) % 20) * 0.1; // 0.0s - 2.0s delay for floating

      list.push({
        name: cleanName,
        id,
        isSelf,
        colorIndex,
        sizeIndex,
        animDelay,
      });
    });

    return list;
  }, [participants, currentParticipantName, variant]);

  if (normalizedList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-[#0c1017]/40">
        <Users className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const fontSizes = FONT_SIZES_MAP[variant];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c1017]/60 via-[#101622]/40 to-[#0c1017]/80 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-md shadow-inner">
      {/* Subtle background ambient pulse glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cloud Items Grid / Flow */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 relative z-10 py-4 max-h-[480px] overflow-y-auto no-scrollbar">
        {normalizedList.map((item) => {
          const colorClass = BADGE_COLORS[item.colorIndex];
          const sizeClass = fontSizes[item.sizeIndex] || fontSizes[0];

          return (
            <div
              key={item.id}
              style={{
                animationDelay: `${item.animDelay}s`,
                animationDuration: "4s",
              }}
              className={`
                group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r border transition-all duration-300 shadow-lg backdrop-blur-sm
                animate-pulse hover:animate-none hover:scale-110 active:scale-95 cursor-default select-none
                ${colorClass}
                ${sizeClass}
                ${
                  item.isSelf
                    ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0c1017] from-emerald-500/30 to-cyan-500/30 text-white font-extrabold shadow-emerald-500/20"
                    : ""
                }
              `}
            >
              {item.isSelf ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              )}
              <span className="tracking-tight">{item.name}</span>
              {item.isSelf && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-emerald-500 text-[#0c1017] font-black">
                  You
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Cloud Footer Counter Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live Participant Cloud</span>
        </div>
        <span className="font-mono font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
          {normalizedList.length} {normalizedList.length === 1 ? "person" : "people"} in room
        </span>
      </div>
    </div>
  );
};

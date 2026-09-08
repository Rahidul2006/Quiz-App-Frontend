import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, UserCheck } from "lucide-react";

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

// Curated sleek SaaS palette: neutral slate with emerald & cyan accents
const BADGE_STYLES = [
  "bg-slate-800/80 border-slate-700/70 text-slate-200 hover:border-emerald-500/40",
  "bg-slate-800/90 border-slate-700/60 text-slate-100 hover:border-emerald-500/40",
  "bg-emerald-950/30 border-emerald-500/25 text-emerald-300 hover:border-emerald-400/50",
  "bg-cyan-950/25 border-cyan-500/25 text-cyan-300 hover:border-cyan-400/50",
  "bg-slate-800/70 border-slate-700/50 text-slate-300 hover:border-slate-600",
];

const FONT_SIZES_MAP = {
  admin: [
    "text-xs px-3 py-1.5",
    "text-xs sm:text-sm px-3.5 py-1.5 font-medium",
    "text-sm px-4 py-2 font-semibold",
  ],
  participant: [
    "text-xs px-3 py-1.5",
    "text-xs sm:text-sm px-3.5 py-2 font-medium",
    "text-sm px-4 py-2 font-semibold",
  ],
  presentation: [
    "text-sm sm:text-base px-4 py-2 font-medium",
    "text-base sm:text-lg px-5 py-2.5 font-semibold",
    "text-lg sm:text-xl px-6 py-3 font-bold",
    "text-xl sm:text-2xl px-7 py-3.5 font-extrabold",
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
    const list: { name: string; id: string; isSelf: boolean; styleIndex: number; sizeIndex: number }[] = [];

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

      // Deterministic hash based on name
      let hash = 0;
      for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const styleIndex = Math.abs(hash) % BADGE_STYLES.length;
      const fontSizes = FONT_SIZES_MAP[variant];
      const sizeIndex = Math.abs(hash >> 2) % fontSizes.length;

      list.push({
        name: cleanName,
        id,
        isSelf,
        styleIndex,
        sizeIndex,
      });
    });

    return list;
  }, [participants, currentParticipantName, variant, maxDisplay]);

  if (normalizedList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-[#0b0f17]/40">
        <Users className="w-9 h-9 mb-3 text-slate-600 animate-pulse" />
        <p className="text-xs sm:text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const fontSizes = FONT_SIZES_MAP[variant];

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-[#0d121c]/70 border border-slate-800/80 p-5 sm:p-7 backdrop-blur-md shadow-xl ${className}`}>
      {/* Subtle ambient light corner accents */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cloud Items Grid / Flow with layout animations */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 relative z-10 py-3 max-h-[440px] overflow-y-auto no-scrollbar">
        <AnimatePresence>
          {normalizedList.map((item) => {
            const styleClass = BADGE_STYLES[item.styleIndex];
            const sizeClass = fontSizes[item.sizeIndex] || fontSizes[0];

            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.75, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                whileHover={{ scale: 1.05, y: -1 }}
                className={`
                  relative inline-flex items-center gap-2 rounded-2xl border transition-all duration-200 shadow-sm cursor-default select-none
                  ${styleClass}
                  ${sizeClass}
                  ${
                    item.isSelf
                      ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0d121c] bg-emerald-500/20 text-emerald-200 border-emerald-400/60 font-bold shadow-emerald-500/10"
                      : ""
                  }
                `}
              >
                {item.isSelf ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                )}
                <span className="tracking-tight">{item.name}</span>
                {item.isSelf && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-emerald-500 text-[#090d14] font-black">
                    You
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Cloud Footer Counter Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-slate-300">Live Participant Cloud</span>
        </div>
        <span className="font-mono font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 tabular-nums">
          {normalizedList.length} {normalizedList.length === 1 ? "attendee" : "attendees"}
        </span>
      </div>
    </div>
  );
};

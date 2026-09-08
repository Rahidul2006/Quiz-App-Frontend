import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QrCardProps {
  joinCode: string;
  size?: number;
  className?: string;
  showDomainText?: boolean;
}

export const QrCard: React.FC<QrCardProps> = ({
  joinCode,
  size = 180,
  className = "",
  showDomainText = true,
}) => {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const joinUrl = `${origin || "http://localhost:5173"}/join/${joinCode}`;

  return (
    <div
      className={`bg-[#161b26] border border-slate-700/60 rounded-3xl p-5 flex flex-col items-center text-center shadow-xl ${className}`}
    >
      <div className="bg-white p-3 rounded-2xl shadow-md mb-3 border-2 border-emerald-500/20">
        <QRCodeSVG value={joinUrl} size={size} level="M" />
      </div>

      {showDomainText && (
        <div className="w-full space-y-1">
          <p className="text-xs text-slate-400 font-medium tracking-wide">Join at</p>
          <p className="text-xs font-mono text-emerald-400 font-bold truncate">
            {origin ? origin.replace(/^https?:\/\//, "") : "crowdpulse.app"}/join
          </p>
          <div className="pt-2">
            <span className="text-2xl font-mono font-black tracking-wider text-white bg-slate-900 px-4 py-1 rounded-xl border border-slate-700/80 inline-block shadow-inner">
              #{joinCode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

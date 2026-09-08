import React, { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, X, QrCode } from "lucide-react";

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinCode: string;
  eventName: string;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, joinCode, eventName }) => {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const joinUrl = `${origin || "http://localhost:5173"}/join/${joinCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `event-${joinCode}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#161b26] border border-slate-700/80 rounded-3xl shadow-2xl p-6 md:p-8 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close QR Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
          <QrCode className="w-4 h-4" />
          <span>Scan to Join</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-4 line-clamp-1">{eventName}</h3>

        {/* Large QR Code Container */}
        <div
          ref={qrRef}
          className="bg-white p-6 rounded-2xl inline-block shadow-inner mx-auto mb-5 border-4 border-emerald-500/20"
        >
          <QRCodeSVG
            value={joinUrl}
            size={240}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Join Info */}
        <div className="bg-[#0c1017] rounded-xl p-3 mb-6 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Join at:</p>
          <p className="text-sm font-mono text-emerald-400 font-semibold break-all">
            {joinUrl.replace(/^https?:\/\//, "")}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400">Code:</span>
            <span className="text-lg font-mono font-bold tracking-widest text-white bg-slate-800 px-3 py-0.5 rounded-lg border border-slate-700">
              {joinCode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

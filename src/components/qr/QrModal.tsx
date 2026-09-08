import React, { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Download, X, QrCode, Sparkles } from "lucide-react";

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
            className="relative w-full max-w-md bg-[#121722] border border-slate-700/70 rounded-3xl shadow-2xl p-6 sm:p-8 text-center z-10"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Close QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan to Join Instantly</span>
            </div>

            <h3 className="text-xl font-extrabold text-white mb-4 line-clamp-1">{eventName}</h3>

            {/* Large QR Code Container */}
            <div
              ref={qrRef}
              className="bg-white p-5 sm:p-6 rounded-2xl inline-block shadow-xl mx-auto mb-5 border-4 border-emerald-500/20"
            >
              <QRCodeSVG
                value={joinUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Join Info */}
            <div className="bg-[#090d14] rounded-2xl p-3.5 mb-5 border border-slate-800 text-left">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Join URL:</span>
                <span className="text-[11px] text-emerald-400/80 font-medium">Auto-connects to event</span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-emerald-400 font-semibold break-all">
                {joinUrl.replace(/^https?:\/\//, "")}
              </p>
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Manual Code:</span>
                <span className="text-base sm:text-lg font-mono font-black tracking-widest text-white bg-slate-800/90 px-3 py-0.5 rounded-lg border border-slate-700">
                  #{joinCode}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm transition-colors border border-slate-700"
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
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40"
              >
                <Download className="w-4 h-4" />
                <span>Download QR</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

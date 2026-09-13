import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Scale,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  FolderGit2,
  HelpCircle,
  Info,
  Bell,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { judgeApi } from "../../services/judgeApi";
import { getSocket, joinJudgingRoom, leaveJudgingRoom } from "../../services/socket";

interface CriterionItem {
  id: string;
  _id: string;
  name: string;
  maxScore: number;
  description: string;
}

interface EvaluationData {
  status: "DRAFT" | "SUBMITTED";
  totalScore: number;
  comments: string;
  criteriaScores: { criterionId: string; score: number }[];
  submittedAt?: string;
}

export const JudgeEvaluationPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [team, setTeam] = useState<any>(null);
  const [round, setRound] = useState<{
    id: string;
    _id?: string;
    name: string;
    isLocked: boolean;
    allowJudgeEditAfterSubmit: boolean;
    totalMaxScore: number;
  } | null>(null);

  const currentRoundIdRef = useRef<string | null>(null);

  const [criteria, setCriteria] = useState<CriterionItem[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [existingStatus, setExistingStatus] = useState<"PENDING" | "DRAFT" | "SUBMITTED">("PENDING");
  const [isLocked, setIsLocked] = useState(false);
  const [roundSwitchedNotice, setRoundSwitchedNotice] = useState<string | null>(null);
  const [switchedNewRoundName, setSwitchedNewRoundName] = useState<string | null>(null);

  // Submit confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadData = async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await judgeApi.get(`/judge/teams/${teamId}/evaluate`);
      setTeam(data.team);
      setRound(data.round);
      currentRoundIdRef.current = data.round?.id || data.round?._id || null;
      setCriteria(data.criteria || []);
      setIsLocked(data.isLocked);

      // Populate scores if already evaluated
      if (data.evaluation) {
        setExistingStatus(data.evaluation.status);
        setComments(data.evaluation.comments || "");
        const scoreMap: Record<string, number> = {};
        if (Array.isArray(data.evaluation.criteriaScores)) {
          for (const item of data.evaluation.criteriaScores) {
            scoreMap[item.criterionId] = item.score;
          }
        }
        setScores(scoreMap);
      } else {
        // Initialize default scores to 0
        const defaultMap: Record<string, number> = {};
        for (const c of data.criteria || []) {
          defaultMap[c.id || c._id] = 0;
        }
        setScores(defaultMap);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load team evaluation screen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamId]);

  // Subscribe to real-time round switching & locking from admin
  useEffect(() => {
    joinJudgingRoom();
    const socket = getSocket();

    const handleRoundSwitch = (data: { roundId: string; roundName?: string }) => {
      // Check if current evaluation belongs to a different round
      if (!currentRoundIdRef.current || currentRoundIdRef.current !== data.roundId) {
        setIsLocked(true);
        setSwitchedNewRoundName(data.roundName || "New Active Round");
        setRoundSwitchedNotice("The administrator switched the active judging round.");
      }
    };

    const handleLockChange = (data: { roundId: string; isLocked: boolean }) => {
      if (currentRoundIdRef.current && currentRoundIdRef.current === data.roundId) {
        setIsLocked(data.isLocked);
      }
    };

    socket.on("judging:round_switched", handleRoundSwitch);
    socket.on("judging:lock_changed", handleLockChange);

    return () => {
      socket.off("judging:round_switched", handleRoundSwitch);
      socket.off("judging:lock_changed", handleLockChange);
      leaveJudgingRoom();
    };
  }, []);

  const handleScoreChange = (criterionId: string, maxScore: number, val: number) => {
    if (isLocked) return;
    const clamped = Math.max(0, Math.min(maxScore, Math.round(val)));
    setScores((prev) => ({ ...prev, [criterionId]: clamped }));
  };

  // Calculate live total score
  const liveTotal = criteria.reduce((sum, c) => {
    const cid = c.id || c._id;
    return sum + (scores[cid] || 0);
  }, 0);

  const totalMaxScore = criteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);

  const handleSaveDraft = async () => {
    if (isLocked) return;
    setSavingDraft(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        criteriaScores: Object.entries(scores).map(([criterionId, score]) => ({
          criterionId,
          score,
        })),
        comments,
      };
      await judgeApi.post(`/judge/teams/${teamId}/draft`, payload);
      setExistingStatus("DRAFT");
      setSuccessMsg("Draft saved successfully. You can return anytime to finalize.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save evaluation draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (isLocked) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        criteriaScores: Object.entries(scores).map(([criterionId, score]) => ({
          criterionId,
          score,
        })),
        comments,
      };
      await judgeApi.post(`/judge/teams/${teamId}/submit`, payload);
      setExistingStatus("SUBMITTED");
      setShowConfirmModal(false);
      setSuccessMsg("Evaluation submitted successfully!");

      // If round locks edits after submit, lock the screen
      if (!round?.allowJudgeEditAfterSubmit) {
        setIsLocked(true);
      }

      setTimeout(() => {
        navigate("/judge/dashboard");
      }, 1500);
    } catch (err: any) {
      setShowConfirmModal(false);
      const is409 = err.response?.status === 409 || err.status === 409;
      if (is409) {
        setIsLocked(true);
        setSwitchedNewRoundName(err.response?.data?.activeRoundName || "New Round");
        setError(err.response?.data?.message || "This judging round is no longer active.");
      } else {
        setError(err.message || "Failed to submit evaluation");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading evaluation form...</p>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-1">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">{error}</p>
        <Link
          to="/judge/dashboard"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
        >
          &larr; Back to Assigned Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-300">
      {/* Round Switched Notice */}
      <AnimatePresence>
        {roundSwitchedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 text-center py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <Bell className="w-3.5 h-3.5 animate-pulse" />
            {roundSwitchedNotice}
            <Link
              to="/judge/dashboard"
              className="ml-3 underline underline-offset-2 hover:opacity-80"
            >
              Go to Dashboard →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/judge/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                Submitted & Locked
              </span>
            ) : existingStatus === "SUBMITTED" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submitted
              </span>
            ) : existingStatus === "DRAFT" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                Draft Mode
              </span>
            ) : null}

            {/* Live Total Score Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Total:</span>
              <span className="font-mono font-black text-sm text-indigo-300">
                {liveTotal} <span className="text-slate-500 text-xs font-normal">/ {totalMaxScore}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Team Details Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-[#0e131f] to-[#121929] border border-slate-800/80 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-indigo-300 border border-indigo-500/20">
              {team?.teamCode}
            </span>
            <span className="text-xs text-slate-400 font-medium">{round?.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            {team?.teamName}
          </h1>

          <div className="space-y-1.5 text-xs">
            <p className="text-indigo-300 font-semibold flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Project: {team?.projectName}</span>
            </p>
            {team?.members && (
              <p className="text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>Members: {team?.members}</span>
              </p>
            )}
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-5 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              Judging Criteria ({criteria.length})
            </h2>
            <span className="text-xs text-slate-400 font-mono">Max Total: {totalMaxScore} pts</span>
          </div>

          {criteria.map((criterion, index) => {
            const cid = criterion.id || criterion._id;
            const currentScore = scores[cid] || 0;
            const percentage = criterion.maxScore > 0 ? (currentScore / criterion.maxScore) * 100 : 0;

            return (
              <div
                key={cid}
                className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800/80 hover:border-slate-700/80 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                      <h3 className="text-sm font-bold text-white">{criterion.name}</h3>
                    </div>
                    {criterion.description && (
                      <p className="text-xs text-slate-400 mt-1">{criterion.description}</p>
                    )}
                  </div>

                  {/* Score Numeric Box */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <input
                      type="number"
                      min={0}
                      max={criterion.maxScore}
                      disabled={isLocked}
                      value={currentScore}
                      onChange={(e) =>
                        handleScoreChange(cid, criterion.maxScore, Number(e.target.value))
                      }
                      className="w-16 px-2.5 py-1.5 bg-[#080c14] border border-slate-700 rounded-xl text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-900"
                    />
                    <span className="text-xs font-mono text-slate-500">/ {criterion.maxScore}</span>
                  </div>
                </div>

                {/* Score Slider */}
                <div className="space-y-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={criterion.maxScore}
                      step={1}
                      disabled={isLocked}
                      value={currentScore}
                      onChange={(e) =>
                        handleScoreChange(cid, criterion.maxScore, Number(e.target.value))
                      }
                      className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>0</span>
                    <span>{Math.round(criterion.maxScore / 2)}</span>
                    <span>{criterion.maxScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback / Comments Section */}
        <div className="mb-8 p-5 rounded-2xl bg-[#0e131f] border border-slate-800/80">
          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            Private Comments & Feedback
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Add constructive remarks or technical feedback. Visible only to you and event administrators.
          </p>
          <textarea
            rows={4}
            disabled={isLocked}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="e.g. Excellent technical architecture, robust error handling, but presentation could be more concise."
            className="w-full p-3.5 bg-[#080c14] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Sticky Action Footer */}
        {!isLocked && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0c1017]/95 border-t border-slate-800 backdrop-blur-md z-20">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Authoritative Score:</span>
                <span className="font-mono font-black text-lg text-white">
                  {liveTotal} <span className="text-slate-500 text-xs font-normal">/ {totalMaxScore}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft || submitting}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingDraft ? "Saving..." : "Save Draft"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={savingDraft || submitting}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Evaluation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e131f] border border-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-400" />
                Submit Evaluation?
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                You are submitting an official evaluation of <strong className="text-white">{liveTotal} / {totalMaxScore} points</strong> for <strong className="text-white">{team?.teamName}</strong>.
              </p>
              <p className="text-xs text-slate-400 mb-6 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                ⚠️ Once submitted, your evaluation may be locked from further edits depending on the administrator's settings.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/50 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Confirm & Submit</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL: ROUND SWITCHED OVERLAY */}
      {/* ========================================================= */}
      <AnimatePresence>
        {switchedNewRoundName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e131f] border border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-lg shadow-indigo-950/30">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                🔄 Judging Round Changed
              </h3>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                The administrator switched the active judging round. Your judging session is now moving to:
              </p>
              <div className="py-2.5 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black text-sm mb-4">
                {switchedNewRoundName}
              </div>
              <p className="text-[11px] text-slate-400 mb-6">
                Your draft or evaluations for this team remain securely stored in the database.
              </p>
              <button
                onClick={() => navigate("/judge/dashboard")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to New Round</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  LogOut,
  CheckCircle2,
  Clock,
  FileEdit,
  ArrowRight,
  Search,
  Lock,
  Sparkles,
  Users,
  FolderGit2,
  RefreshCw,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { useJudgeAuth } from "../../context/JudgeAuthContext";
import { judgeApi } from "../../services/judgeApi";
import { getSocket, joinJudgingRoom, leaveJudgingRoom } from "../../services/socket";

interface AssignedTeamItem {
  id: string;
  _id: string;
  teamCode: string;
  teamName: string;
  projectName: string;
  members?: string;
  status: "PENDING" | "DRAFT" | "SUBMITTED";
  totalScore: number | null;
  draftScore: number | null;
}

interface RoundInfo {
  id: string;
  _id?: string;
  name: string;
  status?: string;
  isLocked: boolean;
  evaluationMode?: string;
  allowJudgeEditAfterSubmit?: boolean;
}

export const JudgeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { judge, logout } = useJudgeAuth();

  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isJudgeDisabled, setIsJudgeDisabled] = useState(false);

  const [teams, setTeams] = useState<AssignedTeamItem[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, draft: 0, pending: 0 });
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "DRAFT" | "SUBMITTED">("ALL");
  const [switchBannerText, setSwitchBannerText] = useState<string | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Authoritative data fetcher — directly from the database API
  const loadData = useCallback(async (isSwitch = false) => {
    try {
      if (isSwitch) {
        setIsSwitching(true);
      } else {
        setLoading(true);
      }

      // Query database for authoritative active round data
      const data = await judgeApi.get("/judge/assigned-teams");

      // Replace entire dashboard state with the API response
      setTeams(data.teams || []);
      setStats(data.stats || { total: 0, completed: 0, draft: 0, pending: 0 });
      setRoundInfo(data.round || null);
    } catch (err) {
      console.error("Failed to load assigned teams:", err);
    } finally {
      setLoading(false);
      setIsSwitching(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadData(false);

    // Join judging room
    joinJudgingRoom();
    const socket = getSocket();

    // 1. Immediate round switch: clear old data immediately & fetch active round from database
    const handleRoundSwitch = (data?: { roundName?: string }) => {
      // Clear all old round data immediately to avoid mixing
      setTeams([]);
      setStats({ total: 0, completed: 0, draft: 0, pending: 0 });
      setRoundInfo(null);

      if (data?.roundName) {
        setSwitchBannerText(`Admin switched active round to: "${data.roundName}"`);
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = setTimeout(() => setSwitchBannerText(null), 3500);
      }

      // Immediately call API with ZERO delay
      loadData(true);
    };

    // 2. Lock status change in real time
    const handleLockChange = (data: { roundId: string; isLocked: boolean; status?: string }) => {
      setRoundInfo((prev) => {
        if (!prev) return prev;
        if (prev.id === data.roundId || (prev as any)._id === data.roundId) {
          return {
            ...prev,
            isLocked: data.isLocked,
            status: data.status || (data.isLocked ? "locked" : "active"),
          };
        }
        return prev;
      });
    };

    // 3. Round settings or assignments updated
    const handleRoundUpdated = () => {
      loadData(false);
    };

    const handleAssignmentsUpdated = () => {
      loadData(false);
    };

    const handleCriteriaUpdated = () => {
      loadData(false);
    };

    // 4. Judge disabled / enabled by admin
    const handleJudgeStatusChanged = (data: { judgeId: string; status: string }) => {
      if (judge && (judge.id === data.judgeId || (judge as any)._id === data.judgeId)) {
        setIsJudgeDisabled(data.status === "disabled");
      }
    };

    // 5. Auto re-fetch active round on socket connect / reconnect
    const handleSocketConnect = () => {
      joinJudgingRoom();
      loadData(false);
    };

    socket.on("judging:round_switched", handleRoundSwitch);
    socket.on("judging:lock_changed", handleLockChange);
    socket.on("judging:round_updated", handleRoundUpdated);
    socket.on("judging:assignments_updated", handleAssignmentsUpdated);
    socket.on("judging:criteria_updated", handleCriteriaUpdated);
    socket.on("judging:judge_status_changed", handleJudgeStatusChanged);
    socket.on("connect", handleSocketConnect);

    return () => {
      socket.off("judging:round_switched", handleRoundSwitch);
      socket.off("judging:lock_changed", handleLockChange);
      socket.off("judging:round_updated", handleRoundUpdated);
      socket.off("judging:assignments_updated", handleAssignmentsUpdated);
      socket.off("judging:criteria_updated", handleCriteriaUpdated);
      socket.off("judging:judge_status_changed", handleJudgeStatusChanged);
      socket.off("connect", handleSocketConnect);
      leaveJudgingRoom();
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [loadData, judge]);

  const handleLogout = () => {
    logout();
    navigate("/judge/login");
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teamCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-300">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {switchBannerText && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/50"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{switchBannerText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-950/40">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white">
                Crowd<span className="text-indigo-400">Pulse</span>
              </span>
              <span className="ml-2 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Judge Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white">{judge?.name || "Official Judge"}</p>
              <p className="text-[11px] font-mono text-slate-400">@{judge?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all text-xs font-semibold flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Deactivated Notice if Disabled */}
        {isJudgeDisabled && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3 shadow-lg shadow-rose-950/20">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs">Judge Account Disabled</p>
              <p className="text-[11px] text-rose-300/80">
                Your judge account has been deactivated by the administrator. Evaluations and submissions are currently blocked.
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE ROUND DISPLAY CARD */}
        <div className="mb-6 p-5 rounded-2xl bg-[#0e131f] border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-indigo-400">
                  ACTIVE ROUND
                </span>
                {roundInfo?.isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE
                  </span>
                )}
                {roundInfo?.evaluationMode && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {roundInfo.evaluationMode === "assigned" ? "Assigned Only" : "All Teams"}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {roundInfo?.name || "No Active Judging Round"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Sync latest state with database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span>Sync Live</span>
            </button>
          </div>
        </div>

        {/* Welcome & Progress */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome, {judge?.name || "Judge"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Review assigned teams, score dynamic criteria, and submit your evaluations for the current active round.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-[#0e131f] border border-slate-800/80 shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
                  {stats.completed}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed</p>
                  <p className="text-xs font-bold text-slate-200">{stats.completed} / {stats.total} Teams</p>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-[#0e131f] border border-slate-800/80 shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">
                  {stats.pending}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending</p>
                  <p className="text-xs font-bold text-slate-200">{stats.pending} Teams Left</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 p-4 rounded-2xl bg-[#0e131f] border border-slate-800/80">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-300">Judging Completion</span>
              <span className="font-mono text-indigo-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800 flex">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or project..."
              className="w-full pl-9 pr-3.5 py-2 bg-[#0e131f] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e131f] border border-slate-800/80 self-start sm:self-auto overflow-x-auto max-w-full">
            {(["ALL", "PENDING", "DRAFT", "SUBMITTED"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === filter
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {filter === "ALL" ? `All (${stats.total})` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Switching Transition Skeleton */}
        {isSwitching ? (
          <div className="py-16 text-center border border-dashed border-indigo-500/30 rounded-3xl bg-[#0c1017]/70 flex flex-col items-center justify-center animate-pulse">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Switching Judging Round...</h3>
            <p className="text-xs text-indigo-300 font-mono">
              Loading active round teams and criteria from database
            </p>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading assigned teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0c1017]/40">
            <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">No teams found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? "Try clearing your search query" : "No teams are currently assigned to your evaluation roster in this round."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeams.map((team) => {
              const isCompleted = team.status === "SUBMITTED";
              const isDraft = team.status === "DRAFT";

              return (
                <motion.div
                  key={team.id || team._id}
                  whileHover={{ y: -2 }}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCompleted
                      ? "bg-[#0e131f]/90 border-emerald-500/20 hover:border-emerald-500/40"
                      : isDraft
                      ? "bg-[#0e131f]/90 border-amber-500/20 hover:border-amber-500/40"
                      : "bg-[#0e131f]/90 border-slate-800/80 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {team.teamCode}
                      </span>
                      <h3 className="text-base font-black text-white mt-1.5 tracking-tight">
                        {team.teamName}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {team.totalScore !== null ? `${team.totalScore} pts` : "Submitted"}
                      </span>
                    ) : isDraft ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                        <FileEdit className="w-3.5 h-3.5" />
                        Draft ({team.draftScore ?? 0} pts)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-indigo-300 font-semibold mb-1 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                      {team.projectName}
                    </p>
                    {team.members && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 line-clamp-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        {team.members}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {isCompleted ? "Evaluation submitted" : isDraft ? "Unfinished draft saved" : "Awaiting evaluation"}
                    </span>
                    <Link
                      to={`/judge/evaluate/${team.id || team._id}`}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        isJudgeDisabled
                          ? "opacity-50 pointer-events-none bg-slate-800 text-slate-500"
                          : isCompleted
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                          : isDraft
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-950/40"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40"
                      }`}
                    >
                      <span>{isCompleted ? "View Evaluation" : isDraft ? "Continue Draft" : "Evaluate Team"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Users,
  Award,
  Sliders,
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  Lock,
  Unlock,
  Copy,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Eye,
  ArrowLeft,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  ShieldCheck,
  Trophy,
  Database,
  Globe,
  Wifi,
  Download,
  RadioTower,
  X,
  FolderOpen,
} from "lucide-react";
import { api } from "../../services/api";
import {
  JudgingRound,
  Judge,
  JudgingTeam,
  JudgingCriterion,
  JudgeAssignment,
  JudgingOverviewData,
  JudgingResultsData,
  TeamScoreDetailData,
} from "../../types/judging";

type AdminTab = "overview" | "judges" | "teams" | "criteria" | "assignments" | "results" | "settings";

export const JudgingAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getId = (item: any): string => (item ? item.id || item._id || "" : "");

  // Rounds state
  const [rounds, setRounds] = useState<JudgingRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundDesc, setNewRoundDesc] = useState("");

  // Data states for current round
  const [overviewData, setOverviewData] = useState<JudgingOverviewData | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [teams, setTeams] = useState<JudgingTeam[]>([]);
  const [criteria, setCriteria] = useState<JudgingCriterion[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [resultsData, setResultsData] = useState<JudgingResultsData | null>(null);

  // Modals & form states
  const [showCreateJudgeModal, setShowCreateJudgeModal] = useState(false);
  const [newJudgeName, setNewJudgeName] = useState("");
  const [newJudgeUsername, setNewJudgeUsername] = useState("");
  const [newJudgePassword, setNewJudgePassword] = useState("");
  const [newJudgeWeight, setNewJudgeWeight] = useState(1.0);
  const [newJudgePriority, setNewJudgePriority] = useState(1);
  const [createdJudgeCreds, setCreatedJudgeCreds] = useState<{ username: string; password: string } | null>(null);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamProject, setTeamProject] = useState("");
  const [teamMembers, setTeamMembers] = useState("");

  const [showCriterionModal, setShowCriterionModal] = useState(false);
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [criterionName, setCriterionName] = useState("");
  const [criterionMaxScore, setCriterionMaxScore] = useState(20);
  const [criterionDesc, setCriterionDesc] = useState("");

  // Team detail breakdown modal
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<TeamScoreDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // External DB Import state (admin-provided any MongoDB URI)
  const [showExternalDbModal, setShowExternalDbModal] = useState(false);
  const [extDbStep, setExtDbStep] = useState<"connect" | "preview" | "importing">("connect");
  const [extDbUri, setExtDbUri] = useState("");
  const [extDbName, setExtDbName] = useState("");
  const [extDbConnecting, setExtDbConnecting] = useState(false);
  const [extDbCollections, setExtDbCollections] = useState<string[]>([]);
  const [extDbSelectedCollection, setExtDbSelectedCollection] = useState("");
  const [extDbPreviewing, setExtDbPreviewing] = useState(false);
  const [extDbPreviewTeams, setExtDbPreviewTeams] = useState<any[]>([]);
  const [extDbImportingIds, setExtDbImportingIds] = useState<Set<number>>(new Set());
  const [extDbImportedIds, setExtDbImportedIds] = useState<Set<number>>(new Set());
  const [extDbError, setExtDbError] = useState<string | null>(null);
  const [extDbTeamCodePrefix, setExtDbTeamCodePrefix] = useState("EXT");
  const [extDbConnected, setExtDbConnected] = useState(false);
  const [extDbResolvedDb, setExtDbResolvedDb] = useState<string>("");

  // Copied alert helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Load rounds initially
  const loadRounds = async () => {
    try {
      const data = await api.get("/judging/rounds");
      setRounds(data || []);
      if (data && data.length > 0 && !selectedRoundId) {
        setSelectedRoundId(data[0].id || data[0]._id);
      }
    } catch (err: any) {
      console.error("[Judging] Failed to load judging rounds:", err);
      const msg = err?.message && err.message !== "Request failed"
        ? err.message
        : "Unable to load judging rounds. Please check the server connection.";
      setError(msg);
    }
  };

  useEffect(() => {
    loadRounds();
  }, []);

  // Load round-specific data when selectedRoundId or activeTab changes
  const loadRoundData = async () => {
    if (!selectedRoundId) return;
    setLoading(true);
    setError(null);

    try {
      if (activeTab === "overview") {
        const data = await api.get(`/judging/rounds/${selectedRoundId}/overview`);
        setOverviewData(data);
      } else if (activeTab === "judges") {
        const data = await api.get(`/judging/judges?roundId=${selectedRoundId}`);
        setJudges(data || []);
      } else if (activeTab === "teams") {
        const data = await api.get(`/judging/rounds/${selectedRoundId}/teams`);
        setTeams(data || []);
      } else if (activeTab === "criteria") {
        const data = await api.get(`/judging/rounds/${selectedRoundId}/criteria`);
        setCriteria(data || []);
      } else if (activeTab === "assignments") {
        const [teamsRes, judgesRes, assignRes] = await Promise.all([
          api.get(`/judging/rounds/${selectedRoundId}/teams`),
          api.get(`/judging/judges?roundId=${selectedRoundId}`),
          api.get(`/judging/rounds/${selectedRoundId}/assignments`),
        ]);
        setTeams(teamsRes || []);
        setJudges(judgesRes || []);
        setAssignments(assignRes || []);
      } else if (activeTab === "results") {
        const data = await api.get(`/judging/rounds/${selectedRoundId}/results`);
        setResultsData(data);
      }
    } catch (err: any) {
      console.error("[Judging] Failed to load judging data:", err);
      const msg = err?.message && err.message !== "Request failed"
        ? err.message
        : "Unable to load judging data. Please check the server connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoundData();
  }, [selectedRoundId, activeTab]);

  const currentRound = rounds.find((r) => (r.id || r._id) === selectedRoundId);

  // Toggle lock
  const handleToggleLock = async () => {
    if (!selectedRoundId) return;
    try {
      const res = await api.post(`/judging/rounds/${selectedRoundId}/toggle-lock`, {});
      setRounds((prev) =>
        prev.map((r) =>
          (r.id || r._id) === selectedRoundId
            ? { ...r, isLocked: res.isLocked, status: res.status }
            : r
        )
      );
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadRoundData();
    } catch (err: any) {
      setError(err.message || "Failed to toggle round lock");
    }
  };

  // Create new round
  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoundName.trim()) return;

    try {
      const newRound = await api.post("/judging/rounds", {
        name: newRoundName.trim(),
        description: newRoundDesc.trim(),
      });
      setRounds((prev) => [newRound, ...prev]);
      setSelectedRoundId(newRound.id || newRound._id);
      setShowCreateRoundModal(false);
      setNewRoundName("");
      setNewRoundDesc("");
      setSuccessMsg("New judging round created successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create round");
    }
  };

  // Create judge
  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeName.trim() || !newJudgeUsername.trim()) return;

    try {
      const res = await api.post("/judging/judges", {
        name: newJudgeName.trim(),
        username: newJudgeUsername.trim(),
        password: newJudgePassword.trim() || undefined,
        weight: Number(newJudgeWeight) || 1.0,
        tieBreakPriority: Number(newJudgePriority) || 1,
        roundId: selectedRoundId,
      });

      setJudges((prev) => [...prev, res.judge]);
      setCreatedJudgeCreds({
        username: res.judge.username,
        password: res.plainPassword,
      });
      setNewJudgeName("");
      setNewJudgeUsername("");
      setNewJudgePassword("");
      setNewJudgeWeight(1.0);
      setNewJudgePriority(judges.length + 2);
    } catch (err: any) {
      setError(err.message || "Failed to create judge");
    }
  };

  // Toggle judge active/disabled
  const handleToggleJudgeStatus = async (judgeId: string) => {
    try {
      const res = await api.post(`/judging/judges/${judgeId}/toggle-status`, {});
      setJudges((prev) =>
        prev.map((j) => ((j.id || j._id) === judgeId ? { ...j, status: res.status } : j))
      );
    } catch (err: any) {
      setError(err.message || "Failed to update judge status");
    }
  };

  // Regenerate judge password
  const handleRegenPassword = async (judgeId: string) => {
    try {
      const res = await api.post(`/judging/judges/${judgeId}/regenerate-password`, {});
      setCreatedJudgeCreds({
        username: res.username,
        password: res.newPassword,
      });
      setSuccessMsg(`Password regenerated for ${res.username}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to regenerate password");
    }
  };

  // Delete judge
  const handleDeleteJudge = async (judgeId: string) => {
    if (!confirm("Are you sure you want to delete this judge? Any existing evaluations will be removed.")) return;
    try {
      await api.delete(`/judging/judges/${judgeId}`);
      setJudges((prev) => prev.filter((j) => (j.id || j._id) !== judgeId));
    } catch (err: any) {
      setError(err.message || "Failed to delete judge");
    }
  };

  // Team Create / Edit
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamProject.trim()) return;

    try {
      if (editingTeamId) {
        const updated = await api.patch(`/judging/teams/${editingTeamId}`, {
          teamCode: teamCode.trim(),
          teamName: teamName.trim(),
          projectName: teamProject.trim(),
          members: teamMembers.trim(),
        });
        setTeams((prev) => prev.map((t) => ((t.id || t._id) === editingTeamId ? updated : t)));
      } else {
        const created = await api.post(`/judging/rounds/${selectedRoundId}/teams`, {
          teamCode: teamCode.trim() || undefined,
          teamName: teamName.trim(),
          projectName: teamProject.trim(),
          members: teamMembers.trim(),
        });
        setTeams((prev) => [...prev, created]);
      }
      setShowTeamModal(false);
      setEditingTeamId(null);
      setTeamCode("");
      setTeamName("");
      setTeamProject("");
      setTeamMembers("");
    } catch (err: any) {
      setError(err.message || "Failed to save team");
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Delete this team and its evaluations?")) return;
    try {
      await api.delete(`/judging/teams/${teamId}`);
      setTeams((prev) => prev.filter((t) => (t.id || t._id) !== teamId));
    } catch (err: any) {
      setError(err.message || "Failed to delete team");
    }
  };

  // Delete round
  const handleDeleteRound = async () => {
    if (!selectedRoundId || !currentRound) return;
    if (!confirm(`Delete round "${currentRound.name}" and ALL its teams, criteria, assignments and evaluations? This CANNOT be undone.`)) return;
    try {
      await api.delete(`/judging/rounds/${selectedRoundId}`);
      const remaining = rounds.filter((r) => (r.id || r._id) !== selectedRoundId);
      setRounds(remaining);
      setSelectedRoundId(remaining.length > 0 ? (remaining[0].id || remaining[0]._id || "") : "");
      setSuccessMsg("Round deleted successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete round");
    }
  };

  // Set active round (broadcasts to judges via socket)
  const handleSetActiveRound = async () => {
    if (!selectedRoundId || !currentRound) return;
    if (!confirm(`Switch active judging round to "${currentRound.name}"? All connected judges will automatically switch to this round in real-time.`)) return;
    try {
      const res = await api.post(`/judging/rounds/${selectedRoundId}/set-active`, {});
      // Update rounds status locally
      setRounds((prev) => prev.map((r) => ({
        ...r,
        status: (r.id || r._id) === selectedRoundId ? "active" : (r.isLocked ? r.status : "draft"),
      })));
      setSuccessMsg(res.message || `Round "${currentRound.name}" is now ACTIVE. All judges notified!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to set active round");
    }
  };

  // Helper to extract database name from URI
  const extractDbNameFromUri = (uri: string): string | null => {
    try {
      const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?/\s]+)/i);
      if (match && match[1]) {
        const db = decodeURIComponent(match[1]).trim();
        if (db) return db;
      }
    } catch {
      // fallback
    }
    return null;
  };

  // External DB Import handlers
  const handleExtDbConnect = async () => {
    if (!extDbUri.trim()) {
      setExtDbError("Please enter a MongoDB connection URI.");
      return;
    }

    const dbInUri = extractDbNameFromUri(extDbUri.trim());
    if (!extDbName.trim() && !dbInUri) {
      setExtDbError("Please enter the database name before connecting.");
      return;
    }

    setExtDbConnecting(true);
    setExtDbError(null);
    setExtDbCollections([]);
    setExtDbPreviewTeams([]);
    setExtDbSelectedCollection("");
    setExtDbConnected(false);

    try {
      const res = await api.post("/judging/external-db/connect", {
        uri: extDbUri.trim(),
        dbName: extDbName.trim() || undefined,
      });

      const cols = res.collections || [];
      const resolved = res.dbName || extDbName.trim() || dbInUri || "";
      setExtDbResolvedDb(resolved);
      if (resolved && !extDbName.trim()) {
        setExtDbName(resolved);
      }
      setExtDbCollections(cols);
      setExtDbConnected(true);
      setExtDbStep("preview");
      if (cols.length > 0) {
        setExtDbSelectedCollection(cols[0]);
      }
    } catch (err: any) {
      setExtDbError(err.message || "Failed to connect to external database.");
      setExtDbConnected(false);
    } finally {
      setExtDbConnecting(false);
    }
  };

  const handleExtDbPreview = async () => {
    if (!extDbSelectedCollection) return;
    setExtDbPreviewing(true);
    setExtDbError(null);
    setExtDbPreviewTeams([]);
    setExtDbImportedIds(new Set());
    try {
      const res = await api.post("/judging/external-db/preview", {
        uri: extDbUri.trim(),
        dbName: extDbName.trim() || undefined,
        collection: extDbSelectedCollection,
      });
      setExtDbPreviewTeams(res.teams || []);
    } catch (err: any) {
      setExtDbError(err.message || "Failed to preview teams from collection.");
    } finally {
      setExtDbPreviewing(false);
    }
  };

  const handleImportOneTeam = async (team: any, idx: number) => {
    if (!selectedRoundId) return;
    setExtDbImportingIds((prev) => new Set([...prev, idx]));
    try {
      const imported = await api.post(`/judging/rounds/${selectedRoundId}/teams/import-one`, {
        teamName: team.teamName,
        projectName: team.projectName,
        members: team.members,
        memberDetails: team.memberDetails,
        teamCodePrefix: extDbTeamCodePrefix || "EXT",
      });
      setExtDbImportedIds((prev) => new Set([...prev, idx]));
      setTeams((prev) => {
        const exists = prev.some((t) => (t.id || t._id) === (imported.id || imported._id));
        return exists ? prev : [...prev, imported];
      });
    } catch (err: any) {
      setExtDbError(err.message || "Failed to import team.");
    } finally {
      setExtDbImportingIds((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    }
  };

  const handleOpenExternalDbModal = () => {
    setShowExternalDbModal(true);
    setExtDbStep("connect");
    setExtDbCollections([]);
    setExtDbPreviewTeams([]);
    setExtDbSelectedCollection("");
    setExtDbError(null);
    setExtDbConnected(false);
    setExtDbResolvedDb("");
    setExtDbImportingIds(new Set());
    setExtDbImportedIds(new Set());
  };

  // Criteria Create / Edit
  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criterionName.trim()) return;

    try {
      if (editingCriterionId) {
        const updated = await api.patch(`/judging/criteria/${editingCriterionId}`, {
          name: criterionName.trim(),
          maxScore: Number(criterionMaxScore) || 20,
          description: criterionDesc.trim(),
        });
        setCriteria((prev) => prev.map((c) => ((c.id || c._id) === editingCriterionId ? updated : c)));
      } else {
        const created = await api.post(`/judging/rounds/${selectedRoundId}/criteria`, {
          name: criterionName.trim(),
          maxScore: Number(criterionMaxScore) || 20,
          description: criterionDesc.trim(),
        });
        setCriteria((prev) => [...prev, created]);
      }
      setShowCriterionModal(false);
      setEditingCriterionId(null);
      setCriterionName("");
      setCriterionMaxScore(20);
      setCriterionDesc("");
    } catch (err: any) {
      setError(err.message || "Failed to save criterion");
    }
  };

  const handleDeleteCriterion = async (cId: string) => {
    if (!confirm("Delete this judging criterion?")) return;
    try {
      await api.delete(`/judging/criteria/${cId}`);
      setCriteria((prev) => prev.filter((c) => (c.id || c._id) !== cId));
    } catch (err: any) {
      setError(err.message || "Failed to delete criterion");
    }
  };

  // Assignments Matrix
  const isAssigned = (teamId: string, judgeId: string) => {
    return assignments.some(
      (a) => a.teamId.toString() === teamId && a.judgeId.toString() === judgeId
    );
  };

  const handleToggleAssignment = (teamId: string, judgeId: string) => {
    setAssignments((prev) => {
      const exists = prev.some(
        (a) => a.teamId.toString() === teamId && a.judgeId.toString() === judgeId
      );
      if (exists) {
        return prev.filter(
          (a) => !(a.teamId.toString() === teamId && a.judgeId.toString() === judgeId)
        );
      } else {
        return [...prev, { id: "", roundId: selectedRoundId, judgeId, teamId }];
      }
    });
  };

  const handleAssignAll = () => {
    const all: JudgeAssignment[] = [];
    for (const t of teams) {
      for (const j of judges) {
        all.push({
          id: "",
          roundId: selectedRoundId,
          teamId: getId(t),
          judgeId: getId(j),
        });
      }
    }
    setAssignments(all);
  };

  const handleClearAllAssignments = () => {
    setAssignments([]);
  };

  const handleSaveAssignments = async () => {
    try {
      await api.post(`/judging/rounds/${selectedRoundId}/assignments`, {
        assignments: assignments.map((a) => ({
          teamId: a.teamId,
          judgeId: a.judgeId,
        })),
      });
      setSuccessMsg("Assignments saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save assignments");
    }
  };

  // View Team Score Detail
  const handleViewTeamDetail = async (teamId: string) => {
    setLoadingDetail(true);
    setSelectedTeamDetail(null);
    try {
      const data = await api.get(`/judging/teams/${teamId}/details`);
      setSelectedTeamDetail(data);
    } catch (err: any) {
      setError(err.message || "Failed to load team score details");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Settings Save
  const handleSaveSettings = async (evalMode: "all" | "assigned", allowEdit: boolean) => {
    try {
      const updated = await api.patch(`/judging/rounds/${selectedRoundId}`, {
        evaluationMode: evalMode,
        allowJudgeEditAfterSubmit: allowEdit,
      });
      setRounds((prev) => prev.map((r) => ((r.id || r._id) === selectedRoundId ? updated : r)));
      setSuccessMsg("Judging settings updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-300">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Events</span>
            </Link>

            <div className="w-px h-5 bg-slate-800" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-950/40">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight text-white">
                Judging <span className="text-indigo-400">& Hackathons</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Round Selector Dropdown */}
            <div className="flex items-center gap-2 bg-[#080c14] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider">Round:</span>
              <select
                value={selectedRoundId}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold"
              >
                {rounds.length === 0 ? (
                  <option value="" className="bg-[#0e131f] text-slate-400">
                    No Rounds Yet
                  </option>
                ) : (
                  rounds.map((r) => (
                    <option key={r.id || r._id} value={r.id || r._id} className="bg-[#0e131f] text-white">
                      {r.name} {r.isLocked ? "🔒" : ""} {r.status === "active" ? "✅" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={() => setShowCreateRoundModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Create New Round"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Round</span>
            </button>

            {/* Active Round Status Badge or Set Active Button */}
            {currentRound && currentRound.status === "active" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE ROUND
              </span>
            ) : currentRound && (
              <button
                onClick={handleSetActiveRound}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40 transition-all"
                title="Set as active round — switches all judges in real-time"
              >
                <RadioTower className="w-3.5 h-3.5" />
                <span>Set Active</span>
              </button>
            )}

            {/* Lock / Unlock Toggle Button */}
            {currentRound && (
              <button
                onClick={handleToggleLock}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                  currentRound.isLocked
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                }`}
              >
                {currentRound.isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>LOCKED</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>OPEN</span>
                  </>
                )}
              </button>
            )}

            {/* Delete Round */}
            {currentRound && (
              <button
                onClick={handleDeleteRound}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                title="Delete this round (irreversible)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Zero State if No Rounds */}
        {rounds.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-[#0c1017]/40 max-w-xl mx-auto p-8 my-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white">No Judging Rounds Yet</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
              Create your first round (e.g. "Round 1: Preliminary" or "Hackathon Finals") to begin configuring judges, teams, and dynamic evaluation criteria.
            </p>
            <button
              onClick={() => setShowCreateRoundModal(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Judging Round</span>
            </button>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="border-b border-slate-800 mb-6 flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "judges", label: "Judges", icon: Users },
                { id: "teams", label: "Teams", icon: Award },
                { id: "criteria", label: "Criteria", icon: Sliders },
                { id: "assignments", label: "Assignments", icon: CheckSquare },
                { id: "results", label: "Results & Rankings", icon: Trophy },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

        {/* ========================================================= */}
        {/* TAB: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {overviewData && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800">
                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Teams</p>
                    <p className="text-2xl font-black text-white mt-1 font-mono">{overviewData.stats.totalTeams}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800">
                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Active Judges</p>
                    <p className="text-2xl font-black text-indigo-400 mt-1 font-mono">{overviewData.stats.totalJudges}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800">
                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Expected Evals</p>
                    <p className="text-2xl font-black text-slate-300 mt-1 font-mono">{overviewData.stats.expectedEvaluations}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800">
                    <p className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">Submitted</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{overviewData.stats.submittedEvaluations}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800">
                    <p className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">Pending</p>
                    <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{overviewData.stats.pendingEvaluations}</p>
                  </div>
                </div>

                {/* Progress Bar Card */}
                <div className="p-6 rounded-2xl bg-[#0e131f] border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Overall Judging Progress</h3>
                    <span className="font-mono text-indigo-400 font-bold text-sm">
                      {overviewData.stats.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${overviewData.stats.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Judge-by-Judge Progress Breakdown */}
                <div className="p-6 rounded-2xl bg-[#0e131f] border border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Judge Progress Roster
                  </h3>

                  <div className="space-y-3">
                    {overviewData.judgeProgress.map((jp) => {
                      const percent = jp.assignedCount > 0
                        ? Math.round((jp.submittedCount / jp.assignedCount) * 100)
                        : 0;

                      return (
                        <div
                          key={jp.id}
                          className="p-4 rounded-xl bg-[#080c14] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{jp.name}</h4>
                              <span className="font-mono text-[11px] text-slate-500">@{jp.username}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                                Weight: {jp.weight}x
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                                Tie-Break: #{jp.tieBreakPriority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {jp.submittedCount} of {jp.assignedCount} evaluated ({jp.pendingCount} pending, {jp.draftCount} draft)
                            </p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-56">
                            <div className="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div
                                className={`h-full ${jp.isComplete ? "bg-emerald-400" : "bg-indigo-500"}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-300 w-10 text-right">
                              {percent}%
                            </span>
                            {jp.isComplete && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: JUDGES */}
        {/* ========================================================= */}
        {activeTab === "judges" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">Judge Management</h2>
                <p className="text-xs text-slate-400">Configure judge credentials, score weights, and tie-break priority.</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateJudgeModal(true);
                  setNewJudgePriority(judges.length + 1);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Create Judge</span>
              </button>
            </div>

            {/* Created Judge Credentials Card */}
            {createdJudgeCreds && (
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Credentials Ready to Share
                  </h4>
                  <p className="text-xs text-slate-300 font-mono">
                    Username: <strong className="text-white">{createdJudgeCreds.username}</strong> | Password:{" "}
                    <strong className="text-white">{createdJudgeCreds.password}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Judge Portal: ${window.location.origin}/judge/login\nUsername: ${createdJudgeCreds.username}\nPassword: ${createdJudgeCreds.password}`,
                        "creds"
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedKey === "creds" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "creds" ? "Copied!" : "Copy Details"}</span>
                  </button>
                  <button
                    onClick={() => setCreatedJudgeCreds(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Judges Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e131f]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080c14] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Judge Name</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Score Weight</th>
                    <th className="p-4">Tie-Break</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {judges.map((j) => (
                    <tr key={j.id || j._id} className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-white">{j.name}</td>
                      <td className="p-4 font-mono text-slate-400">@{j.username}</td>
                      <td className="p-4 font-mono text-indigo-400 font-bold">{j.weight}x</td>
                      <td className="p-4 font-mono text-purple-400 font-bold">#{j.tieBreakPriority}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            j.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {j.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleRegenPassword(getId(j))}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                          title="Generate new password"
                        >
                          Regen Pass
                        </button>
                        <button
                          onClick={() => handleToggleJudgeStatus(getId(j))}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                        >
                          {j.status === "active" ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDeleteJudge(getId(j))}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: TEAMS */}
        {/* ========================================================= */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-lg font-black text-white">Teams ({teams.length})</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-mono font-semibold">
                    <Globe className="w-3 h-3 text-indigo-400" />
                    External DB & Custom Teams
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Evaluation teams for this judging round. Import directly from any external MongoDB database or create manually.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={handleOpenExternalDbModal}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                  title="Connect to any MongoDB URI and import teams one-by-one"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Import from External DB</span>
                </button>

                <button
                  onClick={() => {
                    setEditingTeamId(null);
                    setTeamCode(`TEAM-${String(teams.length + 1).padStart(3, "0")}`);
                    setTeamName("");
                    setTeamProject("");
                    setTeamMembers("");
                    setShowTeamModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-950/40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Team</span>
                </button>
              </div>
            </div>

            {/* Empty State when no teams yet */}
            {teams.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-[#0c1017]/50 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-950/20">
                  <Database className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No Teams in this Round Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mb-5">
                  Import teams directly from any external MongoDB database or add them manually.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenExternalDbModal}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Import from External DB</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingTeamId(null);
                      setTeamCode("TEAM-001");
                      setTeamName("");
                      setTeamProject("");
                      setTeamMembers("");
                      setShowTeamModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Manually</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((t) => {
                  const isCodecraftTeam = t.teamCode?.startsWith("CC-");
                  return (
                    <div
                      key={t.id || t._id}
                      className="p-5 rounded-2xl bg-[#0e131f] border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                              {t.teamCode}
                            </span>
                            {isCodecraftTeam && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                CodeCraft
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingTeamId(getId(t));
                                setTeamCode(t.teamCode);
                                setTeamName(t.teamName);
                                setTeamProject(t.projectName);
                                setTeamMembers(t.members || "");
                                setShowTeamModal(true);
                              }}
                              className="p-1 text-slate-500 hover:text-indigo-400"
                              title="Edit team"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(getId(t))}
                              className="p-1 text-slate-500 hover:text-rose-400"
                              title="Delete team"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-black text-white">{t.teamName}</h3>
                        <p className="text-xs font-semibold text-indigo-300 mt-1">{t.projectName}</p>
                        {t.members && <p className="text-[11px] text-slate-400 mt-2 line-clamp-3">{t.members}</p>}
                      </div>

                      <div className="pt-3 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => handleViewTeamDetail(getId(t))}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Scores</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: CRITERIA */}
        {/* ========================================================= */}
        {activeTab === "criteria" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">Evaluation Criteria</h2>
                <p className="text-xs text-slate-400">
                  Total Maximum Score:{" "}
                  <strong className="text-indigo-400 font-mono text-sm">
                    {criteria.reduce((sum, c) => sum + (c.maxScore || 0), 0)} pts
                  </strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCriterionId(null);
                  setCriterionName("");
                  setCriterionMaxScore(20);
                  setCriterionDesc("");
                  setShowCriterionModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Add Criterion</span>
              </button>
            </div>

            <div className="space-y-3">
              {criteria.map((c, idx) => (
                <div
                  key={c.id || c._id}
                  className="p-4 rounded-2xl bg-[#0e131f] border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
                      Max: {c.maxScore} pts
                    </span>
                    <button
                      onClick={() => {
                        setEditingCriterionId(getId(c));
                        setCriterionName(c.name);
                        setCriterionMaxScore(c.maxScore);
                        setCriterionDesc(c.description || "");
                        setShowCriterionModal(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCriterion(getId(c))}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: ASSIGNMENTS MATRIX */}
        {/* ========================================================= */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">Judge & Team Assignments Matrix</h2>
                <p className="text-xs text-slate-400">
                  Select which judges evaluate each team. (Applies if evaluation mode is set to 'Assign specific judges').
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAssignAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Assign All
                </button>
                <button
                  onClick={handleClearAllAssignments}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Clear All
                </button>
                <button
                  onClick={handleSaveAssignments}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/40"
                >
                  Save Assignments
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e131f]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080c14] border-b border-slate-800 text-slate-400 font-bold">
                  <tr>
                    <th className="p-4">Team</th>
                    {judges.map((j) => (
                      <th key={j.id || j._id} className="p-4 text-center">
                        <p className="text-white">{j.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono font-normal">@{j.username}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teams.map((t) => (
                    <tr key={t.id || t._id} className="hover:bg-slate-900/40">
                      <td className="p-4">
                        <span className="font-mono text-[11px] text-indigo-400 font-bold block">{t.teamCode}</span>
                        <span className="font-bold text-white">{t.teamName}</span>
                      </td>
                      {judges.map((j) => {
                        const tId = getId(t);
                        const jId = getId(j);
                        const assigned = isAssigned(tId, jId);

                        return (
                          <td key={jId} className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={assigned}
                              onChange={() => handleToggleAssignment(tId, jId)}
                              className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: RESULTS & RANKINGS */}
        {/* ========================================================= */}
        {activeTab === "results" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Official Final Rankings & Score Breakdown
                </h2>
                <p className="text-xs text-slate-400">
                  Scores calculated server-side using configured weights and tie-break priority.
                </p>
              </div>
            </div>

            {resultsData && (
              <>
                {/* Top 3 Podium (if >= 3 teams scored) */}
                {resultsData.results.filter((r) => r.finalWeightedScore !== null).length >= 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {/* 2nd Place */}
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-[#0e131f] border border-slate-700/60 text-center order-2 sm:order-1 flex flex-col justify-between">
                      <div>
                        <span className="text-3xl mb-1 block">🥈</span>
                        <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">2nd Place</span>
                        <h4 className="text-base font-black text-white mt-1">{resultsData.results[1]?.teamName}</h4>
                        <p className="text-xs text-indigo-300">{resultsData.results[1]?.projectName}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-700/40">
                        <span className="font-mono text-xl font-black text-slate-200">
                          {resultsData.results[1]?.finalWeightedScore} pts
                        </span>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/20 via-[#0e131f] to-[#0e131f] border border-amber-500/40 text-center order-1 sm:order-2 shadow-xl shadow-amber-950/20 flex flex-col justify-between">
                      <div>
                        <span className="text-4xl mb-1 block">🥇</span>
                        <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">Champion</span>
                        <h4 className="text-lg font-black text-white mt-1">{resultsData.results[0]?.teamName}</h4>
                        <p className="text-xs text-amber-300 font-semibold">{resultsData.results[0]?.projectName}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-amber-500/20">
                        <span className="font-mono text-2xl font-black text-amber-300">
                          {resultsData.results[0]?.finalWeightedScore} pts
                        </span>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-900/20 to-[#0e131f] border border-amber-800/40 text-center order-3 flex flex-col justify-between">
                      <div>
                        <span className="text-3xl mb-1 block">🥉</span>
                        <span className="text-xs font-mono font-bold uppercase text-amber-600 tracking-wider">3rd Place</span>
                        <h4 className="text-base font-black text-white mt-1">{resultsData.results[2]?.teamName}</h4>
                        <p className="text-xs text-indigo-300">{resultsData.results[2]?.projectName}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-amber-900/30">
                        <span className="font-mono text-xl font-black text-amber-500">
                          {resultsData.results[2]?.finalWeightedScore} pts
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Complete Results Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e131f]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080c14] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4 w-16 text-center">Rank</th>
                        <th className="p-4">Team & Project</th>
                        {resultsData.judges.map((j) => (
                          <th key={j.id} className="p-4 text-center">
                            <span>{j.name}</span>
                            <span className="block text-[10px] text-slate-500 font-normal font-mono">
                              ({j.weight}x, #{j.tieBreakPriority})
                            </span>
                          </th>
                        ))}
                        <th className="p-4 text-right">Final Score</th>
                        <th className="p-4 text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {resultsData.results.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-900/40">
                          <td className="p-4 text-center font-mono font-black text-sm">
                            {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-[10px] font-bold text-indigo-400 block">{r.teamCode}</span>
                            <strong className="text-white text-sm block">{r.teamName}</strong>
                            <span className="text-slate-400 text-xs">{r.projectName}</span>
                          </td>
                          {resultsData.judges.map((j) => {
                            const scoreObj = r.judgeScores[j.id];
                            return (
                              <td key={j.id} className="p-4 text-center font-mono text-slate-300">
                                {scoreObj ? (
                                  <span className="font-bold text-white">{scoreObj.totalScore}</span>
                                ) : (
                                  <span className="text-slate-600">--</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-4 text-right">
                            {r.finalWeightedScore !== null ? (
                              <span className="font-mono text-base font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                                {r.finalWeightedScore}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono">Unrated</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleViewTeamDetail(r.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            >
                              Breakdown
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: SETTINGS */}
        {/* ========================================================= */}
        {activeTab === "settings" && currentRound && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">Judging Round Configuration</h2>
              <p className="text-xs text-slate-400">Configure evaluation rules, modes, and submission lock behavior.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0e131f] border border-slate-800 space-y-6">
              {/* Evaluation Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Evaluation Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-[#080c14] cursor-pointer hover:border-indigo-500/40">
                    <input
                      type="radio"
                      name="evalMode"
                      checked={currentRound.evaluationMode === "all"}
                      onChange={() => handleSaveSettings("all", currentRound.allowJudgeEditAfterSubmit)}
                      className="mt-1 accent-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">All judges evaluate all teams</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Every judge can view and score all registered teams in this round.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-[#080c14] cursor-pointer hover:border-indigo-500/40">
                    <input
                      type="radio"
                      name="evalMode"
                      checked={currentRound.evaluationMode === "assigned"}
                      onChange={() => handleSaveSettings("assigned", currentRound.allowJudgeEditAfterSubmit)}
                      className="mt-1 accent-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Assign specific judges to teams</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Judges can only see and score teams explicitly assigned in the Assignments tab.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Allow Edit After Submit */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Allow Judges to Edit Submitted Evaluations
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When OFF, once a judge clicks Submit, their evaluation is locked unless reopened by an Admin.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentRound.allowJudgeEditAfterSubmit}
                    onChange={(e) =>
                      handleSaveSettings(currentRound.evaluationMode, e.target.checked)
                    }
                    className="w-5 h-5 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Lock Judging Switch */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Freeze / Lock Round
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Prevent any new submissions or score changes across all judges.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleLock}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      currentRound.isLocked
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {currentRound.isLocked ? "Unlock Round" : "Lock Round"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CREATE ROUND */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showCreateRoundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e131f] border border-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-base font-black text-white mb-4">Create Judging Round</h3>
              <form onSubmit={handleCreateRound} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Round Name</label>
                  <input
                    type="text"
                    required
                    value={newRoundName}
                    onChange={(e) => setNewRoundName(e.target.value)}
                    placeholder="e.g. Round 2: Semi-Finals"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newRoundDesc}
                    onChange={(e) => setNewRoundDesc(e.target.value)}
                    placeholder="Brief description of this stage"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoundModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Create Round
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL: CREATE JUDGE */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showCreateJudgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e131f] border border-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-base font-black text-white mb-4">Add Official Judge</h3>
              <form onSubmit={handleCreateJudge} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Judge Name</label>
                  <input
                    type="text"
                    required
                    value={newJudgeName}
                    onChange={(e) => setNewJudgeName(e.target.value)}
                    placeholder="e.g. Dr. Rahul Sharma"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username / Judge ID</label>
                  <input
                    type="text"
                    required
                    value={newJudgeUsername}
                    onChange={(e) => setNewJudgeUsername(e.target.value)}
                    placeholder="e.g. judge01"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password (leave empty to auto-generate)
                  </label>
                  <input
                    type="text"
                    value={newJudgePassword}
                    onChange={(e) => setNewJudgePassword(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Score Weight</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={newJudgeWeight}
                      onChange={(e) => setNewJudgeWeight(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tie-Break Priority</label>
                    <input
                      type="number"
                      min={1}
                      value={newJudgePriority}
                      onChange={(e) => setNewJudgePriority(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateJudgeModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Create & Generate Creds
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT TEAM */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showTeamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e131f] border border-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-base font-black text-white mb-4">
                {editingTeamId ? "Edit Team" : "Add Evaluation Team"}
              </h3>
              <form onSubmit={handleSaveTeam} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Team ID / Code</label>
                  <input
                    type="text"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    placeholder="e.g. TEAM-001"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. CodeStorm"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={teamProject}
                    onChange={(e) => setTeamProject(e.target.value)}
                    placeholder="e.g. Smart Agriculture Platform"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Members (Optional)</label>
                  <input
                    type="text"
                    value={teamMembers}
                    onChange={(e) => setTeamMembers(e.target.value)}
                    placeholder="e.g. Alice, Bob, Charlie"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Save Team
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CRITERION */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showCriterionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e131f] border border-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-base font-black text-white mb-4">
                {editingCriterionId ? "Edit Criterion" : "Add Evaluation Criterion"}
              </h3>
              <form onSubmit={handleSaveCriterion} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Criterion Name</label>
                  <input
                    type="text"
                    required
                    value={criterionName}
                    onChange={(e) => setCriterionName(e.target.value)}
                    placeholder="e.g. Technical Implementation"
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Maximum Score</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={criterionMaxScore}
                    onChange={(e) => setCriterionMaxScore(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Instructions</label>
                  <textarea
                    rows={3}
                    value={criterionDesc}
                    onChange={(e) => setCriterionDesc(e.target.value)}
                    placeholder="Explain what judges should look for in this category..."
                    className="w-full p-2.5 bg-[#080c14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCriterionModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Save Criterion
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL: TEAM SCORE DETAILS BREAKDOWN */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedTeamDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#0e131f] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {selectedTeamDetail.team.teamCode}
                  </span>
                  <h3 className="text-xl font-black text-white">{selectedTeamDetail.team.teamName}</h3>
                  <p className="text-xs text-slate-400">{selectedTeamDetail.team.projectName}</p>
                </div>
                <button
                  onClick={() => setSelectedTeamDetail(null)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              {/* Matrix Table: Criterion × Judge */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#080c14] mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th className="p-3">Criterion</th>
                      <th className="p-3 text-center">Max</th>
                      {selectedTeamDetail.judges.map((j) => (
                        <th key={j.id} className="p-3 text-center">
                          <span className="text-white">{j.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedTeamDetail.matrix.map((row) => (
                      <tr key={row.criterionId}>
                        <td className="p-3 font-semibold text-white">{row.criterionName}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{row.maxScore}</td>
                        {selectedTeamDetail.judges.map((j) => (
                          <td key={j.id} className="p-3 text-center font-mono font-bold text-indigo-300">
                            {row.scoresByJudge[j.id] !== undefined ? row.scoresByJudge[j.id] : "--"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900/80 border-t border-slate-800 font-bold">
                    <tr>
                      <td className="p-3 text-white uppercase text-[11px] tracking-wider">Total Evaluated</td>
                      <td className="p-3 text-center font-mono text-slate-400">
                        {selectedTeamDetail.criteria.reduce((s, c) => s + c.maxScore, 0)}
                      </td>
                      {selectedTeamDetail.judges.map((j) => {
                        const feedback = selectedTeamDetail.judgeFeedback.find(
                          (jf) => jf.judgeId.toString() === j.id.toString()
                        );
                        return (
                          <td key={j.id} className="p-3 text-center font-mono text-emerald-400 font-black">
                            {feedback ? `${feedback.totalScore} pts` : "--"}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Private Judge Comments */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Judge Remarks & Feedback
                </h4>
                {selectedTeamDetail.judgeFeedback.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No evaluations submitted yet.</p>
                ) : (
                  selectedTeamDetail.judgeFeedback.map((jf, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#080c14] border border-slate-800/80">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-indigo-300">{jf.judgeName}</span>
                        <span className="font-mono text-xs text-emerald-400 font-bold">{jf.totalScore} pts</span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">
                        {jf.comments ? jf.comments : <span className="text-slate-500 italic">No written comments provided.</span>}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL: EXTERNAL DB TEAM EXPLORER & IMPORTER */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showExternalDbModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-[#0e131f] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-black text-white">External MongoDB Team Importer</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Strictly Read-Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Connect to any MongoDB instance, preview teams, and import them one-by-one into the current round.
                  </p>
                </div>
                <button
                  onClick={() => setShowExternalDbModal(false)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Navigation Pills */}
              <div className="flex items-center gap-2 py-3 border-b border-slate-800/60 text-xs font-semibold">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    !extDbConnected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <span>1. Connect DB</span>
                </span>
                <span className="text-slate-600">→</span>
                <span
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                    extDbConnected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <span>2. Pick Collection & Preview</span>
                </span>
                {extDbPreviewTeams.length > 0 && (
                  <>
                    <span className="text-slate-600">→</span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {extDbPreviewTeams.length} Teams Ready
                    </span>
                  </>
                )}
              </div>

              {/* Error Alert */}
              {extDbError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{extDbError}</span>
                </div>
              )}

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {/* STEP 1: Connection Info */}
                <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-300">
                      MongoDB Connection URI:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setExtDbUri("mongodb+srv://codecraft:xCJ3Fger2jw6vDsX@cluster0.66pfalv.mongodb.net/?appName=Cluster0");
                        setExtDbName("codecraft");
                        setExtDbTeamCodePrefix("CC");
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-mono"
                    >
                      Use CodeCraft Cluster Preset
                    </button>
                  </div>
                  <input
                    type="text"
                    value={extDbUri}
                    onChange={(e) => setExtDbUri(e.target.value)}
                    placeholder="mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                        Database Name <span className="text-amber-400 font-normal">(Required if not in URI)</span>:
                      </label>
                      <input
                        type="text"
                        value={extDbName}
                        onChange={(e) => setExtDbName(e.target.value)}
                        placeholder="e.g. codecraft or hackathon"
                        className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        e.g. <strong className="text-slate-300 font-mono">codecraft</strong>. If your URI ends with <span className="font-mono text-slate-400">.net/?appName=...</span>, enter database name here.
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Team Code Prefix:
                      </label>
                      <input
                        type="text"
                        value={extDbTeamCodePrefix}
                        onChange={(e) => setExtDbTeamCodePrefix(e.target.value.toUpperCase())}
                        placeholder="e.g. EXT or CC"
                        className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleExtDbConnect}
                      disabled={extDbConnecting || !extDbUri.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-950/40 disabled:opacity-50 transition-all"
                    >
                      {extDbConnecting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Connecting & Reading Collections...</span>
                        </>
                      ) : (
                        <>
                          <Wifi className="w-3.5 h-3.5" />
                          <span>{extDbConnected ? "Re-Connect" : "Connect & List Collections"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Connection Success Feedback Banner */}
                {extDbConnected && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold">
                        Connected • {extDbCollections.length} collections found
                      </span>
                      {extDbResolvedDb && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                          db: {extDbResolvedDb}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: Collection Selection or Empty State */}
                {extDbConnected && (
                  extDbCollections.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#080c14] border border-slate-800 text-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                        <FolderOpen className="w-5 h-5 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-300">
                        Connected successfully, but this database contains no collections.
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Database <code className="text-indigo-400 font-mono">"{extDbResolvedDb || extDbName}"</code> was found, but does not contain any collections. Please check the database name and try again.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#080c14] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <span>Select Collection to Explore:</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                            {extDbCollections.length} available
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={extDbSelectedCollection}
                          onChange={(e) => setExtDbSelectedCollection(e.target.value)}
                          className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        >
                          <option value="">-- Choose a collection --</option>
                          {extDbCollections.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleExtDbPreview}
                          disabled={extDbPreviewing || !extDbSelectedCollection}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-950/40 disabled:opacity-50 transition-all"
                        >
                          {extDbPreviewing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Fetching Teams...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview Teams</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* STEP 3: Preview Teams & One-by-One Import */}
                {extDbPreviewTeams.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>
                        Found <strong className="text-white font-mono">{extDbPreviewTeams.length}</strong> teams in collection{" "}
                        <code className="text-indigo-300 font-mono">"{extDbSelectedCollection}"</code>:
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {extDbImportedIds.size} imported
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {extDbPreviewTeams.map((team, idx) => {
                        const isImporting = extDbImportingIds.has(idx);
                        const isImported = extDbImportedIds.has(idx);

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl bg-[#080c14] border transition-all ${
                              isImported
                                ? "border-emerald-500/40 bg-emerald-950/10"
                                : "border-slate-800/90 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                                    {team.teamCode || `${extDbTeamCodePrefix}-${String(idx + 1).padStart(3, "0")}`}
                                  </span>
                                  <h4 className="text-sm font-black text-white">{team.teamName}</h4>
                                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                    {team.memberCount || (team.members ? team.members.length : 0)} Members
                                  </span>
                                </div>
                                {team.projectName && (
                                  <p className="text-xs font-semibold text-indigo-300">
                                    Project: {team.projectName}
                                  </p>
                                )}
                              </div>

                              <div>
                                {isImported ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Added to Round</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleImportOneTeam(team, idx)}
                                    disabled={isImporting}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/40 disabled:opacity-50 transition-all"
                                  >
                                    {isImporting ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        <span>Adding...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add to Round</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Members Roster */}
                            {team.memberDetails && team.memberDetails.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60">
                                {team.memberDetails.map((member: any, mIdx: number) => (
                                  <div
                                    key={member.email || mIdx}
                                    className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-start justify-between gap-2 text-xs"
                                  >
                                    <div>
                                      <p className="font-bold text-slate-200 flex items-center gap-1.5">
                                        <span>{member.name}</span>
                                        {member.isLeader && (
                                          <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            Leader
                                          </span>
                                        )}
                                      </p>
                                      {member.email && (
                                        <p className="text-[10px] font-mono text-slate-400">{member.email}</p>
                                      )}
                                      {member.college && (
                                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{member.college}</p>
                                      )}
                                    </div>
                                    {member.branch && (
                                      <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                                        {member.branch}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Imported <strong className="text-emerald-400 font-mono">{extDbImportedIds.size}</strong> teams to this round.
                </p>
                <button
                  type="button"
                  onClick={() => setShowExternalDbModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

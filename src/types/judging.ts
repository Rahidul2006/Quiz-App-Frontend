export interface JudgingRound {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  eventId?: string | null;
  status: "draft" | "active" | "locked" | "completed";
  evaluationMode: "all" | "assigned";
  allowJudgeEditAfterSubmit: boolean;
  isLocked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Judge {
  id: string;
  _id?: string;
  name: string;
  username: string;
  weight: number;
  tieBreakPriority: number;
  status: "active" | "disabled";
  roundId?: string | null;
  role: "judge";
  createdAt?: string;
  updatedAt?: string;
}

export interface JudgingTeam {
  id: string;
  _id?: string;
  roundId: string;
  teamCode: string;
  teamName: string;
  projectName: string;
  members?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JudgingCriterion {
  id: string;
  _id?: string;
  roundId: string;
  name: string;
  maxScore: number;
  description?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JudgeAssignment {
  id: string;
  _id?: string;
  roundId: string;
  judgeId: string;
  teamId: string;
}

export interface CriterionScoreItem {
  criterionId: string;
  score: number;
}

export interface Evaluation {
  id?: string;
  _id?: string;
  roundId: string;
  judgeId: string;
  teamId: string;
  status: "DRAFT" | "SUBMITTED";
  criteriaScores: CriterionScoreItem[];
  totalScore: number;
  comments?: string;
  submittedAt?: string | null;
}

export interface JudgeProgressItem {
  id: string;
  name: string;
  username: string;
  weight: number;
  tieBreakPriority: number;
  assignedCount: number;
  submittedCount: number;
  draftCount: number;
  pendingCount: number;
  isComplete: boolean;
}

export interface JudgingOverviewData {
  round: {
    id: string;
    name: string;
    status: string;
    isLocked: boolean;
    evaluationMode: "all" | "assigned";
    allowJudgeEditAfterSubmit: boolean;
  };
  stats: {
    totalTeams: number;
    totalJudges: number;
    expectedEvaluations: number;
    submittedEvaluations: number;
    draftEvaluations: number;
    pendingEvaluations: number;
    progressPercent: number;
  };
  judgeProgress: JudgeProgressItem[];
}

export interface TeamResultItem {
  id: string;
  _id: string;
  teamCode: string;
  teamName: string;
  projectName: string;
  members?: string;
  evaluationsCount: number;
  judgeScores: Record<string, { totalScore: number; weight: number }>;
  finalWeightedScore: number | null;
  rank: number | string;
}

export interface JudgingResultsData {
  round: {
    id: string;
    name: string;
    isLocked: boolean;
    totalMaxScore: number;
  };
  judges: {
    id: string;
    name: string;
    username: string;
    weight: number;
    tieBreakPriority: number;
  }[];
  criteria: {
    id: string;
    name: string;
    maxScore: number;
  }[];
  results: TeamResultItem[];
}

export interface TeamScoreDetailData {
  team: JudgingTeam;
  round: JudgingRound | null;
  criteria: JudgingCriterion[];
  judges: {
    id: string;
    name: string;
    username: string;
    weight: number;
    tieBreakPriority: number;
  }[];
  matrix: {
    criterionId: string;
    criterionName: string;
    maxScore: number;
    scoresByJudge: Record<string, number>;
  }[];
  judgeFeedback: {
    judgeId: string;
    judgeName: string;
    totalScore: number;
    weight: number;
    comments: string;
    submittedAt?: string;
  }[];
}

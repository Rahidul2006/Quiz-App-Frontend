import React, { createContext, useContext, useState, useEffect } from "react";
import { judgeApi } from "../services/judgeApi";

export interface JudgeProfile {
  id: string;
  username: string;
  name: string;
  roundId?: string;
  weight?: number;
  tieBreakPriority?: number;
  status?: string;
}

interface JudgeAuthContextType {
  judge: JudgeProfile | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const JudgeAuthContext = createContext<JudgeAuthContextType | undefined>(undefined);

export const JudgeAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("crowdpulse_judge_token"));
  const [judge, setJudge] = useState<JudgeProfile | null>(() => {
    try {
      const saved = localStorage.getItem("crowdpulse_judge_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchJudge = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await judgeApi.get("/judge/me");
        if (data && data.judge) {
          setJudge(data.judge);
          localStorage.setItem("crowdpulse_judge_user", JSON.stringify(data.judge));
        }
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("crowdpulse_judge_token");
          localStorage.removeItem("crowdpulse_judge_user");
          setToken(null);
          setJudge(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJudge();
  }, [token]);

  const login = async (username: string, password: string) => {
    const data = await judgeApi.post("/judge/login", { username, password });
    localStorage.setItem("crowdpulse_judge_token", data.token);
    localStorage.setItem("crowdpulse_judge_user", JSON.stringify(data.judge));
    setToken(data.token);
    setJudge(data.judge);
  };

  const logout = () => {
    localStorage.removeItem("crowdpulse_judge_token");
    localStorage.removeItem("crowdpulse_judge_user");
    setToken(null);
    setJudge(null);
  };

  return (
    <JudgeAuthContext.Provider value={{ judge, token, loading, login, logout }}>
      {children}
    </JudgeAuthContext.Provider>
  );
};

export const useJudgeAuth = () => {
  const context = useContext(JudgeAuthContext);
  if (!context) {
    throw new Error("useJudgeAuth must be used within a JudgeAuthProvider");
  }
  return context;
};

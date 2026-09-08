import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useJudgeAuth } from "../context/JudgeAuthContext";

export const JudgeProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { judge, token, loading } = useJudgeAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Verifying Judge Credentials...</p>
      </div>
    );
  }

  if (!token || !judge) {
    return <Navigate to="/judge/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

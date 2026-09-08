import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = true,
}) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Verifying authorization...
        </p>
      </div>
    );
  }

  // Not authenticated -> Redirect to login with intended location state
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but does not have admin role
  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121722] border border-rose-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-950/40">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Admin Access Required
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Only administrator accounts are authorized to create and manage live events. Your current account ({user.email}) has the role <span className="font-mono text-amber-400 font-semibold">{user.role}</span>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Navigate to="/login" state={{ from: location }} replace />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

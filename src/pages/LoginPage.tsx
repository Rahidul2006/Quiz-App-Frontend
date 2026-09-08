import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setLoading(true);
    try {
      await login("admin@demo.org", "demo123");
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161b26] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
            <Zap className="w-6 h-6 text-[#0c1017] fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h2>
          <p className="text-xs text-slate-400">
            Sign in to manage live events, polls, word clouds, and quizzes.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demo.org"
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950 active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? "Signing in..." : "Sign In as Admin"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#161b26] px-2 text-slate-500">Or Demo Access</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoAdmin}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Launch Demo Admin Dashboard</span>
        </button>

        <div className="text-center text-xs text-slate-400">
          Need an account?{" "}
          <Link to="/register" className="text-emerald-400 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

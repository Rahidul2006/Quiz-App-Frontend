import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("crowdpulse_admin_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.get("/auth/me");
        setUser(data.user);
      } catch (err) {
        console.warn("Session check failed, clearing token");
        localStorage.removeItem("crowdpulse_admin_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("crowdpulse_admin_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const data = await api.post("/auth/register", { fullName, email, password });
    localStorage.setItem("crowdpulse_admin_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("crowdpulse_admin_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

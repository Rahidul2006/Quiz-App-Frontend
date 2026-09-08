const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = (): string | null => {
  return localStorage.getItem("crowdpulse_admin_token");
};

export const api = {
  async get(endpoint: string) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      const error = new Error(err.message || `GET ${endpoint} failed with ${res.status}`) as any;
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async post(endpoint: string, body: any) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      const error = new Error(err.message || `POST ${endpoint} failed with ${res.status}`) as any;
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async patch(endpoint: string, body: any) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      const error = new Error(err.message || `PATCH ${endpoint} failed with ${res.status}`) as any;
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async delete(endpoint: string) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      const error = new Error(err.message || `DELETE ${endpoint} failed with ${res.status}`) as any;
      error.status = res.status;
      throw error;
    }
    return res.json();
  },
};

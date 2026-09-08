const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = (): string | null => {
  return localStorage.getItem("crowdpulse_admin_token");
};

const handleResponse = async (res: Response, endpoint: string) => {
  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && !endpoint.startsWith("/auth/login") && !endpoint.startsWith("/auth/register")) {
      localStorage.removeItem("crowdpulse_admin_token");
      localStorage.removeItem("crowdpulse_admin_user");
    }
    const err = await res.json().catch(() => null);
    const message = err?.message || `${endpoint} failed with status ${res.status}${res.statusText ? ` (${res.statusText})` : ""}`;
    const error = new Error(message) as any;
    error.status = res.status;
    throw error;
  }
  return res.json();
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
    return handleResponse(res, endpoint);
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
    return handleResponse(res, endpoint);
  },

  async put(endpoint: string, body: any) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(res, endpoint);
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
    return handleResponse(res, endpoint);
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
    return handleResponse(res, endpoint);
  },
};


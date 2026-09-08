const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getJudgeToken = (): string | null => {
  return localStorage.getItem("crowdpulse_judge_token");
};

const handleJudgeResponse = async (res: Response, endpoint: string) => {
  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && !endpoint.startsWith("/judge/login")) {
      // Don't auto clear on login check errors, only when confirmed invalid
      if (res.status === 401) {
        localStorage.removeItem("crowdpulse_judge_token");
        localStorage.removeItem("crowdpulse_judge_user");
      }
    }
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    const error = new Error(err.message || `${endpoint} failed with status ${res.status}`) as any;
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export const judgeApi = {
  async get(endpoint: string) {
    const token = getJudgeToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return handleJudgeResponse(res, endpoint);
  },

  async post(endpoint: string, body: any) {
    const token = getJudgeToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return handleJudgeResponse(res, endpoint);
  },

  async patch(endpoint: string, body: any) {
    const token = getJudgeToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return handleJudgeResponse(res, endpoint);
  },

  async delete(endpoint: string) {
    const token = getJudgeToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return handleJudgeResponse(res, endpoint);
  },
};

// ── Base Configuration ────────────────────────────────────────
const API_BASE_URL = "http://127.0.0.1:8000";

// ── Auth Helpers ─────────────────────────────────────────────
export const getToken = () => localStorage.getItem("token");

export const setToken = (token: string) => localStorage.setItem("token", token);

export const removeToken = () => localStorage.removeItem("token");

export const isAuthenticated = () => !!getToken();

// ── Base Fetch Helper ─────────────────────────────────────────
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// ── Auth API ──────────────────────────────────────────────────
export const authAPI = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!response.ok) throw new Error("Invalid username or password");
    const data = await response.json();
    setToken(data.access_token);
    return data;
  },

  register: async (username: string, email: string, password: string, role: string = "analyst") => {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, role }),
    });
  },

  logout: () => {
    removeToken();
    window.location.href = "/login";
  }
};

// ── Assets API ────────────────────────────────────────────────
export const assetsAPI = {
  getAll: () => apiFetch("/assets/"),
  getById: (id: string) => apiFetch(`/assets/${id}`),
  create: (data: object) => apiFetch("/assets/", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/assets/${id}`, { method: "DELETE" }),
};

// ── Weather API ───────────────────────────────────────────────
export const weatherAPI = {
  getStations: () => apiFetch("/weather/stations"),
  getObservations: () => apiFetch("/weather/observations"),
  getObservationsByStation: (stationId: string) => apiFetch(`/weather/observations/station/${stationId}`),
  getObservationsBySource: (source: string) => apiFetch(`/weather/observations/by-source/${encodeURIComponent(source)}`),
  getSourcesSummary: () => apiFetch("/weather/sources/summary"),
};

// ── Risk API ──────────────────────────────────────────────────
export const riskAPI = {
  getAll: () => apiFetch("/risk/"),
  getById: (id: string) => apiFetch(`/risk/${id}`),
  getByAsset: (assetId: string) => apiFetch(`/risk/asset/${assetId}`),
  getAllAlerts: () => apiFetch("/risk/alerts/all"),
  acknowledgeAlert: (alertId: string) => apiFetch(`/risk/alerts/${alertId}/acknowledge`, { method: "PUT" }),
};

// ── Pipeline API ──────────────────────────────────────────────
export const pipelineAPI = {
  getRuns: () => apiFetch("/pipeline/runs"),
  getRunLogs: (runId: string) => apiFetch(`/pipeline/runs/${runId}/logs`),
  runNasaPower: (daysBack: number = 7) => apiFetch(`/pipeline/run/nasa-power?days_back=${daysBack}`, { method: "POST" }),
  runOpenWeather: () => apiFetch("/pipeline/run/openweather", { method: "POST" }),
  runEra5: (daysBack: number = 7) => apiFetch(`/pipeline/run/era5?days_back=${daysBack}`, { method: "POST" }),
  runRiskAssessment: () => apiFetch("/pipeline/run/risk-assessment", { method: "POST" }),
};
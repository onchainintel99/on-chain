const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function getToken() {
  return localStorage.getItem("onchain-intel:token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("onchain-intel:token", token);
  } else {
    localStorage.removeItem("onchain-intel:token");
  }
}

async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

// Authentication
export const loginRequest = (email, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

export const signupRequest = (payload) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const meRequest = () =>
  request("/auth/me");

// Dashboard
export const overviewRequest = () =>
  request("/dashboard/overview");

export const adminOverviewRequest = () =>
  request("/dashboard/admin");

// Wallets
export const walletsRequest = (params = "") =>
  request(`/wallets${params ? `?${params}` : ""}`);

export const walletRequest = (id) =>
  request(`/wallets/${id}`);

export const createWalletRequest = (payload) =>
  request("/wallets", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Manager Stage 1
export const manager1DecisionRequest = (id, payload) =>
  request(`/wallets/${id}/stage1-decision`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// User Stage 2
export const stage2SubmitRequest = (id, payload) =>
  request(`/wallets/${id}/stage2-submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Manager Stage 2
export const manager2DecisionRequest = (id, payload) =>
  request(`/wallets/${id}/stage2-decision`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Admin / Staff
export const createStaffRequest = (payload) =>
  request("/admin/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
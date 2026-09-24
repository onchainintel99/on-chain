const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function getToken() { return localStorage.getItem('onchain-intel:token') }
export function setToken(token) { token ? localStorage.setItem('onchain-intel:token', token) : localStorage.removeItem('onchain-intel:token') }

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || 'Request failed')
  return data
}

export const loginRequest = (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
export const signupRequest = (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
export const meRequest = () => request('/auth/me')
export const overviewRequest = () => request('/dashboard/overview')
export const adminOverviewRequest = () => request('/dashboard/admin')
export const walletsRequest = (params = '') => request(`/wallets${params ? `?${params}` : ''}`)
export const walletRequest = (id) => request(`/wallets/${id}`)
export const createWalletRequest = (payload) => request('/wallets', { method: 'POST', body: JSON.stringify(payload) })
export const manager1DecisionRequest = (id, payload) => request(`/wallets/${id}/stage1-decision`, { method: 'POST', body: JSON.stringify(payload) })
export const stage2SubmitRequest = (id, payload) => request(`/wallets/${id}/stage2-submit`, { method: 'POST', body: JSON.stringify(payload) })
export const manager2DecisionRequest = (id, payload) => request(`/wallets/${id}/stage2-decision`, { method: 'POST', body: JSON.stringify(payload) })
export const createStaffRequest = (payload) => request('/admin/staff', { method: 'POST', body: JSON.stringify(payload) })

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'ahilney_provider_token';

// ─── Web-safe token storage ───────────────────────────────────────────────────
// expo-secure-store is native-only; fall back to localStorage on web.
const storage = {
  getItem: (key) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  setItem: (key, value) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  removeItem: (key) =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};

// ─── Token helpers ────────────────────────────────────────────────────────────
export async function getToken() {
  return storage.getItem(TOKEN_KEY);
}
export async function setToken(token) {
  return storage.setItem(TOKEN_KEY, token);
}
export async function clearToken() {
  return storage.removeItem(TOKEN_KEY);
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.error || json.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

// ─── API methods ─────────────────────────────────────────────────────────────
export const api = {
  // Auth
  login: (email, password) =>
    request('/api/v1/auth/provider/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Profile & notifications
  profile: () => request('/api/v1/provider/profile'),

  notifications: () => request('/api/v1/provider/notifications'),
  markNotificationRead: (id) =>
    request(`/api/v1/provider/notifications/${id}/read`, { method: 'POST' }),

  // Appointments
  appointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/provider/appointments${qs ? '?' + qs : ''}`);
  },
  appointment: (id) => request(`/api/v1/provider/appointments/${id}`),
  acceptAppointment: (id) =>
    request(`/api/v1/provider/appointments/${id}/accept`, { method: 'POST' }),
  rejectAppointment: (id, reason) =>
    request(`/api/v1/provider/appointments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  startSession: (id) =>
    request(`/api/v1/provider/appointments/${id}/start`, { method: 'POST' }),
  submitSummary: (id, data) =>
    request(`/api/v1/provider/appointments/${id}/summary`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Wallet
  wallet: () => request('/api/v1/provider/wallet'),

  // Schedule
  schedule: () => request('/api/v1/provider/schedule'),
  updateSchedule: (shifts) =>
    request('/api/v1/provider/schedule', {
      method: 'PUT',
      body: JSON.stringify({ shifts }),
    }),
};

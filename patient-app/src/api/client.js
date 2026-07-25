import * as SecureStore from 'expo-secure-store';

// In development the API runs on the same machine.
// Set EXPO_PUBLIC_API_URL in .env to point to your deployed API.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const TOKEN_KEY = 'ahilney_patient_token';

// ─── Token helpers ────────────────────────────────────────────────────────────
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function setToken(token) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function clearToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
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

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  // Auth
  sendOtp: (phone) =>
    request('/api/v1/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),

  verifyOtp: (phone, code) =>
    request('/api/v1/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),

  // Patient profile & notifications
  profile: () => request('/api/v1/patient/profile'),
  updateProfile: (data) =>
    request('/api/v1/patient/profile', { method: 'PUT', body: JSON.stringify(data) }),

  notifications: () => request('/api/v1/patient/notifications'),
  markNotificationRead: (id) =>
    request(`/api/v1/patient/notifications/${id}/read`, { method: 'POST' }),

  // Appointments
  appointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/patient/appointments${qs ? '?' + qs : ''}`);
  },
  appointment: (id) => request(`/api/v1/patient/appointments/${id}`),
  bookAppointment: (data) =>
    request('/api/v1/patient/appointments', { method: 'POST', body: JSON.stringify(data) }),
  rateAppointment: (id, rating, feedback) =>
    request(`/api/v1/patient/appointments/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    }),

  // Wallet
  wallet: () => request('/api/v1/patient/wallet'),
  topup: (amount) =>
    request('/api/v1/patient/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) }),

  // Public: providers, regions, services, promos
  providers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/providers${qs ? '?' + qs : ''}`);
  },
  provider: (id) => request(`/api/v1/providers/${id}`),
  regions: () => request('/api/v1/regions'),
  services: () => request('/api/v1/services'),
  validatePromo: (code, providerId) =>
    request('/api/v1/promos/validate', {
      method: 'POST',
      body: JSON.stringify({ code, provider_id: providerId }),
    }),
};

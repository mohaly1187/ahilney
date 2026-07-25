// Thin API client — injects JWT from localStorage, normalizes errors

const BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('ahilney_admin_token')
}

export function setToken(token) {
  localStorage.setItem('ahilney_admin_token', token)
}

export function clearToken() {
  localStorage.removeItem('ahilney_admin_token')
}

export function isAuthenticated() {
  return !!getToken()
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status, data })
  }

  return data
}

export const api = {
  get: (path, params) => {
    const url = params
      ? `${path}?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))}` 
      : path
    return request(url)
  },
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),

  // Auth
  adminLogin: (email, password) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Stats
  stats: () => request('/admin/stats'),

  // Appointments
  appointments: (params) => api.get('/admin/appointments', params),
  setAppointmentStatus: (id, status) => api.put(`/admin/appointments/${id}/status`, { status }),

  // Summaries (Session Audit)
  summaries: (status) => api.get('/admin/summaries', status ? { status } : undefined),
  approveSummary: (id) => api.post(`/admin/summaries/${id}/approve`, {}),
  rejectSummary: (id, reason) => api.post(`/admin/summaries/${id}/reject`, { reason }),

  // Providers
  providers: (params) => api.get('/admin/providers', params),
  provider: (id) => request(`/admin/providers/${id}`),
  setProviderStatus: (id, status) => api.put(`/admin/providers/${id}/status`, { status }),
  setDocumentStatus: (providerId, docId, status) => api.put(`/admin/providers/${providerId}/documents/${docId}`, { status }),

  // Patients
  patients: (params) => api.get('/admin/patients', params),
  patient: (id) => request(`/admin/patients/${id}`),
  refundPatient: (id, amount, reason) => api.post(`/admin/patients/${id}/refund`, { amount, reason }),

  // Transactions
  transactions: (type) => api.get('/admin/transactions', type ? { type } : undefined),

  // Promos
  promos: () => request('/admin/promos'),
  createPromo: (data) => api.post('/admin/promos', data),
  updatePromo: (id, data) => api.put(`/admin/promos/${id}`, data),

  // Regions
  regions: () => request('/admin/regions'),
  addSubregion: (regionId, name, name_ar) => api.post(`/admin/regions/${regionId}/subregions`, { name, name_ar }),
  deleteSubregion: (regionId, subId) => api.delete(`/admin/regions/${regionId}/subregions/${subId}`),
}

import axios from 'axios';

// In production, API is served from the same domain (no VITE_API_URL needed)
// In development, Vite proxy forwards /api to localhost:4000
// But if VITE_API_URL is explicitly set, use that
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lpdr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('lpdr_token');
      localStorage.removeItem('lpdr_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ Auth ============
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ============ Pilots ============
export const pilotApi = {
  list: (params) => api.get('/pilots', { params }),
  getById: (id) => api.get(`/pilots/${id}`),
  getReviews: (id) => api.get(`/pilots/${id}/reviews`),
  updateProfile: (data) => api.put('/pilots/me/profile', data),
  toggleAvailability: (available) => api.put('/pilots/me/availability', { available }),
  updateLocation: (lat, lng, heading, speed) => api.post('/pilots/me/location', { lat, lng, heading, speed }),
  submitVerification: (data) => api.post('/pilots/me/verification', data),
  getVerification: () => api.get('/pilots/me/verification'),
};

// ============ Cases ============
export const caseApi = {
  create: (data) => api.post('/cases', data),
  list: () => api.get('/cases'),
  getById: (id) => api.get(`/cases/${id}`),
  accept: (id) => api.post(`/cases/${id}/accept`),
  updateStatus: (id, status, notes) => api.post(`/cases/${id}/status`, { status, notes }),
  cancel: (id) => api.post(`/cases/${id}/cancel`),
  review: (id, rating, comment) => api.post(`/cases/${id}/review`, { rating, comment }),
};

// ============ Messages ============
export const messageApi = {
  list: (caseId) => api.get(`/cases/${caseId}/messages`),
  send: (caseId, text, imageUrl) => api.post(`/cases/${caseId}/messages`, { text, imageUrl }),
  markRead: (caseId) => api.post(`/cases/${caseId}/messages/read`),
};

// ============ Map ============
export const mapApi = {
  getPilots: () => api.get('/map/pilots'),
  getCases: () => api.get('/map/cases'),
};

// ============ Content ============
export const contentApi = {
  getTestimonials: () => api.get('/content/testimonials'),
  getFaqs: () => api.get('/content/faqs'),
  getCaseContact: (wpId) => api.get(`/content/live-cases/${wpId}/contact`),
  getWPPilots: () => api.get('/content/wp-pilots'),
};

// ============ Notifications ============
export const notificationApi = {
  register: (token, platform) => api.post('/notifications/register', { token, platform }),
};

// ============ Admin ============
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getCases: (params) => api.get('/admin/cases', { params }),
  getVerifications: () => api.get('/admin/verifications'),
  reviewVerification: (id, status, notes) => api.post(`/admin/verifications/${id}/review`, { status, notes }),
};

export default api;

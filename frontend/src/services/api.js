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
};

// ============ Pilots ============
export const pilotApi = {
  list: (params) => api.get('/pilots', { params }),
  getById: (id) => api.get(`/pilots/${id}`),
  getReviews: (id) => api.get(`/pilots/${id}/reviews`),
  updateProfile: (data) => api.put('/pilots/me/profile', data),
  toggleAvailability: (available) => api.put('/pilots/me/availability', { available }),
  updateLocation: (lat, lng, heading, speed) => api.post('/pilots/me/location', { lat, lng, heading, speed }),
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
};

// ============ Notifications ============
export const notificationApi = {
  register: (token, platform) => api.post('/notifications/register', { token, platform }),
};

export default api;

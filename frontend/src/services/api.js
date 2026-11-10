import axios from 'axios';

// Use environment variable or fallback to relative URL (proxied in Vite dev) or direct localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error message extraction
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected network error occurred.';
    if (error.response) {
      message = error.response.data?.error || `Server returned error (${error.response.status})`;
    } else if (error.request) {
      message = 'Cannot connect to Flask backend. Please ensure app.py is running on port 5000.';
    } else {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // System Health
  checkHealth: () => apiClient.get('/api/health'),

  // Dashboard Overview
  getDashboard: () => apiClient.get('/api/dashboard'),

  // Dataset Exploration
  getTrainDataset: (params = {}) => apiClient.get('/api/dataset/train', { params }),
  getTestDataset: (params = {}) => apiClient.get('/api/dataset/test', { params }),

  // Markov Activities & Matrices
  getActivities: () => apiClient.get('/api/activities'),
  getTransitionCounts: () => apiClient.get('/api/transitions/counts'),
  getTransitionProbabilities: () => apiClient.get('/api/transitions/probabilities'),

  // Predictions & Simulation
  predictNextActivity: (activity) => apiClient.post('/api/predict', { activity }),
  simulateTrajectory: (start_activity, steps = 10) => apiClient.post('/api/simulate', { start_activity, steps }),

  // Model Evaluation
  getEvaluation: () => apiClient.get('/api/evaluation'),
  getConfusionMatrix: () => apiClient.get('/api/evaluation/confusion-matrix'),

  // Distribution
  getActivityDistribution: () => apiClient.get('/api/activity-distribution'),

  // CSV Export URL builder
  getExportUrl: (type) => `${API_BASE_URL}/api/export/${type}`,

  // Refresh
  refreshModel: () => apiClient.post('/api/refresh'),
};

export default api;

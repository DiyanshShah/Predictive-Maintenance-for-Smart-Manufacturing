import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return { success: true, user };
};

export const signup = async (userData) => {
  const response = await api.post('/auth/register', userData);
  const { token, user } = response.data;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return { success: true, user };
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
};

export const checkAuth = () => {
  return !!localStorage.getItem('auth_token');
};

export const getMachines = async () => {
  const response = await api.get('/equipment');
  return response.data;
};

export const getMachineDetails = async (equipmentId) => {
  const response = await api.get(`/equipment/${equipmentId}`);
  return response.data;
};

export const getMachineHistory = async (equipmentId) => {
  const response = await api.get(`/equipment/${equipmentId}/history`);
  return response.data;
};

export const getMachineReadings = async (equipmentId, params = {}) => {
  const response = await api.get(`/equipment/${equipmentId}/readings`, { params });
  return response.data;
};

export const runPrediction = async (data) => {
  const response = await api.post('/prediction', data);
  return response.data;
};

export const scheduleMaintenance = async (data) => {
  const response = await api.post('/maintenance/create', data);
  return response.data;
};

export const uploadHistoricalData = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload-historical-data', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const setupConnector = async (connectorConfig) => {
  const response = await api.post('/connector/setup', connectorConfig);
  return response.data;
};

export const stopConnector = async (equipmentId) => {
  const response = await api.delete(`/connector/${equipmentId}`);
  return response.data;
};

export const listConnectors = async () => {
  const response = await api.get('/connector');
  return response.data;
};

export const getComparativeAnalytics = async (metric, equipmentIds = []) => {
  const response = await api.get('/analytics/comparative', {
    params: { metric, equipment_ids: equipmentIds.join(',') }
  });
  return response.data;
};

export const getMaintenanceROI = async (period = '12months', equipmentId = null) => {
  const params = { period };
  if (equipmentId) {
    params.equipment_id = equipmentId;
  }
  const response = await api.get('/analytics/roi', { params });
  return response.data;
};

export const getReliabilityScores = async (equipmentId = null) => {
  const params = {};
  if (equipmentId) {
    params.equipment_id = equipmentId;
  }
  const response = await api.get('/analytics/reliability', { params });
  return response.data;
};

export const getFeatureImportance = async (modelType = null) => {
  const params = {};
  if (modelType) {
    params.model_type = modelType;
  }
  const response = await api.get('/analytics/feature-importance', { params });
  return response.data;
};

export const getAlertConfig = async () => {
  const response = await api.get('/settings/alerts');
  return response.data;
};

export const saveAlertConfig = async (config) => {
  const response = await api.post('/settings/alerts', config);
  return response.data;
};

export const getModelSettings = async () => {
  const response = await api.get('/settings/model');
  return response.data;
};

export const saveModelSettings = async (settings) => {
  const response = await api.post('/settings/model', settings);
  return response.data;
};

export const trainModel = async (options = {}) => {
  const response = await api.post('/model/train', options);
  return response.data;
};

const apiService = {
  login,
  signup,
  logout,
  getCurrentUser,
  checkAuth,
  getMachines,
  getMachineDetails,
  getMachineHistory,
  getMachineReadings,
  runPrediction,
  scheduleMaintenance,
  uploadHistoricalData,
  setupConnector,
  stopConnector,
  listConnectors,
  getComparativeAnalytics,
  getMaintenanceROI,
  getReliabilityScores,
  getFeatureImportance,
  getAlertConfig,
  saveAlertConfig,
  getModelSettings,
  saveModelSettings,
  trainModel,
};

export default apiService; 
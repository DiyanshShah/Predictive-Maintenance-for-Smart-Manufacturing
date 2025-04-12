import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMachines = async () => {
  try {
    const response = await api.get('/equipment');
    return response.data;
  } catch (error) {
    console.error('Error fetching machines:', error);
    throw error;
  }
};

export const getMachineDetails = async (equipmentId) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for machine ${equipmentId}:`, error);
    throw error;
  }
};

export const getMachineHistory = async (equipmentId) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching history for machine ${equipmentId}:`, error);
    throw error;
  }
};

export const getMachineReadings = async (equipmentId, params = {}) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/readings`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching readings for machine ${equipmentId}:`, error);
    throw error;
  }
};

export const runPrediction = async (data) => {
  try {
    const response = await api.post('/predict', data);
    return response.data;
  } catch (error) {
    console.error('Error running prediction:', error);
    throw error;
  }
};

export const scheduleMaintenance = async (data) => {
  try {
    const response = await api.post('/maintenance/schedule', data);
    return response.data;
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
    throw error;
  }
};

export const uploadHistoricalData = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload-historical-data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading historical data:', error);
    throw error;
  }
};

export const setupConnector = async (connectorConfig) => {
  try {
    const response = await api.post('/connector/setup', connectorConfig);
    return response.data;
  } catch (error) {
    console.error('Error setting up connector:', error);
    throw error;
  }
};

export const stopConnector = async (equipmentId) => {
  try {
    const response = await api.delete(`/connector/${equipmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error stopping connector for ${equipmentId}:`, error);
    throw error;
  }
};

export const listConnectors = async () => {
  try {
    const response = await api.get('/connector');
    return response.data;
  } catch (error) {
    console.error('Error listing connectors:', error);
    throw error;
  }
};

export default {
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
}; 
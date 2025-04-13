import axios from 'axios';

// Create base axios instance with appropriate base URL
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Mock data for machines
const mockMachines = [
  {
    equipment_id: 'PUMP001',
    name: 'Main Pump',
    status: 'normal',
    last_maintenance_date: '2023-05-15',
    installation_date: '2022-01-10',
    location: 'Building A',
    model: 'XP-1500',
    manufacturer: 'ABC Pumps'
  },
  {
    equipment_id: 'HVAC002',
    name: 'HVAC System',
    status: 'warning',
    last_maintenance_date: '2023-03-22',
    installation_date: '2021-11-05',
    location: 'Building B',
    model: 'AC-5000',
    manufacturer: 'Cooling Corp'
  },
  {
    equipment_id: 'MOTOR003',
    name: 'Electric Motor',
    status: 'critical',
    last_maintenance_date: '2023-02-10',
    installation_date: '2020-06-15',
    location: 'Building A',
    model: 'M-750',
    manufacturer: 'Motor Masters'
  },
  {
    equipment_id: 'TURBINE004',
    name: 'Turbine 4',
    status: 'normal',
    last_maintenance_date: '2023-06-01',
    installation_date: '2021-08-20',
    location: 'Building C',
    model: 'T-2000',
    manufacturer: 'TurboCorp'
  },
  {
    equipment_id: 'COMPRESSOR005',
    name: 'Air Compressor',
    status: 'normal',
    last_maintenance_date: '2023-04-12',
    installation_date: '2022-02-28',
    location: 'Building B',
    model: 'C-800',
    manufacturer: 'Compression Inc'
  }
];

// Generate random sensor readings
const generateMockReadings = (equipmentId, count = 20) => {
  const readings = [];
  const now = new Date();
  
  // Create a stable random seed based on equipment ID
  // This ensures the same machine always gets the same "random" variations
  const getEquipmentSeed = (id) => {
    let seed = 0;
    for (let i = 0; i < id.length; i++) {
      seed += id.charCodeAt(i);
    }
    return seed;
  };
  
  const seed = getEquipmentSeed(equipmentId);
  
  // Simple deterministic random function based on seed
  const pseudoRandom = (index, offset = 0) => {
    const x = Math.sin(seed + index + offset) * 10000;
    return Math.abs(x - Math.floor(x));
  };
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - i);
    
    // Different baseline values for different equipment
    let baseTemp = 0, baseVibration = 0, basePressure = 0, baseOilLevel = 0;
    
    switch(equipmentId) {
      case 'PUMP001':
        baseTemp = 60;
        baseVibration = 2;
        basePressure = 120;
        baseOilLevel = 80;
        break;
      case 'HVAC002':
        baseTemp = 50;
        baseVibration = 1;
        basePressure = 90;
        baseOilLevel = 85;
        break;
      case 'MOTOR003':
        baseTemp = 70;
        baseVibration = 5;
        basePressure = 100;
        baseOilLevel = 60;
        break;
      case 'TURBINE004':
        baseTemp = 65;
        baseVibration = 3;
        basePressure = 130;
        baseOilLevel = 90;
        break;
      case 'COMPRESSOR005':
        baseTemp = 55;
        baseVibration = 2;
        basePressure = 110;
        baseOilLevel = 75;
        break;
      default:
        baseTemp = 60;
        baseVibration = 2;
        basePressure = 100;
        baseOilLevel = 80;
    }
    
    // Add consistent variation for the same equipment
    const temperature = baseTemp + (pseudoRandom(i, 1) * 10 - 5);
    const vibration = baseVibration + (pseudoRandom(i, 2) * 2 - 1);
    const pressure = basePressure + (pseudoRandom(i, 3) * 20 - 10);
    const oil_level = baseOilLevel + (pseudoRandom(i, 4) * 10 - 5);
    const anomaly_detected = pseudoRandom(i, 5) < 0.1;
    
    const reading = {
      timestamp: timestamp.toISOString(),
      temperature: parseFloat(temperature.toFixed(2)),
      vibration: parseFloat(vibration.toFixed(2)),
      pressure: parseFloat(pressure.toFixed(2)),
      oil_level: parseFloat(oil_level.toFixed(2)),
      anomaly_detected
    };
    
    readings.push(reading);
  }
  
  return readings;
};

// Generate mock machine details
const generateMockMachineDetails = (equipmentId) => {
  const machine = mockMachines.find(m => m.equipment_id === equipmentId);
  
  if (!machine) {
    return null;
  }
  
  return {
    ...machine,
    readings: generateMockReadings(equipmentId, 5),
    maintenance_history: [
      {
        id: "m-" + Math.floor(Math.random() * 1000),
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenance_type: "preventive",
        description: "Regular preventive maintenance",
        technician: "John Smith",
        cost: 250.00
      },
      {
        id: "m-" + Math.floor(Math.random() * 1000),
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenance_type: "corrective",
        description: "Fixed oil leak",
        technician: "Sarah Johnson",
        cost: 520.00
      }
    ],
    upcoming_maintenance: [
      {
        id: "um-" + Math.floor(Math.random() * 1000),
        maintenance_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenance_type: "predictive",
        description: "Scheduled based on prediction model",
        priority: "medium",
        technician: "David Lee"
      }
    ],
    metrics: {
      mtbf: "45 days",
      mttr: "4.2 hours",
      availability: "98.5",
      maintenance_cost_ytd: "2,850"
    }
  };
};

export const getMachines = async () => {
  try {
    const response = await api.get('/equipment');
    return response.data;
  } catch (error) {
    console.error('Error fetching machines:', error);
    // Return mock data if API fails
    return mockMachines;
  }
};

export const getMachineDetails = async (equipmentId) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for ${equipmentId}:`, error);
    // Return mock data if API fails
    return generateMockMachineDetails(equipmentId);
  }
};

export const getMachineHistory = async (equipmentId) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching history for ${equipmentId}:`, error);
    // Return mock history if API fails
    const details = generateMockMachineDetails(equipmentId);
    return details?.maintenance_history || [];
  }
};

export const getMachineReadings = async (equipmentId, params = {}) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/readings`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching readings for ${equipmentId}:`, error);
    // Return mock readings if API fails
    return generateMockReadings(equipmentId, 30);
  }
};

export const runPrediction = async (data) => {
  try {
    const response = await api.post('/predict', data);
    return response.data;
  } catch (error) {
    console.error('Error running prediction:', error);
    // Return mock prediction if API fails
    const isCritical = Math.random() < 0.2;
    const isWarning = !isCritical && Math.random() < 0.3;
    const failureProbability = isCritical ? 0.8 + Math.random() * 0.2 : 
                        isWarning ? 0.5 + Math.random() * 0.3 : 
                        Math.random() * 0.5;
    const confidence = 0.6 + Math.random() * 0.4;
    const remainingDays = Math.floor((1 - failureProbability) * 90);
                        
    return {
      equipment_id: data.equipment_id,
      prediction: {
        failure_probability: failureProbability,
        confidence: confidence,
        remaining_useful_life_days: remainingDays,
        recommended_action: isCritical ? "maintenance" : 
                           isWarning ? "monitor" : 
                           "normal"
      },
      note: isCritical ? "Critical condition detected. Immediate attention required." : 
            isWarning ? "Abnormal patterns detected. Increased monitoring recommended." : 
            "All parameters within normal operating ranges."
    };
  }
};

export const scheduleMaintenance = async (data) => {
  try {
    const response = await api.post('/maintenance/schedule', data);
    return response.data;
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
    // Return mock response if API fails
    return {
      id: "sm-" + Math.floor(Math.random() * 1000),
      equipment_id: data.equipment_id,
      maintenance_date: data.maintenance_date,
      maintenance_type: data.maintenance_type,
      status: "scheduled",
      created_at: new Date().toISOString()
    };
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
    // Return mock response if API fails
    return {
      success: true,
      message: "File processed successfully (mock)",
      records_processed: Math.floor(Math.random() * 1000) + 500,
      file_name: file.name
    };
  }
};

export const setupConnector = async (connectorConfig) => {
  try {
    const response = await api.post('/connector/setup', connectorConfig);
    return response.data;
  } catch (error) {
    console.error('Error setting up connector:', error);
    // Return mock response if API fails
    return {
      id: "conn-" + Math.floor(Math.random() * 1000),
      equipment_id: connectorConfig.equipment_id,
      connector_type: connectorConfig.connector_type,
      status: "active",
      created_at: new Date().toISOString()
    };
  }
};

export const stopConnector = async (equipmentId) => {
  try {
    const response = await api.delete(`/connector/${equipmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error stopping connector for ${equipmentId}:`, error);
    // Return mock response if API fails
    return {
      success: true,
      message: `Connector for ${equipmentId} stopped successfully (mock)`
    };
  }
};

export const listConnectors = async () => {
  try {
    const response = await api.get('/connector');
    return response.data;
  } catch (error) {
    console.error('Error listing connectors:', error);
    // Return mock connectors if API fails
    return [
      {
        id: "conn-1",
        equipment_id: "PUMP001",
        connector_type: "modbus",
        status: "active",
        last_data_received: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "conn-2",
        equipment_id: "HVAC002",
        connector_type: "api",
        status: "active",
        last_data_received: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "conn-3",
        equipment_id: "MOTOR003",
        connector_type: "csv",
        status: "inactive",
        last_data_received: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
};

// New API functions for Analytics

/**
 * Get comparative analytics data for multiple machines
 */
export const getComparativeAnalytics = async (metric, equipmentIds = []) => {
  try {
    const response = await api.get('/analytics/comparative', { 
      params: { metric, equipmentIds: equipmentIds.join(',') } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching comparative analytics:', error);
    // Return mock data if API fails
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const datasets = [];
    
    // Generate data for each equipment
    equipmentIds.forEach((id, index) => {
      const machine = mockMachines.find(m => m.equipment_id === id) || { name: `Equipment ${id}` };
      
      // Generate different data based on metric
      let data;
      switch(metric) {
        case 'temperature':
          data = labels.map(() => 50 + Math.random() * 30);
          break;
        case 'vibration':
          data = labels.map(() => Math.random() * 5);
          break;
        case 'pressure':
          data = labels.map(() => 90 + Math.random() * 40);
          break;
        case 'oil_level':
          data = labels.map(() => 70 + Math.random() * 20);
          break;
        case 'maintenance_cost':
          data = labels.map(() => Math.floor(Math.random() * 1000));
          break;
        default:
          data = labels.map(() => Math.random() * 100);
      }
      
      // Add dataset for this equipment
      datasets.push({
        label: machine.name,
        data,
        borderColor: ['#714955', '#f44336', '#4caf50', '#8c6b74', '#9c27b0'][index % 5],
        backgroundColor: ['rgba(113, 73, 85, 0.2)', 'rgba(244, 67, 54, 0.2)', 'rgba(76, 175, 80, 0.2)', 'rgba(140, 107, 116, 0.2)', 'rgba(156, 39, 176, 0.2)'][index % 5]
      });
    });
    
    return { labels, datasets, metric };
  }
};

/**
 * Get maintenance ROI data
 */
export const getMaintenanceROI = async (period = '12months') => {
  try {
    const response = await api.get('/analytics/roi', { params: { period } });
    return response.data;
  } catch (error) {
    console.error('Error fetching maintenance ROI:', error);
    // Return mock data if API fails
    return {
      roi_percentage: 127 + Math.floor(Math.random() * 50),
      cost_savings: 45000 + Math.floor(Math.random() * 20000),
      prevention_vs_repair: {
        labels: ['Preventive', 'Corrective'],
        datasets: [{
          data: [68, 32],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      },
      monthly_savings: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Savings ($)',
          data: Array(12).fill(0).map(() => Math.floor(Math.random() * 5000) + 2000),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.2)'
        }]
      }
    };
  }
};

/**
 * Get reliability scorecard data
 */
export const getReliabilityScores = async () => {
  try {
    const response = await api.get('/analytics/reliability');
    return response.data;
  } catch (error) {
    console.error('Error fetching reliability scores:', error);
    // Return mock data if API fails
    return {
      overall_score: 82 + Math.floor(Math.random() * 15),
      scores: [
        { category: 'MTBF', score: 85 + Math.floor(Math.random() * 10), trend: 'up' },
        { category: 'MTTR', score: 78 + Math.floor(Math.random() * 10), trend: 'up' },
        { category: 'Availability', score: 92 + Math.floor(Math.random() * 5), trend: 'stable' },
        { category: 'OEE', score: 76 + Math.floor(Math.random() * 15), trend: 'down' },
        { category: 'Maintenance Compliance', score: 88 + Math.floor(Math.random() * 10), trend: 'up' }
      ],
      historical: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Reliability Score',
          data: [75, 77, 80, 82, 79, 82],
          borderColor: '#673ab7',
          backgroundColor: 'rgba(103, 58, 183, 0.2)'
        }]
      }
    };
  }
};

/**
 * Get feature importance data for the prediction model
 */
export const getFeatureImportance = async () => {
  try {
    const response = await api.get('/analytics/feature-importance');
    return response.data;
  } catch (error) {
    console.error('Error fetching feature importance:', error);
    // Return mock data if API fails
    return {
      features: [
        { name: 'Vibration', importance: 0.35 },
        { name: 'Temperature', importance: 0.25 },
        { name: 'Pressure', importance: 0.20 },
        { name: 'Oil Level', importance: 0.12 },
        { name: 'Age', importance: 0.08 }
      ],
      model_accuracy: 0.89,
      last_updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
};

// API functions for Settings

/**
 * Get current alert configuration
 */
export const getAlertConfig = async () => {
  try {
    const response = await api.get('/settings/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching alert configuration:', error);
    // Return mock data if API fails
    return {
      global_alerts_enabled: true,
      notification_channels: {
        email: true,
        sms: false,
        dashboard: true,
        webhook: false
      },
      alert_thresholds: {
        warning: 60,
        critical: 80
      },
      recipients: [
        { name: 'Maintenance Team', email: 'maintenance@example.com', sms: '+1234567890' },
        { name: 'Operations Manager', email: 'operations@example.com' }
      ]
    };
  }
};

/**
 * Save alert configuration
 */
export const saveAlertConfig = async (config) => {
  try {
    const response = await api.post('/settings/alerts', config);
    return response.data;
  } catch (error) {
    console.error('Error saving alert configuration:', error);
    // Return mock response if API fails
    return {
      success: true,
      message: 'Alert configuration saved successfully (mock)',
      ...config
    };
  }
};

/**
 * Get sensor threshold settings
 */
export const getSensorThresholds = async () => {
  try {
    const response = await api.get('/settings/thresholds');
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor thresholds:', error);
    // Return default thresholds if API fails
    return [
      {
        id: "temp-high-1",
        equipment_id: "PUMP001",
        parameter: "temperature",
        condition: "above",
        threshold: 85,
        severity: "warning",
        notify_via: ["email", "dashboard"],
        enabled: true,
        created_at: new Date().toISOString()
      },
      {
        id: "vibration-high-1",
        equipment_id: "MOTOR003",
        parameter: "vibration",
        condition: "above",
        threshold: 12,
        severity: "critical",
        notify_via: ["email", "sms", "dashboard"],
        enabled: true,
        created_at: new Date().toISOString()
      },
      {
        id: "pressure-low-1",
        equipment_id: "COMPRESSOR005",
        parameter: "pressure",
        condition: "below",
        threshold: 70,
        severity: "warning",
        notify_via: ["dashboard"],
        enabled: true,
        created_at: new Date().toISOString()
      }
    ];
  }
};

/**
 * Save sensor threshold settings
 */
export const saveSensorThresholds = async (thresholds) => {
  try {
    const response = await api.post('/settings/thresholds', thresholds);
    return response.data;
  } catch (error) {
    console.error('Error saving sensor thresholds:', error);
    // Return mock response if API fails
    return {
      success: true,
      message: 'Sensor thresholds saved successfully (mock)',
      thresholds
    };
  }
};

/**
 * Get notification settings
 */
export const getNotificationSettings = async () => {
  try {
    const response = await api.get('/settings/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    // Return mock data if API fails
    return {
      email: {
        enabled: true,
        smtp_server: 'smtp.example.com',
        port: 587,
        use_tls: true,
        username: 'notifications@example.com',
        from_address: 'predictive-maintenance@example.com'
      },
      sms: {
        enabled: false,
        provider: 'twilio',
        account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        from_number: '+10000000000'
      },
      webhook: {
        enabled: false,
        url: 'https://hooks.example.com/maintenance-notifications',
        headers: { 'X-API-Key': 'xxxxxx' }
      },
      schedule: {
        daily_digest: true,
        digest_time: '08:00',
        immediate_critical: true
      }
    };
  }
};

/**
 * Save notification settings
 */
export const saveNotificationSettings = async (settings) => {
  try {
    const response = await api.post('/settings/notifications', settings);
    return response.data;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    // Return mock response if API fails
    return {
      success: true,
      message: 'Notification settings saved successfully (mock)',
      settings
    };
  }
};

/**
 * Get model training settings
 */
export const getModelSettings = async () => {
  try {
    const response = await api.get('/settings/model');
    return response.data;
  } catch (error) {
    console.error('Error fetching model settings:', error);
    // Return mock data if API fails
    return {
      retraining_schedule: {
        frequency: 'weekly',
        day: 'Sunday',
        time: '02:00'
      },
      training_history: [
        { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), accuracy: 0.89, duration_minutes: 45 },
        { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), accuracy: 0.87, duration_minutes: 42 },
        { date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), accuracy: 0.86, duration_minutes: 48 }
      ],
      model_params: {
        algorithm: 'random_forest',
        feature_selection: true,
        hyperparameter_tuning: true,
        validation_split: 0.2,
        use_historical_data: true
      },
      prediction_threshold: 0.65,
      // Add fields that match the expected structure in the UI
      algorithm: 'random_forest',
      trainingFrequency: 'weekly',
      dataRetentionPeriod: '1year',
      featureImportance: [0.32, 0.28, 0.18, 0.12, 0.07, 0.03]
    };
  }
};

/**
 * Save model training settings
 */
export const saveModelSettings = async (settings) => {
  try {
    const response = await api.post('/settings/model', settings);
    return response.data;
  } catch (error) {
    console.error('Error saving model settings:', error);
    // Return mock response if API fails
    return {
      success: true,
      message: 'Model settings saved successfully (mock)',
      settings
    };
  }
};

/**
 * Trigger model training
 */
export const trainModel = async () => {
  try {
    const response = await api.post('/model/train');
    return response.data;
  } catch (error) {
    console.error('Error triggering model training:', error);
    // Return mock response if API fails
    return {
      success: true,
      message: 'Model training initiated successfully (mock)',
      job_id: 'job-' + Math.floor(Math.random() * 1000),
      estimated_completion_time: new Date(Date.now() + 45 * 60 * 1000).toISOString()
    };
  }
};

// Assign the object to a variable before exporting
const apiService = {
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
  getSensorThresholds,
  saveSensorThresholds,
  getNotificationSettings,
  saveNotificationSettings,
  getModelSettings,
  saveModelSettings,
  trainModel
};

export default apiService; 
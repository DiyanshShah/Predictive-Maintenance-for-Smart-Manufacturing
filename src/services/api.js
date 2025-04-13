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

/**
 * Run prediction on equipment
 */
export const runPrediction = async (data) => {
  try {
    console.log("Sending prediction request with data:", data);
    // Ensure we include all available sensor readings for better prediction
    const response = await api.post('/predict', data);
    console.log("Raw prediction response:", response.data);
    
    // Map the backend response fields to frontend expected fields while preserving all ML model data
    const resultData = response.data;
    return {
      prediction_id: resultData.prediction_id || `pred-${Date.now()}`,
      timestamp: resultData.timestamp || new Date().toISOString(),
      equipment_id: resultData.equipment_id || data.equipment_id || 'unknown',
      // Map backend fields to expected frontend fields
      failure_probability: resultData.probability,
      remaining_useful_life: resultData.estimated_time_to_failure,
      confidence: resultData.confidence || 0.9,
      anomaly_detected: resultData.anomaly_detected,
      anomaly_score: resultData.anomaly_score,
      recommended_action: resultData.prediction, // prediction field maps to recommended_action
      affected_components: resultData.affected_components || [],
      next_maintenance_date: resultData.next_maintenance_date,
      maintenance_required: resultData.maintenance_required,
      // Include all original data to ensure no information is lost
      raw_prediction_data: resultData
    };
  } catch (error) {
    console.error('Error running prediction:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error(`Failed to get prediction from ML model: ${error.message}`);
  }
};

export const scheduleMaintenance = async (data) => {
  try {
    const response = await api.post('/maintenance/create', data);
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
    
    // Match exact backend path: /api/upload-historical-data
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
    // Match exact backend path: /api/connector/setup
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
    const response = await api.get('/comparative-analytics', { 
      params: { 
        metric, 
        equipment_ids: equipmentIds.join(',') 
      } 
    });
    
    // Ensure we have valid data structures
    return Array.isArray(response.data) ? response.data.map(point => ({
      date: point.date || '',
      current: typeof point.current === 'number' ? point.current : 0,
      average: typeof point.average === 'number' ? point.average : 0,
      optimal: typeof point.optimal === 'number' ? point.optimal : 0
    })) : [];
  } catch (error) {
    console.error('Error fetching comparative analytics:', error);
    // Return mock data if API fails
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create data points for each month
    const mockData = months.map(month => {
      // Base object with date property
      const dataPoint = { date: month };
      
      // Add current machine value
      dataPoint.current = Math.floor(Math.random() * 40) + 60; // Random value between 60-100
      
      // Add average value (slightly lower than current)
      dataPoint.average = Math.floor(Math.random() * 30) + 55;
      
      // Add optimal value (usually higher than current)
      dataPoint.optimal = Math.floor(Math.random() * 10) + 90;
      
      return dataPoint;
    });
    
    return mockData;
  }
};

/**
 * Get maintenance ROI data
 */
export const getMaintenanceROI = async (period = '12months', equipmentId = null) => {
  try {
    // Include equipment_id in params if provided for equipment-specific metrics
    const params = { period };
    if (equipmentId) {
      params.equipment_id = equipmentId;
    }
    
    const response = await api.get('/analytics/roi', { params });
    console.log("ROI data from API:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching maintenance ROI:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error(`Failed to get ROI data: ${error.message}`);
  }
};

/**
 * Get reliability scorecard data
 */
export const getReliabilityScores = async (equipmentId = null) => {
  try {
    // Include equipment_id in params if provided for equipment-specific metrics
    const params = {};
    if (equipmentId) {
      params.equipment_id = equipmentId;
    }
    
    const response = await api.get('/analytics/reliability', { params });
    console.log("Reliability data from API:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reliability scores:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error(`Failed to get reliability data: ${error.message}`);
  }
};

/**
 * Get feature importance data from ML models
 */
export const getFeatureImportance = async (modelType = null) => {
  try {
    const params = {};
    if (modelType) {
      params.model_type = modelType; // Allow filtering by model type (failure, rul, anomaly)
    }
    
    const response = await api.get('/analytics/feature-importance', { params });
    console.log("Feature importance data from API:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching feature importance:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error(`Failed to get feature importance data: ${error.message}`);
  }
};

// API functions for Settings

/**
 * Get current alert configuration
 */
export const getAlertConfig = async () => {
  try {
    const response = await api.get('/alert/settings');
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
    const response = await api.post('/alert/settings', config);
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
    const response = await api.get('/sensor/thresholds');
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
    const response = await api.post('/sensor/thresholds', thresholds);
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
    const response = await api.get('/model/settings');
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
    const response = await api.post('/model/settings', settings);
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
 * Trigger model training with specified options
 */
export const trainModel = async (options = {}) => {
  try {
    console.log("Training model with options:", options);
    const response = await api.post('/model/train', options);
    console.log("Model training response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error triggering model training:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error(`Failed to train model: ${error.message}`);
  }
};

export const getMaintenanceHistory = async (equipmentId) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching maintenance history for ${equipmentId}:`, error);
    
    // Generate mock maintenance history data
    const now = new Date();
    const mockHistory = [];
    
    // Past maintenance (completed)
    for (let i = 1; i <= 5; i++) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      
      mockHistory.push({
        id: `maint-${equipmentId}-past-${i}`,
        equipment_id: equipmentId,
        maintenance_date: date.toISOString().split('T')[0],
        completion_date: date.toISOString().split('T')[0],
        maintenance_type: ['preventive', 'corrective', 'predictive'][Math.floor(Math.random() * 3)],
        description: `Regular maintenance service #${i}`,
        technician: `Tech ${Math.floor(Math.random() * 5) + 1}`,
        status: 'completed',
        cost: Math.floor(Math.random() * 500) + 100,
        findings: 'All systems functioning properly after service',
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      });
    }
    
    // Future maintenance (scheduled)
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setDate(now.getDate() + (i * 15)); // Every 15 days in the future
      
      mockHistory.push({
        id: `maint-${equipmentId}-future-${i}`,
        equipment_id: equipmentId,
        maintenance_date: date.toISOString().split('T')[0],
        maintenance_type: ['preventive', 'predictive'][Math.floor(Math.random() * 2)],
        description: `Scheduled maintenance check #${i}`,
        technician: `Tech ${Math.floor(Math.random() * 5) + 1}`,
        status: 'scheduled',
        estimated_duration: Math.floor(Math.random() * 120) + 60,
        priority: ['medium', 'high'][Math.floor(Math.random() * 2)]
      });
    }
    
    return mockHistory;
  }
};

export const getEquipmentList = async () => {
  try {
    const response = await api.get('/equipment');
    
    // Normalize data structure and ensure all required fields exist
    return response.data.map(item => ({
      id: item.id || '',
      name: item.name || `Equipment ${item.id || 'Unknown'}`,
      type: item.type || 'Unknown',
      status: item.status || 'unknown',
      last_maintenance: item.last_maintenance || null,
      location: item.location || 'Unknown',
      installation_date: item.installation_date || null,
      health_score: typeof item.health_score === 'number' ? item.health_score : 0,
      failure_probability: typeof item.failure_probability === 'number' ? item.failure_probability : 0,
      sensor_count: typeof item.sensor_count === 'number' ? item.sensor_count : 0
    }));
  } catch (error) {
    console.error('Error fetching equipment list:', error);
    // ... existing mock data ...
  }
};

export const getEquipmentDetails = async (equipmentId) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}`);
    
    // Ensure all required fields exist with proper types
    const data = response.data;
    return {
      id: data.id || equipmentId,
      name: data.name || `Equipment ${equipmentId}`,
      type: data.type || 'Unknown',
      model: data.model || 'Unknown',
      manufacturer: data.manufacturer || 'Unknown',
      serial_number: data.serial_number || 'Unknown',
      installation_date: data.installation_date || new Date().toISOString().split('T')[0],
      warranty_expiry: data.warranty_expiry || null,
      location: data.location || 'Unknown',
      department: data.department || 'Unknown',
      last_maintenance: data.last_maintenance || null,
      next_maintenance: data.next_maintenance || null,
      maintenance_history: Array.isArray(data.maintenance_history) ? data.maintenance_history : [],
      health_score: typeof data.health_score === 'number' ? data.health_score : 0,
      failure_probability: typeof data.failure_probability === 'number' ? data.failure_probability : 0,
      remaining_useful_life: typeof data.remaining_useful_life === 'number' ? data.remaining_useful_life : 0,
      status: data.status || 'unknown',
      notes: data.notes || '',
      sensor_count: typeof data.sensor_count === 'number' ? data.sensor_count : 0
    };
  } catch (error) {
    console.error(`Error fetching equipment details for ${equipmentId}:`, error);
    // ... existing mock data ...
  }
};

export const getSensorData = async (equipmentId, timeRange = '7d') => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/sensors`, {
      params: { timeRange }
    });
    
    // Ensure data structure matches frontend expectations
    const data = response.data;
    
    // Make sure each data point has timestamps as Date objects and numeric values
    return Object.entries(data).reduce((acc, [sensorType, readings]) => {
      acc[sensorType] = Array.isArray(readings) ? readings.map(reading => ({
        timestamp: reading.timestamp || new Date().toISOString(),
        value: typeof reading.value === 'number' ? reading.value : 0,
        status: reading.status || 'normal'
      })) : [];
      return acc;
    }, {});
  } catch (error) {
    console.error(`Error fetching sensor data for ${equipmentId}:`, error);
    // ... existing mock data ...
  }
};

export const getMaintenanceRecommendations = async (equipmentId) => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/maintenance-recommendations`);
    
    // Normalize data to ensure proper structure
    return Array.isArray(response.data) ? response.data.map(rec => ({
      id: rec.id || `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      equipment_id: rec.equipment_id || equipmentId,
      description: rec.description || 'Routine maintenance check',
      priority: rec.priority || 'medium',
      due_date: rec.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: rec.status || 'pending',
      estimated_hours: typeof rec.estimated_hours === 'number' ? rec.estimated_hours : 2,
      estimated_cost: typeof rec.estimated_cost === 'number' ? rec.estimated_cost : 0,
      notes: rec.notes || '',
      created_at: rec.created_at || new Date().toISOString()
    })) : [];
  } catch (error) {
    console.error(`Error fetching maintenance recommendations for ${equipmentId}:`, error);
    // ... existing mock data ...
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
  trainModel,
  getMaintenanceHistory,
  getEquipmentList,
  getEquipmentDetails,
  getSensorData,
  getMaintenanceRecommendations
};

export default apiService; 
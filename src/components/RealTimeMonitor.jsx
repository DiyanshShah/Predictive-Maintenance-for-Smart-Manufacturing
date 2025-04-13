import React, { useState, useEffect, useCallback } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  Box,
  Alert,
  LinearProgress
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import WarningAmber from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTime from '@mui/icons-material/AccessTime';
import Timeline from '@mui/icons-material/Timeline';
import { getMachines, getMachineReadings, runPrediction, scheduleMaintenance } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideUp, fadeInUp, staggerContainer } from '../utils/animations';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

const RealTimeMonitor = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [updateInterval] = useState(30); // seconds
  const [autoRefresh] = useState(true); // removed setAutoRefresh since it's not used

  // Define fetchSensorData using useCallback before any useEffect that depends on it
  const fetchSensorData = useCallback(async () => {
    if (!selectedMachine) return;
    
    setLoading(true);
    try {
      // Fetch recent readings for the selected machine
      const params = {
        limit: 20, // Last 20 readings
      };
      
      const readings = await getMachineReadings(selectedMachine.equipment_id, params);
      console.log("Fetched sensor readings:", readings);
      setSensorData(readings);
      setLastUpdated(new Date());
      
      // Run prediction with the most recent reading
      if (readings && readings.length > 0) {
        const latestReading = readings[0];
        const predictionInput = {
          timestamp: latestReading.timestamp,
          equipment_id: selectedMachine.equipment_id,
          readings: {
            temperature: latestReading.temperature,
            vibration: latestReading.vibration,
            pressure: latestReading.pressure,
            oil_level: latestReading.oil_level
          }
        };
        
        console.log("Running prediction with input:", predictionInput);
        try {
          const predictionResult = await runPrediction(predictionInput);
          console.log("Prediction result:", predictionResult);
          setPrediction(predictionResult);
        } catch (predictionError) {
          console.error("Error running prediction:", predictionError);
          setError(`Failed to run prediction: ${predictionError.message}`);
        }
      } else {
        console.warn("No sensor readings available to run prediction");
      }
      
      setError(null);
    } catch (err) {
      console.error("Error in fetchSensorData:", err);
      setError('Failed to fetch sensor data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  // Run a prediction manually
  const handleRunPrediction = async () => {
    if (!selectedMachine || !sensorData || sensorData.length === 0) {
      setError('Cannot run prediction: No machine selected or no sensor data available');
      return;
    }
    
    setLoading(true);
    try {
      const latestReading = sensorData[0];
      const predictionInput = {
        timestamp: latestReading.timestamp,
        equipment_id: selectedMachine.equipment_id,
        readings: {
          temperature: latestReading.temperature,
          vibration: latestReading.vibration,
          pressure: latestReading.pressure,
          oil_level: latestReading.oil_level
        }
      };
      
      console.log("Manually running prediction with input:", predictionInput);
      const predictionResult = await runPrediction(predictionInput);
      console.log("Manual prediction result:", predictionResult);
      setPrediction(predictionResult);
      setError(null);
    } catch (err) {
      console.error("Error in manual prediction:", err);
      setError('Failed to run prediction: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch machines on component mount
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await getMachines();
        console.log("Fetched machines:", data);
        setMachines(data);
        // Select the first machine by default
        if (data.length > 0 && !selectedMachine) {
          setSelectedMachine(data[0]);
        }
      } catch (err) {
        console.error("Error fetching machines:", err);
        setError('Failed to fetch equipment list: ' + (err.message || 'Unknown error'));
      }
    };

    fetchMachines();
  }, [selectedMachine]);

  // Fetch sensor data for selected machine
  useEffect(() => {
    if (selectedMachine) {
      fetchSensorData();
    }
  }, [selectedMachine, fetchSensorData]);

  // Auto-refresh data
  useEffect(() => {
    let interval;
    
    if (autoRefresh && selectedMachine) {
      interval = setInterval(() => {
        fetchSensorData();
      }, updateInterval * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, updateInterval, selectedMachine, fetchSensorData]);

  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
  };
  
  const handleScheduleMaintenance = (machine) => {
    if (!machine) return;
    
    // Navigate to maintenance scheduler or open maintenance dialog
    console.log('Schedule maintenance for:', machine.equipment_id);
    alert(`Maintenance would be scheduled for ${machine.name}`);
    
    // You could also implement a call to scheduleMaintenance API here
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Format sensor data for chart with safety checks
  const chartData = sensorData.map(reading => {
    let timestamp;
    try {
      const date = new Date(reading.timestamp);
      timestamp = isNaN(date.getTime()) ? 'Invalid time' : date.toLocaleTimeString();
    } catch (err) {
      timestamp = 'Invalid time';
    }
    
    return {
      timestamp,
      temperature: reading.temperature,
      vibration: reading.vibration,
      pressure: reading.pressure,
      oil_level: reading.oil_level
    };
  }).reverse();

  // Helper function to safely access prediction values
  const getPredictionValue = (path, defaultValue = 0) => {
    if (!prediction) return defaultValue;
    
    const parts = path.split('.');
    let value = prediction;
    
    for (const part of parts) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return defaultValue;
      }
      value = value[part];
    }
    
    return value === null || value === undefined ? defaultValue : value;
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h2">
                Real-Time Equipment Monitor
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={fetchSensorData}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </motion.div>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Main content */}
        <Grid item xs={12} md={4}>
          <ScrollAnimationWrapper variants={slideUp}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Equipment List
              </Typography>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                </motion.div>
              )}
              
              {loading && machines.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <motion.div 
                    animate={{ 
                      rotate: 360,
                      transition: { 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }
                    }}
                  >
                    <CircularProgress />
                  </motion.div>
                </Box>
              ) : (
                <motion.div 
                  variants={staggerContainer}
                  style={{ opacity: 1 }}
                >
                  {machines.map((machine, index) => (
                    <motion.div 
                      key={machine.equipment_id} 
                      variants={fadeInUp}
                      custom={index}
                      whileHover={{ 
                        scale: 1.02, 
                        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" 
                      }}
                      style={{ opacity: 1 }}
                    >
                      <Paper 
                        elevation={selectedMachine?.equipment_id === machine.equipment_id ? 3 : 1}
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          cursor: 'pointer',
                          borderLeft: selectedMachine?.equipment_id === machine.equipment_id ? '4px solid #714955' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleSelectMachine(machine)}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {machine.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Type: {machine.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Location: {machine.location || 'Unknown'}
                        </Typography>
                      </Paper>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Paper>
          </ScrollAnimationWrapper>
        </Grid>
        
        {/* Sensor readings and visualization */}
        <Grid item xs={12} md={8}>
          <AnimatePresence mode="wait">
            {selectedMachine ? (
              <motion.div
                key={selectedMachine?.equipment_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ScrollAnimationWrapper variants={slideUp}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        {selectedMachine.name} - Sensor Readings
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={handleRunPrediction}
                            disabled={loading || !sensorData || sensorData.length === 0}
                          >
                            Run Prediction
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => handleScheduleMaintenance(selectedMachine)}
                          >
                            Schedule Maintenance
                          </Button>
                        </motion.div>
                      </Box>
                    </Box>
                    
                    {loading && (
                      <Box sx={{ width: '100%', mb: 2 }}>
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5 }}
                          style={{ transformOrigin: 'left' }}
                        >
                          <LinearProgress />
                        </motion.div>
                      </Box>
                    )}
                    
                    {sensorData && sensorData.length > 0 ? (
                      <Box sx={{ height: 250, mb: 3 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="temperature" stroke="#ff7300" name="Temperature (°C)" dot={{ r: 3 }} activeDot={{ r: 8 }} isAnimationActive={true} />
                            <Line type="monotone" dataKey="vibration" stroke="#387908" name="Vibration (mm/s)" dot={{ r: 3 }} activeDot={{ r: 8 }} isAnimationActive={true} />
                            <Line type="monotone" dataKey="pressure" stroke="#3366cc" name="Pressure (PSI)" dot={{ r: 3 }} activeDot={{ r: 8 }} isAnimationActive={true} />
                            <Line type="monotone" dataKey="oil_level" stroke="#714955" name="Oil Level (%)" dot={{ r: 3 }} activeDot={{ r: 8 }} isAnimationActive={true} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250, mb: 3 }}>
                        <Alert severity="warning">
                          No sensor data available for this equipment. Please refresh or select another equipment.
                        </Alert>
                      </Box>
                    )}
                    
                    {/* Rest of the component with prediction and analysis */}
                    {prediction && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" component="h4" gutterBottom>
                            <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Analysis
                          </Typography>
                          
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Parameter</TableCell>
                                  <TableCell align="right">Value</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>Failure Probability</TableCell>
                                  <TableCell align="right">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: '100%' }}
                                      transition={{ duration: 0.8 }}
                                    >
                                      {(getPredictionValue('failure_probability') * 100).toFixed(2)}%
                                    </motion.div>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Anomaly Detected</TableCell>
                                  <TableCell align="right">
                                    {getPredictionValue('anomaly_detected') ? 'Yes' : 'No'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Remaining Useful Life</TableCell>
                                  <TableCell align="right">
                                    {getPredictionValue('remaining_useful_life')} days
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Maintenance Status</TableCell>
                                  <TableCell align="right">
                                    {getPredictionValue('maintenance_status', 'Unknown')}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Next Maintenance Date</TableCell>
                                  <TableCell align="right">
                                    {formatDate(getPredictionValue('next_maintenance_date'))}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                        
                        {/* Maintenance recommendation section */}
                        {getPredictionValue('recommended_action') && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                          >
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="h6" component="h4" gutterBottom>
                                <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Maintenance Recommendation
                              </Typography>
                              
                              <Alert 
                                severity={
                                  getPredictionValue('failure_probability') > 0.6 ? "error" : 
                                  getPredictionValue('failure_probability') > 0.3 ? "warning" : 
                                  "info"
                                }
                                sx={{ mb: 2 }}
                              >
                                <Typography variant="body1">
                                  <strong>Recommended Action:</strong> {getPredictionValue('recommended_action')}
                                </Typography>
                                {getPredictionValue('recommendation_details') && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {getPredictionValue('recommendation_details')}
                                  </Typography>
                                )}
                              </Alert>
                            </Box>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </Paper>
                </ScrollAnimationWrapper>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h6">
                    Select a machine from the list to view real-time data
                  </Typography>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default RealTimeMonitor; 
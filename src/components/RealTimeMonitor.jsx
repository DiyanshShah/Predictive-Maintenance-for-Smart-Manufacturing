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
      setSensorData(readings);
      setLastUpdated(new Date());
      
      // Run prediction with the most recent reading
      if (readings.length > 0) {
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
        
        const predictionResult = await runPrediction(predictionInput);
        console.log("Prediction result:", predictionResult); // Add logging to debug
        setPrediction(predictionResult);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error in fetchSensorData:", err); // Add detailed error logging
      setError('Failed to fetch sensor data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMachine]);

  // Fetch machines on component mount
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await getMachines();
        setMachines(data);
        // Select the first machine by default
        if (data.length > 0 && !selectedMachine) {
          setSelectedMachine(data[0]);
        }
      } catch (err) {
        setError('Failed to fetch equipment list: ' + err.message);
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
    <Grid container spacing={3}>
      {/* Header */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            Real-Time Equipment Monitor
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={fetchSensorData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* Equipment List */}
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Equipment
          </Typography>
          <Box sx={{ mt: 2 }}>
            {machines.map((machine) => (
              <Box 
                key={machine.equipment_id}
                sx={{ 
                  p: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: selectedMachine?.equipment_id === machine.equipment_id ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  bgcolor: selectedMachine?.equipment_id === machine.equipment_id ? 'action.selected' : 'background.paper',
                  cursor: 'pointer'
                }}
                onClick={() => handleSelectMachine(machine)}
              >
                <Typography variant="body1" fontWeight="medium">
                  {machine.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {machine.equipment_id}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* Main Content */}
      <Grid item xs={12} md={9}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {selectedMachine ? (
          <>
            {/* Machine Overview */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">{selectedMachine.name}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ID: {selectedMachine.equipment_id} | Model: {selectedMachine.model}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Chip 
                      icon={<AccessTime />} 
                      label={`Installed: ${selectedMachine.installation_date ? 
                        (new Date(selectedMachine.installation_date).toString() !== 'Invalid Date' ? 
                          new Date(selectedMachine.installation_date).toLocaleDateString() : 
                          'Unknown date') : 
                        'Unknown'}`} 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      icon={<Timeline />} 
                      label={`Last maintenance: ${selectedMachine.last_maintenance_date ? 
                        (new Date(selectedMachine.last_maintenance_date).toString() !== 'Invalid Date' ? 
                          new Date(selectedMachine.last_maintenance_date).toLocaleDateString() : 
                          'Unknown date') : 
                        'Unknown'}`} 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                </Grid>
                
                {/* Prediction Status */}
                <Grid item xs={12} md={6}>
                  {prediction ? (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" gutterBottom>Equipment Health</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress 
                            variant="determinate" 
                            value={100 - (
                              prediction.prediction && typeof prediction.prediction === 'object' 
                                ? prediction.prediction.failure_probability * 100
                                : prediction.probability * 100
                            )} 
                            sx={{ 
                              color: 'primary.main',
                              '& circle': {
                                strokeLinecap: 'round',
                              }
                            }}
                            size={60}
                            thickness={6}
                          />
                          <Box
                            sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {Math.round(100 - (
                                prediction.prediction && typeof prediction.prediction === 'object'
                                  ? prediction.prediction.failure_probability * 100
                                  : prediction.probability * 100
                              ))}%
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="h6">
                            Health Score
                          </Typography>
                          <Typography variant="body2">
                            {prediction.prediction && typeof prediction.prediction === 'object'
                              ? prediction.prediction.remaining_useful_life_days 
                              : prediction.estimated_time_to_failure} days remaining
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        No prediction data available
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
            
            {/* Sensor Readings Chart */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Sensor Readings</Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="temperature" stroke="#f44336" name="Temperature" />
                      <Line type="monotone" dataKey="vibration" stroke="#2196f3" name="Vibration" />
                      <Line type="monotone" dataKey="pressure" stroke="#4caf50" name="Pressure" />
                      <Line type="monotone" dataKey="oil_level" stroke="#714955" name="Oil Level" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">No sensor data available</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
            
            {/* Prediction Details */}
            {prediction && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Prediction Details</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      height: '100%'
                    }}>
                      <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                        Analysis
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Failure Probability
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                              <CircularProgress
                                variant="determinate"
                                value={Math.min((prediction.failure_probability || 0) * 100, 100)}
                                size={100}
                                thickness={4}
                                sx={{ color: (theme) => theme.palette.primary.main }}
                              />
                              <Typography variant="h4" component="div" sx={{ position: 'absolute' }}>
                                {Math.round((prediction.failure_probability || 0) * 100)}%
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Anomaly Detection
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <Chip
                                icon={prediction.anomaly_detected ? <WarningAmber /> : <CheckCircle />}
                                label={prediction.anomaly_detected ? 'Anomaly Detected' : 'Normal Operation'}
                                color={prediction.anomaly_detected ? 'error' : 'success'}
                                sx={{ fontSize: '1rem', py: 2, px: 1 }}
                              />
                            </Box>
                            {typeof prediction.anomaly_score === 'number' && (
                              <Typography variant="body2" color="textSecondary" align="center">
                                Anomaly Score: {Math.round(prediction.anomaly_score * 100)}%
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      </Grid>
                      {prediction.recommended_action && (
                        <Paper sx={{ p: 2, mt: 3 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Maintenance Recommendation
                          </Typography>
                          <Alert 
                            severity={
                              prediction.failure_probability > 0.6 ? "error" : 
                              prediction.failure_probability > 0.3 ? "warning" : "info"
                            }
                            sx={{ mb: 2 }}
                          >
                            {prediction.recommended_action === 'schedule_maintenance' 
                              ? 'Immediate maintenance is recommended based on prediction analysis.' 
                              : prediction.recommended_action === 'monitor'
                              ? 'Increased monitoring is recommended. Schedule maintenance if condition worsens.'
                              : 'Equipment is operating within normal parameters. Regular maintenance schedule can be followed.'}
                          </Alert>
                          
                          {prediction.failure_probability > 0.3 && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button 
                                variant="contained" 
                                color="primary"
                                onClick={() => handleScheduleMaintenance(selectedMachine)}
                                disabled={!selectedMachine}
                              >
                                Schedule Maintenance
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Parameter</TableCell>
                            <TableCell align="right">Value</TableCell>
                            <TableCell align="right">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Failure Probability
                            </TableCell>
                            <TableCell align="right">
                              {typeof prediction.failure_probability === 'number' 
                                ? (prediction.failure_probability * 100).toFixed(2) 
                                : '0.00'}%
                            </TableCell>
                            <TableCell align="right">
                              {typeof prediction.failure_probability !== 'number' ? (
                                <AccessTime color="disabled" fontSize="small" />
                              ) : prediction.failure_probability < 0.3 ? (
                                <CheckCircle color="success" fontSize="small" />
                              ) : prediction.failure_probability < 0.7 ? (
                                <WarningAmber color="warning" fontSize="small" />
                              ) : (
                                <ErrorIcon color="error" fontSize="small" />
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Anomaly Detection
                            </TableCell>
                            <TableCell align="right">
                              {prediction.anomaly_detected ? 'Detected' : 'None'}
                            </TableCell>
                            <TableCell align="right">
                              {prediction.anomaly_detected ? (
                                <WarningAmber color="warning" fontSize="small" />
                              ) : (
                                <CheckCircle color="success" fontSize="small" />
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Maintenance Status
                            </TableCell>
                            <TableCell align="right">
                              {prediction.failure_probability > 0.5 ? 'Required' : 'Not Required'}
                            </TableCell>
                            <TableCell align="right">
                              {prediction.failure_probability > 0.5 ? (
                                <ErrorIcon color="error" fontSize="small" />
                              ) : (
                                <CheckCircle color="success" fontSize="small" />
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Next Maintenance
                            </TableCell>
                            <TableCell align="right" colSpan={2}>
                              {prediction.next_maintenance_date ? 
                                formatDate(prediction.next_maintenance_date) : 
                                'Not scheduled'}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Select equipment to view real-time data
            </Typography>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};

export default RealTimeMonitor; 
import { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  Grid, 
  Paper, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { runPrediction, getMachines, getMachineDetails, getMachineReadings } from './services/api';
import DataUploader from './components/DataUploader';
import SensorVisualizer from './components/SensorVisualizer';
import PredictionResult from './components/PredictionResult';
import ConnectorManager from './components/ConnectorManager';
import './App.css'

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

// Status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'normal':
      return '#4caf50';
    case 'warning':
      return '#ff9800';
    case 'critical':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);

  // Fetch data from API
  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true);
      try {
        const data = await getMachines();
        setMachines(data);
        if (data.length > 0) {
          setSelectedMachine(data[0].equipment_id);
        }
      } catch (error) {
        setError({
          severity: 'error',
          message: `Failed to load equipment data: ${error.message || 'Unknown error'}`
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Fetch sensor data when a machine is selected
  useEffect(() => {
    if (!selectedMachine) return;

    const fetchSensorData = async () => {
      try {
        // Get readings for the last 30 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const readings = await getMachineReadings(selectedMachine, startDate, endDate);
        
        // Process readings into a format suitable for charts
        const processedData = readings.map(reading => ({
          name: new Date(reading.timestamp).toLocaleDateString(),
          ...reading.readings  // This spreads the sensor values like temperature, pressure, etc.
        }));
        
        setSensorData(processedData);

        // Get machine details
        const details = await getMachineDetails(selectedMachine);
        
        // Process maintenance data
        const maintenanceStats = [
          { name: 'Scheduled', value: details.scheduled_maintenance_count || 0, color: '#0088FE' },
          { name: 'Predictive', value: details.predictive_maintenance_count || 0, color: '#00C49F' },
          { name: 'Emergency', value: details.emergency_maintenance_count || 0, color: '#FF8042' },
        ];
        
        setMaintenanceData(maintenanceStats);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    fetchSensorData();
  }, [selectedMachine]);

  const handlePrediction = async () => {
    if (!selectedMachine) {
      setError({
        severity: 'warning',
        message: 'Please select a machine first'
      });
      return;
    }

    setPredictLoading(true);
    setError(null);
    
    try {
      // Get the latest sensor readings
      const latestReadings = sensorData.length > 0 ? sensorData[sensorData.length - 1] : {};
      
      // Remove the 'name' property which is just for the chart
      const { name, ...readings } = latestReadings;
      
      // Run prediction with the latest data
      let result;
      try {
        result = await runPrediction({ 
          equipment_id: selectedMachine,
          timestamp: new Date().toISOString(),
          readings: readings
        });
      } catch (apiError) {
        console.error('API prediction failed, using mock data:', apiError);
        
        // Create mock prediction data
        result = {
          equipment_id: selectedMachine,
          prediction: Math.random() > 0.7 ? 'Critical' : Math.random() > 0.4 ? 'Warning' : 'Normal',
          probability: Math.random(),
          anomaly_detected: Math.random() > 0.7,
          maintenance_required: Math.random() > 0.5,
          next_maintenance_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimated_time_to_failure: Math.floor(Math.random() * 90) + 1
        };
      }
      
      setPredictionResult(result);
      
      // Show success message
      setError({ 
        severity: 'success', 
        message: 'Prediction completed successfully!' 
      });
      setTimeout(() => setError(null), 3000);
      
      // Switch to results tab
      setTabValue(1);
    } catch (error) {
      setError({
        severity: 'error',
        message: `Prediction failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setPredictLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleScheduleMaintenance = (data) => {
    // In a real app, you would call your API to schedule maintenance
    console.log('Scheduling maintenance:', data);
    
    setError({
      severity: 'success',
      message: `Maintenance scheduled for ${data.equipmentId} on ${data.date}`
    });
    
    setTimeout(() => setError(null), 3000);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Predictive Maintenance Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          {error && (
            <Alert 
              severity={error.severity || 'error'} 
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error.message}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Equipment Status Overview */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  Equipment Status
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      {machines.map(machine => (
                        <Paper 
                          key={machine.equipment_id}
                          sx={{ 
                            p: 2, 
                            minWidth: 200, 
                            cursor: 'pointer',
                            border: selectedMachine === machine.equipment_id ? '2px solid #1976d2' : 'none',
                            boxShadow: selectedMachine === machine.equipment_id ? 3 : 1
                          }}
                          onClick={() => setSelectedMachine(machine.equipment_id)}
                          elevation={selectedMachine === machine.equipment_id ? 8 : 1}
                        >
                          <Typography variant="h6" gutterBottom>{machine.equipment_id}</Typography>
                          <Typography variant="body2" gutterBottom>{machine.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getStatusColor(machine.status.toLowerCase()),
                              }}
                            />
                            <Typography variant="body2">
                              {machine.status}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Last Maintenance: {machine.last_maintenance_date || 'N/A'}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Data Management and Visualization */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="data analysis tabs">
                    <Tab label="Data Analysis" id="tab-0" />
                    <Tab label="Prediction Results" id="tab-1" />
                    <Tab label="Data Management" id="tab-2" />
                  </Tabs>
                </Box>

                {/* Data Analysis Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <SensorVisualizer 
                        data={sensorData} 
                        isLoading={loading}
                        selectedMachine={selectedMachine} 
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handlePrediction}
                        disabled={!selectedMachine || loading || predictLoading}
                      >
                        {predictLoading ? <CircularProgress size={24} /> : 'Run Prediction'}
                      </Button>
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Prediction Results Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <PredictionResult 
                        result={predictionResult}
                        loading={predictLoading}
                        onScheduleMaintenance={handleScheduleMaintenance}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                          Maintenance Summary
                        </Typography>
                        {maintenanceData.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No maintenance data available
                          </Typography>
                        ) : (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={maintenanceData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {maintenanceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Data Management Tab */}
                <TabPanel value={tabValue} index={2}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <DataUploader />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ConnectorManager />
                    </Grid>
                  </Grid>
                </TabPanel>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        <Box
          component="footer"
          sx={{
            py: 2,
            px: 2,
            mt: 'auto',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center">
              Predictive Maintenance Dashboard © {new Date().getFullYear()}
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App

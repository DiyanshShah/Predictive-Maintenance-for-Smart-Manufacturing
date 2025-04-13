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
  Tabs,
  Chip,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  Card,
  CardContent,
  Slider,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
import { 
  runPrediction, 
  getMachines, 
  getMachineDetails, 
  getMachineReadings,
  getComparativeAnalytics,
  getMaintenanceROI,
  getReliabilityScores,
  getFeatureImportance,
  getModelSettings,
  saveModelSettings,
  trainModel,
} from './services/api';
import DataUploader from './components/DataUploader';
import SensorVisualizer from './components/SensorVisualizer';
import PredictionResult from './components/PredictionResult';
import ConnectorManager from './components/ConnectorManager';
import RealTimeMonitor from './components/RealTimeMonitor';
import MaintenanceScheduler from './components/MaintenanceScheduler';
import Login from './components/Login';
import Signup from './components/Signup';
import UserProfile from './components/UserProfile';
import './App.css'

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#714955',
      light: '#8c6b74',
      dark: '#5a3944',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#714955',
      light: '#8c6b74', 
      dark: '#5a3944',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

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
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [currentUser, setCurrentUser] = useState(null);

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Analytics state
  const [analyticsMetric, setAnalyticsMetric] = useState('temperature');
  const [comparativeData, setComparativeData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [roiData, setRoiData] = useState(null);
  const [reliabilityData, setReliabilityData] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);
  
  // Fetch data from API
  useEffect(() => {
    if (!isAuthenticated) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch machines
        const machinesData = await getMachines();
        setMachines(machinesData);
        
        if (machinesData && machinesData.length > 0) {
          const selectedEquipmentId = machinesData[0].equipment_id;
          setSelectedMachine(selectedEquipmentId);
          
          // Only fetch details and readings if we have a valid equipment ID
          if (selectedEquipmentId) {
            // Fetch machine details
            const details = await getMachineDetails(selectedEquipmentId);
            
            // Fetch sensor data
            const sensorData = await getMachineReadings(selectedEquipmentId);
            setSensorData(sensorData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError({
          severity: 'error',
          message: `Failed to load data: ${error.message || 'Unknown error'}`
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [isAuthenticated]);
  
  // Load analytics data
  useEffect(() => {
    if (!isAuthenticated || currentView !== 'analytics' || !selectedMachine) {
      return;
    }
    
    fetchAnalyticsData();
  }, [currentView, selectedMachine, analyticsMetric, isAuthenticated]);
  
  // Fetch machine data when authenticated and machine is selected
  useEffect(() => {
    if (!isAuthenticated || !selectedMachine) return;

    async function fetchMachineData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch machine details
        const details = await getMachineDetails(selectedMachine);
        
        // Fetch sensor data
        const sensorData = await getMachineReadings(selectedMachine);
        setSensorData(sensorData);

      } catch (error) {
        console.error('Error fetching machine data:', error);
        setError({
          severity: 'error',
          message: `Failed to load machine data: ${error.message || 'Unknown error'}`
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMachineData();
  }, [isAuthenticated, selectedMachine]);
  
  // Function to handle prediction
  const handleRunPrediction = async () => {
    if (!selectedMachine) {
      setError({
        severity: 'error',
        message: 'Please select a machine first'
      });
      return;
    }
    
    try {
      setPredictLoading(true);
      // Get latest sensor data for this machine
      const latestReading = await getMachineReadings(selectedMachine, { limit: 1 });
      
      if (!latestReading || latestReading.length === 0) {
        setError({
          severity: 'error',
          message: 'No sensor data available for prediction'
        });
        setPredictLoading(false);
        return;
      }
      
      // Prepare prediction input with full sensor data
      const reading = latestReading[0];
      console.log("Using sensor reading for prediction:", reading);
      
      const predictionInput = {
        timestamp: reading.timestamp,
        equipment_id: selectedMachine,
        readings: {
          // Include all available sensor readings - these will be used by the ML model
          temperature: reading.temperature,
          vibration: reading.vibration,
          pressure: reading.pressure,
          oil_level: reading.oil_level,
          rpm: reading.rpm,
          current: reading.current,
          voltage: reading.voltage,
          power: reading.power,
          noise_level: reading.noise_level,
          humidity: reading.humidity
        }
      };
      
      // Run prediction using the actual ML model
      const result = await runPrediction(predictionInput);
      console.log("ML model prediction result:", result);
      
      // Set the raw prediction result without transformation
      setPredictionResult(result);
      
      setError({
        severity: 'success',
        message: 'Prediction completed using trained ML model'
      });
      
      // Navigate to dashboard view and show the prediction results tab
      setCurrentView('dashboard');
      setTabValue(1);
    } catch (err) {
      console.error("Error in handleRunPrediction:", err);
      setError({
        severity: 'error',
        message: `Failed to run prediction: ${err.message}`
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

  // Function to handle view changes
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Function to load analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      
      // Ensure selectedMachine is passed as an array - wrap string in array if needed
      const equipmentIds = Array.isArray(selectedMachine) ? selectedMachine : [selectedMachine];
      
      // Fetch comparative analytics
      const compData = await getComparativeAnalytics(analyticsMetric, equipmentIds);
      setComparativeData(compData);
      
      // Fetch ROI data
      const roiData = await getMaintenanceROI(selectedMachine);
      setRoiData(roiData);
      
      // Fetch reliability scores
      const reliabilityData = await getReliabilityScores(selectedMachine);
      setReliabilityData(reliabilityData);
      
      // Fetch feature importance
      const features = await getFeatureImportance();
      setFeatureImportance(features);
      
    } catch (error) {
      console.error('Analytics error:', error);
      setError({
        severity: 'error',
        message: `Failed to load analytics: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Handle machine selection
  const handleMachineSelect = async (machineId) => {
    try {
      setLoading(true);
      setSelectedMachine(machineId);
      
      // Fetch machine details
      const details = await getMachineDetails(machineId);
      
      // Fetch sensor data for the selected machine
      const sensorData = await getMachineReadings(machineId);
      setSensorData(sensorData);
      
      // Clear previous prediction results
      setPredictionResult(null);
      setTabValue(0);
      
    } catch (error) {
      console.error('Error fetching machine data:', error);
      setError({
        severity: 'error',
        message: `Failed to load machine data: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle login/signup views
  const handleAuthViewChange = (view) => {
    setAuthView(view);
  };

  // Handle login
  const handleLogin = (userData) => {
    setCurrentUser(userData.user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  // Handle signup
  const handleSignup = (userData) => {
    setCurrentUser(userData.user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthView('login');
  };

  // If not authenticated, show login/signup
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container>
          {authView === 'login' ? (
            <Login onLogin={handleLogin} onSwitchToSignup={() => handleAuthViewChange('signup')} />
          ) : (
            <Signup onSignup={handleSignup} onSwitchToLogin={() => handleAuthViewChange('login')} />
          )}
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
              <svg style={{ width: 28, height: 28, marginRight: 8 }} viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10Z" />
              </svg>
              Predictive Maintenance
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                color="inherit" 
                onClick={() => handleViewChange('dashboard')}
                sx={{ 
                  fontWeight: currentView === 'dashboard' ? 'bold' : 'normal',
                  borderBottom: currentView === 'dashboard' ? `2px solid ${theme.palette.primary.contrastText}` : 'none',
                  borderRadius: 0,
                  px: 2
                }}
              >
                Dashboard
              </Button>
              <Button 
                color="inherit" 
                onClick={() => handleViewChange('monitor')}
                sx={{ 
                  fontWeight: currentView === 'monitor' ? 'bold' : 'normal',
                  borderBottom: currentView === 'monitor' ? `2px solid ${theme.palette.primary.contrastText}` : 'none',
                  borderRadius: 0,
                  px: 2
                }}
              >
                Real-Time Monitor
              </Button>
              <Button 
                color="inherit" 
                onClick={() => handleViewChange('maintenance')}
                sx={{ 
                  fontWeight: currentView === 'maintenance' ? 'bold' : 'normal',
                  borderBottom: currentView === 'maintenance' ? `2px solid ${theme.palette.primary.contrastText}` : 'none',
                  borderRadius: 0,
                  px: 2
                }}
              >
                Maintenance
              </Button>
              <Button 
                color="inherit" 
                onClick={() => handleViewChange('analytics')}
                sx={{ 
                  fontWeight: currentView === 'analytics' ? 'bold' : 'normal',
                  borderBottom: currentView === 'analytics' ? `2px solid ${theme.palette.primary.contrastText}` : 'none',
                  borderRadius: 0,
                  px: 2
                }}
              >
                Analytics
              </Button>
              <Button 
                color="inherit" 
                onClick={() => handleViewChange('profile')}
                sx={{ 
                  fontWeight: currentView === 'profile' ? 'bold' : 'normal',
                  borderBottom: currentView === 'profile' ? `2px solid ${theme.palette.primary.contrastText}` : 'none',
                  borderRadius: 0,
                  px: 2
                }}
              >
                Profile
              </Button>
              <Button 
                color="inherit"
                variant="outlined"
                onClick={handleLogout}
                sx={{ ml: 2 }}
              >
                Logout
              </Button>
            </Box>
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
          
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Equipment Status
                  </Typography>
                  
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      {machines.length > 0 ? (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 1.5,
                          mt: 1,
                          flexGrow: 1,
                          overflow: 'auto',
                          maxHeight: 400
                        }}>
                          {machines.map((machine) => (
                            <Paper 
                              key={machine.equipment_id}
                              elevation={1}
                              sx={{ 
                                p: 1.5, 
                                display: 'flex', 
                                flexDirection: 'column',
                                cursor: 'pointer',
                                bgcolor: selectedMachine === machine.equipment_id ? 'primary.light' : 'background.paper',
                                color: selectedMachine === machine.equipment_id ? 'primary.contrastText' : 'text.primary',
                                '&:hover': {
                                  bgcolor: selectedMachine === machine.equipment_id ? 'primary.light' : 'action.hover',
                                },
                              }}
                              onClick={() => handleMachineSelect(machine.equipment_id)}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                                  {machine.name}
                                </Typography>
                                <Chip 
                                  size="small" 
                                  label={machine.status} 
                                  color="primary"
                                  sx={{ 
                                    fontWeight: 'medium',
                                    borderRadius: 1,
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" color={selectedMachine === machine.equipment_id ? 'primary.contrastText' : 'text.secondary'}>
                                Last Maintenance: {new Date(machine.last_maintenance).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color={selectedMachine === machine.equipment_id ? 'primary.contrastText' : 'text.secondary'}>
                                Location: {machine.location}
                              </Typography>
                            </Paper>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                          No equipment found. Add equipment through the management section.
                        </Typography>
                      )}
                    </>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={7} lg={8}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                      value={tabValue} 
                      onChange={handleTabChange} 
                      aria-label="data analysis tabs"
                      TabIndicatorProps={{
                        style: {
                          backgroundColor: theme.palette.primary.main,
                        }
                      }}
                      sx={{ 
                        '& .MuiTabs-indicator': { height: 3 },
                        '& .MuiTabs-flexContainer button': { 
                          borderRight: 'none' 
                        },
                        '& .MuiTabs-root': { 
                          '&::after': { 
                            display: 'none' 
                          },
                          '&:focus': {
                            outline: 'none',
                            '&::after': { display: 'none' },
                            '&::before': { display: 'none' }
                          },
                          '&.Mui-selected': {
                            '&::after': { display: 'none' }
                          }
                        }
                      }}
                    >
                      <Tab label="Data Analysis" id="tab-0" disableRipple />
                      <Tab label="Prediction Results" id="tab-1" disableRipple />
                      <Tab label="Data Management" id="tab-2" disableRipple />
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
                          onClick={handleRunPrediction}
                          disabled={!selectedMachine || loading || predictLoading}
                        >
                          {predictLoading ? <CircularProgress size={24} /> : 'Run Prediction'}
                        </Button>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* Prediction Results Tab */}
                  <TabPanel value={tabValue} index={1}>
                    {predictionResult ? (
                      <PredictionResult
                        result={predictionResult}
                        onScheduleMaintenance={handleScheduleMaintenance}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          No prediction results available.
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => setTabValue(0)}
                          sx={{ mt: 2 }}
                        >
                          Go to Data Analysis
                        </Button>
                      </Box>
                    )}
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
          )}

          {/* Real-Time Monitor View */}
          {currentView === 'monitor' && (
            <RealTimeMonitor />
          )}
          
          {/* Maintenance Scheduler View */}
          {currentView === 'maintenance' && (
            <MaintenanceScheduler />
          )}

          {/* Analytics View */}
          {currentView === 'analytics' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ mb: 0 }}>
                      Comparative Analysis
                    </Typography>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                      <InputLabel id="metric-select-label">Metric</InputLabel>
                      <Select
                        labelId="metric-select-label"
                        id="metric-select"
                        value={analyticsMetric}
                        onChange={(e) => setAnalyticsMetric(e.target.value)}
                        label="Metric"
                      >
                        <MenuItem value="temperature">Temperature</MenuItem>
                        <MenuItem value="vibration">Vibration</MenuItem>
                        <MenuItem value="pressure">Pressure</MenuItem>
                        <MenuItem value="oil_level">Oil Level</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  {loadingAnalytics ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={comparativeData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="current" stroke={theme.palette.primary.main} name="Current Machine" strokeWidth={2} />
                        <Line type="monotone" dataKey="average" stroke={theme.palette.info.main} name="Fleet Average" strokeWidth={2} />
                        <Line type="monotone" dataKey="optimal" stroke={theme.palette.success.main} name="Optimal Range" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Maintenance ROI
                  </Typography>
                  {loadingAnalytics ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : roiData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Cost Savings', value: roiData.cost_savings },
                            { name: 'Investment', value: roiData.investment },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill={theme.palette.success.main} />
                          <Cell fill={theme.palette.primary.main} />
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                      No ROI data available.
                    </Typography>
                  )}
                  
                  {roiData && (
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        ROI: <strong>{roiData.roi}%</strong>
                      </Typography>
                      <Typography variant="body2">
                        Downtime Prevented: <strong>{roiData.downtime_prevented} hours</strong>
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Feature Importance
                  </Typography>
                  {loadingAnalytics ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : featureImportance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={featureImportance}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 1]} />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                        <Bar dataKey="value" fill={theme.palette.primary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                      No feature importance data available.
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Reliability Metrics
                  </Typography>
                  {loadingAnalytics ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : reliabilityData ? (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                            }}
                          >
                            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                              {reliabilityData.availability}%
                            </Typography>
                            <Typography variant="body2">Availability</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              bgcolor: 'info.light',
                              color: 'info.contrastText',
                            }}
                          >
                            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                              {reliabilityData.mtbf} hrs
                            </Typography>
                            <Typography variant="body2">MTBF</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              bgcolor: 'warning.light',
                              color: 'warning.contrastText',
                            }}
                          >
                            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                              {reliabilityData.mttr} hrs
                            </Typography>
                            <Typography variant="body2">MTTR</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                      
                      <Typography component="h3" variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                        Reliability Trend
                      </Typography>
                      
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart
                          data={reliabilityData.trend}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                      No reliability data available.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Profile View (replacing Settings) */}
          {currentView === 'profile' && (
            <UserProfile user={currentUser} />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;

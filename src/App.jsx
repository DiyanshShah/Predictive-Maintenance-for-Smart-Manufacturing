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
  TableRow,
  Avatar,
  Badge,
  Menu,
  Tooltip
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
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
import { motion, AnimatePresence } from 'framer-motion';
import DataUploader from './components/DataUploader';
import SensorVisualizer from './components/SensorVisualizer';
import PredictionResult from './components/PredictionResult';
import ConnectorManager from './components/ConnectorManager';
import RealTimeMonitor from './components/RealTimeMonitor';
import MaintenanceScheduler from './components/MaintenanceScheduler';
import Login from './components/Login';
import Signup from './components/Signup';
import UserProfile from './components/UserProfile';
import { fadeIn, slideUp, fadeInUp } from './utils/animations';
import './App.css'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MonitorIcon from '@mui/icons-material/Monitor';
import BuildIcon from '@mui/icons-material/Build';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import SettingsIcon from '@mui/icons-material/Settings';

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
  
  // Page change animation variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  // Tab change animation variants
  const tabVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

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
        
        // Check if we have any machines
        if (machinesData && machinesData.length > 0) {
          // Select the first machine
          const firstMachine = machinesData[0];
          setSelectedMachine(firstMachine);
          
          // Fetch sensor data for the selected machine
          const rawSensorData = await getMachineReadings(firstMachine.equipment_id);
          
          // Format data for the chart
          const formattedData = rawSensorData.map(reading => {
            // Format timestamp for display
            const date = new Date(reading.timestamp);
            const formattedTime = date.toLocaleTimeString();
            
            // Make sure all needed properties exist
            return {
              ...reading,
              name: formattedTime,
              // Ensure all sensor types have at least a default value
              temperature: reading.temperature || 0,
              vibration: reading.vibration || 0,
              pressure: reading.pressure || 0,
              oil_level: reading.oil_level || 0
            };
          });
          
          console.log("Initial sensor data:", formattedData);
          setSensorData(formattedData);
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
      const latestReading = await getMachineReadings(selectedMachine.equipment_id, { limit: 1 });
      
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
        equipment_id: selectedMachine.equipment_id,
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
      
      // Find the machine object from the machines array
      const machine = machines.find(m => m.equipment_id === machineId);
      
      if (!machine) {
        console.error(`Machine with ID ${machineId} not found in machines list`);
        setError({
          severity: 'error',
          message: 'Selected machine not found'
        });
        setLoading(false);
        return;
      }
      
      console.log(`Selected machine: ${machine.name} (${machine.equipment_id})`);
      
      // Set the full machine object, not just the ID
      setSelectedMachine(machine);
      
      // Fetch sensor data for the selected machine
      console.log(`Fetching sensor data for ${machine.equipment_id}`);
      const rawSensorData = await getMachineReadings(machineId);
      console.log(`Received ${rawSensorData?.length || 0} sensor readings`);
      
      if (!rawSensorData || !Array.isArray(rawSensorData) || rawSensorData.length === 0) {
        console.warn(`No sensor data available for ${machine.equipment_id}`);
        setSensorData([]);
        setLoading(false);
        return;
      }
      
      // Format data for the chart
      const formattedData = rawSensorData.map(reading => {
        // Format timestamp for display
        let formattedTime = 'Unknown';
        try {
          const date = new Date(reading.timestamp);
          formattedTime = isNaN(date.getTime()) ? 'Invalid time' : date.toLocaleTimeString();
        } catch (err) {
          console.error('Error formatting timestamp:', err);
        }
        
        // Make sure all needed properties exist
        return {
          ...reading,
          name: formattedTime,
          // Ensure all sensor types have at least a default value
          temperature: typeof reading.temperature === 'number' ? reading.temperature : 0,
          vibration: typeof reading.vibration === 'number' ? reading.vibration : 0,
          pressure: typeof reading.pressure === 'number' ? reading.pressure : 0,
          oil_level: typeof reading.oil_level === 'number' ? reading.oil_level : 0
        };
      });
      
      console.log(`Formatted ${formattedData.length} sensor readings for display`);
      console.log("Sensor data sample:", formattedData[0]);
      setSensorData(formattedData);
      
      // Clear previous prediction results
      setPredictionResult(null);
      
    } catch (error) {
      console.error('Error fetching machine data:', error);
      setError({
        severity: 'error',
        message: `Failed to load machine data: ${error.message || 'Unknown error'}`
      });
      setSensorData([]);
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {isAuthenticated ? (
          <>
            <AppBar 
              position="sticky" 
              color="primary" 
              elevation={4} 
              sx={{ 
                background: 'linear-gradient(90deg, #5a3944 0%, #714955 100%)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <Toolbar sx={{ minHeight: '70px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <PrecisionManufacturingIcon sx={{ mr: 1, fontSize: 28 }} />
                  <Typography 
                    variant="h5" 
                    component="div" 
                    sx={{ 
                      flexGrow: 1, 
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Predictify
                  </Typography>
                </Box>
                
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      color="inherit" 
                      onClick={() => setCurrentView('dashboard')}
                      variant={currentView === 'dashboard' ? 'contained' : 'text'}
                      startIcon={<DashboardIcon />}
                      sx={{ 
                        mx: 1, 
                        px: 2,
                        borderRadius: '20px',
                        backgroundColor: currentView === 'dashboard' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        '&:hover': {
                          backgroundColor: currentView === 'dashboard' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      Dashboard
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      color="inherit" 
                      onClick={() => setCurrentView('realtime')}
                      variant={currentView === 'realtime' ? 'contained' : 'text'}
                      startIcon={<MonitorIcon />}
                      sx={{ 
                        mx: 1, 
                        px: 2,
                        borderRadius: '20px',
                        backgroundColor: currentView === 'realtime' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        '&:hover': {
                          backgroundColor: currentView === 'realtime' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      Monitor
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      color="inherit" 
                      onClick={() => setCurrentView('maintenance')}
                      variant={currentView === 'maintenance' ? 'contained' : 'text'}
                      startIcon={<BuildIcon />}
                      sx={{ 
                        mx: 1, 
                        px: 2,
                        borderRadius: '20px',
                        backgroundColor: currentView === 'maintenance' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        '&:hover': {
                          backgroundColor: currentView === 'maintenance' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      Maintenance
                    </Button>
                  </motion.div>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Notifications">
                    <IconButton color="inherit" sx={{ mx: 1 }}>
                      <Badge badgeContent={3} color="error">
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Settings">
                    <IconButton color="inherit" sx={{ mx: 1 }}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      color="inherit"
                      onClick={() => setCurrentView('profile')}
                      startIcon={
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: currentView === 'profile' ? 'primary.dark' : 'rgba(255, 255, 255, 0.2)',
                            border: '2px solid rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      }
                      sx={{ 
                        ml: 1,
                        borderRadius: '20px', 
                        px: 2, 
                        textTransform: 'none',
                        backgroundColor: currentView === 'profile' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        '&:hover': {
                          backgroundColor: currentView === 'profile' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      Profile
                    </Button>
                  </motion.div>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outlined"
                      color="inherit" 
                      onClick={handleLogout}
                      startIcon={<LogoutIcon />}
                      sx={{ 
                        borderColor: 'rgba(255,255,255,0.5)',
                        borderRadius: '20px',
                        '&:hover': {
                          borderColor: 'rgba(255,255,255,0.8)',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </motion.div>
                </Box>
              </Toolbar>
            </AppBar>
            
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  {currentView === 'dashboard' && (
                    <Box>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>
                        </motion.div>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <Grid container spacing={3}>
                          {/* Equipment Status */}
                          <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Equipment Status
                              </Typography>
                              {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                  <motion.div 
                                    animate={{ 
                                      rotate: 360,
                                      transition: { duration: 2, repeat: Infinity, ease: "linear" }
                                    }}
                                  >
                                    <CircularProgress />
                                  </motion.div>
                                </Box>
                              ) : (
                                <motion.div
                                  variants={fadeIn}
                                  initial="hidden"
                                  animate="visible"
                                  style={{ opacity: 1 }}
                                >
                                  <Grid container spacing={2}>
                                    {machines.map((machine, index) => (
                                      <Grid item xs={12} sm={6} md={4} key={machine.equipment_id}>
                                        <motion.div 
                                          variants={fadeInUp}
                                          custom={index * 0.1}
                                          whileHover={{ 
                                            y: -5, 
                                            transition: { duration: 0.2 },
                                            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)"
                                          }}
                                          style={{ opacity: 1 }}
                                        >
                                          <Paper 
                                            elevation={selectedMachine?.equipment_id === machine.equipment_id ? 3 : 1}
                                            sx={{ 
                                              p: 2, 
                                              cursor: 'pointer',
                                              height: '100%',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              borderLeft: selectedMachine?.equipment_id === machine.equipment_id ? '4px solid #714955' : 'none',
                                              opacity: 1,
                                            }}
                                            onClick={() => handleMachineSelect(machine.equipment_id)}
                                          >
                                            <Typography variant="h6" component="h3">
                                              {machine.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                              {machine.type} - {machine.model}
                                            </Typography>
                                            <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                              <Typography variant="body2">
                                                Last Maintenance:
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                {machine.last_maintenance_date ? 
                                                  new Date(machine.last_maintenance_date).toLocaleDateString() : 
                                                  'Never'}
                                              </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                              <Typography variant="body2">
                                                Location:
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                {machine.location || 'Unknown'}
                                              </Typography>
                                            </Box>
                                          </Paper>
                                        </motion.div>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </motion.div>
                              )}
                            </Paper>
                          </Grid>
                          
                          {/* Recent Alerts */}
                          <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Recent Alerts
                              </Typography>
                              
                              {/* Add alerts here */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                                {/* Placeholder content when no alerts are available */}
                                <Box sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center',
                                  justifyContent: 'center', 
                                  textAlign: 'center',
                                  py: 3,
                                  height: '100%'
                                }}>
                                  <Box sx={{ 
                                    bgcolor: 'background.paper', 
                                    p: 2, 
                                    borderRadius: 1,
                                    width: '100%',
                                    mb: 2
                                  }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                      <Typography variant="body1" color="text.primary">
                                        All systems operating normally
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                      No active alerts at this time
                                    </Typography>
                                  </Box>
                                  
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Alerts will appear here when equipment requires attention
                                  </Typography>
                                  
                                  <Button 
                                    size="small" 
                                    startIcon={<NotificationsIcon />}
                                    variant="outlined"
                                    sx={{ mt: 1 }}
                                  >
                                    Configure Alert Settings
                                  </Button>
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                          
                          {/* Data Tabs */}
                          <Grid item xs={12}>
                            <Paper sx={{ width: '100%' }}>
                              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs 
                                  value={tabValue} 
                                  onChange={handleTabChange} 
                                  aria-label="data tabs"
                                  variant="scrollable"
                                  scrollButtons="auto"
                                >
                                  <Tab label="Data Analysis" />
                                  <Tab label="Prediction Results" />
                                  <Tab label="Data Management" />
                                </Tabs>
                              </Box>
                              
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={tabValue}
                                  initial="initial"
                                  animate="animate"
                                  exit="exit"
                                  variants={tabVariants}
                                >
                                  <TabPanel value={tabValue} index={0}>
                                    <Grid container spacing={3}>
                                      <Grid item xs={12}>
                                        <SensorVisualizer 
                                          data={sensorData} 
                                          isLoading={loading} 
                                          selectedMachine={selectedMachine?.name}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                          <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleRunPrediction}
                                            disabled={!selectedMachine || predictLoading}
                                            startIcon={predictLoading ? <CircularProgress size={24} color="inherit" /> : null}
                                          >
                                            {predictLoading ? 'Running Prediction...' : 'Run Prediction'}
                                          </Button>
                                        </motion.div>
                                      </Grid>
                                    </Grid>
                                  </TabPanel>
                                  
                                  <TabPanel value={tabValue} index={1}>
                                    <Grid container spacing={3}>
                                      <Grid item xs={12}>
                                        <PredictionResult 
                                          predictionResult={predictionResult}
                                          isLoading={predictLoading}
                                        />
                                      </Grid>
                                      {!predictionResult && !predictLoading && (
                                        <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
                                          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
                                            No prediction results yet. Go to the Data Analysis tab to run a prediction.
                                          </Alert>
                                        </Grid>
                                      )}
                                    </Grid>
                                  </TabPanel>
                                  
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
                                </motion.div>
                              </AnimatePresence>
                            </Paper>
                          </Grid>
                        </Grid>
                      </motion.div>
                    </Box>
                  )}
                  
                  {currentView === 'realtime' && (
                    <RealTimeMonitor />
                  )}
                  
                  {currentView === 'maintenance' && (
                    <MaintenanceScheduler />
                  )}
                  
                  {currentView === 'profile' && (
                    <UserProfile user={currentUser} />
                  )}
                </motion.div>
              </AnimatePresence>
            </Container>
          </>
        ) : (
          <Container maxWidth="sm" sx={{ mt: 8 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={authView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
                  {authView === 'login' ? (
                    <Login 
                      onLogin={handleLogin}
                      onViewChange={() => handleAuthViewChange('signup')}
                    />
                  ) : (
                    <Signup 
                      onSignup={handleSignup}
                      onViewChange={() => handleAuthViewChange('login')}
                    />
                  )}
                </Paper>
              </motion.div>
            </AnimatePresence>
          </Container>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;

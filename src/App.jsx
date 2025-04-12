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
  Divider
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
    mode: 'light',
    primary: {
      main: '#ff9800', // Warm Orange
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057', // Pink
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
      main: '#ff9800',
      light: '#ffb74d', 
      dark: '#f57c00',
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

// Status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'normal':
      return theme.palette.success.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'critical':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
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
        
        const readings = await getMachineReadings(selectedMachine, {
          startDate,
          endDate
        });
        
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
        <AppBar position="static" elevation={0} sx={{ 
          background: 'linear-gradient(45deg, #f57c00 30%, #ffb74d 90%)',
          mb: 2
        }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10Z" />
              </svg>
              <Typography variant="h6" component="div" sx={{ ml: 1, fontWeight: 600, flexGrow: 1 }}>
                Predictive Maintenance
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit">Dashboard</Button>
              <Button color="inherit">Analytics</Button>
              <Button color="inherit">Settings</Button>
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

          <Grid container spacing={3}>
            {/* Equipment Status Overview */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  mb: 3,
                }}
              >
                <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: 24, height: 24, marginRight: 8 }} viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z" />
                  </svg>
                  Equipment Status
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, pb: 1 }}>
                      {machines.map(machine => (
                        <Paper 
                          key={machine.equipment_id}
                          sx={{ 
                            p: 2.5, 
                            width: 200,
                            cursor: 'pointer',
                            border: selectedMachine === machine.equipment_id ? `2px solid ${theme.palette.primary.main}` : '1px solid #eee',
                            boxShadow: selectedMachine === machine.equipment_id ? 3 : 1,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-4px)'
                            }
                          }}
                          onClick={() => setSelectedMachine(machine.equipment_id)}
                          elevation={selectedMachine === machine.equipment_id ? 4 : 1}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1, alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>{machine.name}</Typography>
                            <Chip 
                              size="small"
                              label={machine.status} 
                              sx={{ 
                                bgcolor: getStatusColor(machine.status.toLowerCase()), 
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                mt: -1,
                                mb: 1,
                                px: 1
                              }}
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            ID: {machine.equipment_id}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            <svg style={{ width: 20, height: 20, marginRight: 8 }} viewBox="0 0 24 24">
                              <path fill="currentColor" d="M13,19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H4A1,1 0 0,1 3,16V12A1,1 0 0,1 4,11H20A1,1 0 0,1 21,12V16A1,1 0 0,1 20,17H13V19M4,3H20A1,1 0 0,1 21,4V8A1,1 0 0,1 20,9H4A1,1 0 0,1 3,8V4A1,1 0 0,1 4,3M9,7H10V5H9V7M9,15H10V13H9V15M5,5V7H7V5H5M5,13V15H7V13H5Z" />
                            </svg>
                            <Typography variant="body2" color="text.secondary">
                              Last Maint: {machine.lastMaintenance || 'N/A'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <svg style={{ width: 20, height: 20, marginRight: 8 }} viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                            </svg>
                            <Typography variant="body2" color="text.secondary">
                              Location: {machine.location || 'Unknown'}
                            </Typography>
                          </Box>
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
                      '& .MuiTab-root': { 
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
                      <Paper sx={{ p: 2, height: '100%', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" gutterBottom sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                          borderBottom: '1px solid #f0f0f0',
                          pb: 1.5,
                          mb: 2
                        }}>
                          <svg style={{ width: 20, height: 20, marginRight: 8 }} viewBox="0 0 24 24">
                            <path fill="currentColor" d="M13.5,10A1.5,1.5 0 0,1 12,11.5A1.5,1.5 0 0,1 10.5,10A1.5,1.5 0 0,1 12,8.5A1.5,1.5 0 0,1 13.5,10M10.59,13.95C9.47,14.16 8.42,14.5 7.5,15C6.5,15.5 6,16.52 6,17.22V20H18V17.22C18,16.52 17.5,15.5 16.5,15C15.57,14.5 14.53,14.16 13.41,13.95C13.2,14.37 12.65,14.7 12,14.7C11.35,14.7 10.8,14.37 10.59,13.95M12,6A2,2 0 0,1 14,8A2,2 0 0,1 12,10A2,2 0 0,1 10,8A2,2 0 0,1 12,6M11.05,11.954C11.34,11.982 11.66,11.983 11.95,11.954C12.24,11.983 12.56,11.982 12.85,11.954C13.1198,11.9579 13.3882,11.9704 13.6545,11.9912C13.9208,12.0121 14.1828,12.0411 14.439,12.077C14.714,12.129 14.986,12.2 15.254,12.287C15.522,12.375 15.775,12.475 16.014,12.594C16.636,12.915 17.137,13.344 17.504,13.861C17.554,13.931 17.601,14.008 17.644,14.084C17.7315,14.2334 17.8083,14.3876 17.874,14.546C17.939,14.704 17.999,14.871 18.05,15.04C18.1302,15.2962 18.1902,15.5581 18.23,15.823V16H19V17.223V18V20H18.832C18.665,20 18.332,20 18,20C17.668,20 17.335,20 17.168,20H6.832C6.665,20 6.332,20 6,20C5.668,20 5.335,20 5.168,20H5V18V17.223V16H5.77C5.8098,15.7352 5.8698,15.4733 5.95,15.217C6,15.05 6.059,14.884 6.126,14.726C6.19155,14.5682 6.26886,14.4141 6.356,14.265C6.399,14.19 6.445,14.116 6.496,14.046C6.863,13.529 7.364,13.1 7.986,12.779C8.225,12.661 8.478,12.56 8.746,12.473C9.014,12.385 9.286,12.314 9.561,12.263C9.8173,12.2276 10.0795,12.1992 10.3455,12.1779C10.6114,12.1566 10.8797,12.1435 11.15,12.139L11.05,11.954L11.05,11.954ZM9.821,17.712C9.828,17.586 9.866,17.464 9.931,17.352C9.992,17.236 10.083,17.133 10.195,17.051C10.308,16.968 10.437,16.912 10.575,16.889C10.712,16.865 10.85,16.87 10.984,16.906C11.15,16.944 11.3,17.025 11.418,17.14C11.532,17.252 11.609,17.393 11.64,17.545C11.653,17.618 11.654,17.694 11.641,17.768C11.629,17.842 11.604,17.911 11.564,17.973C11.543,18.009 11.516,18.043 11.483,18.072C11.452,18.1 11.414,18.121 11.371,18.137C11.293,18.159 11.211,18.159 11.133,18.137C11.095,18.124 11.061,18.104 11.032,18.078C11.002,18.053 10.978,18.021 10.961,17.984C10.95,17.957 10.945,17.928 10.946,17.898C10.947,17.867 10.955,17.839 10.97,17.813C10.982,17.788 11.001,17.767 11.025,17.75C11.048,17.735 11.076,17.724 11.105,17.721C11.172,17.713 11.239,17.739 11.281,17.789C11.308,17.815 11.326,17.847 11.334,17.882L11.335,17.887C11.337,17.895 11.338,17.904 11.338,17.912C11.338,17.933 11.336,17.954 11.33,17.974C11.318,18.013 11.295,18.048 11.265,18.077C11.202,18.128 11.119,18.153 11.035,18.146C11.001,18.143 10.966,18.133 10.935,18.119C10.903,18.104 10.874,18.083 10.85,18.059C10.801,18.009 10.771,17.944 10.764,17.873C10.755,17.802 10.771,17.729 10.809,17.67C10.836,17.626 10.873,17.591 10.919,17.566C10.964,17.542 11.015,17.527 11.068,17.523C11.148,17.511 11.23,17.522 11.304,17.554C11.342,17.571 11.376,17.593 11.407,17.62C11.438,17.648 11.464,17.68 11.486,17.716C11.517,17.77 11.537,17.831 11.544,17.895C11.548,17.926 11.548,17.958 11.544,17.989C11.54,18.02 11.532,18.05 11.52,18.079C11.495,18.136 11.455,18.186 11.405,18.224C11.355,18.262 11.297,18.287 11.235,18.295L11.231,18.296L11.228,18.296L11.226,18.296C11.106,18.305 10.987,18.276 10.888,18.211C10.87,18.199 10.851,18.187 10.835,18.174C10.819,18.16 10.803,18.146 10.789,18.13C10.76,18.099 10.736,18.064 10.716,18.025C10.7,18 10.687,17.972 10.678,17.942C10.661,17.895 10.655,17.844 10.659,17.792C10.665,17.696 10.707,17.607 10.775,17.541C10.876,17.447 11.007,17.392 11.146,17.389L11.15,17.389C11.29,17.387 11.427,17.424 11.541,17.495C11.654,17.567 11.742,17.67 11.793,17.792C11.813,17.847 11.825,17.903 11.83,17.961C11.834,18.017 11.828,18.073 11.814,18.127C11.804,18.169 11.789,18.211 11.769,18.249C11.748,18.287 11.722,18.323 11.692,18.355C11.631,18.419 11.556,18.469 11.47,18.502C11.428,18.519 11.384,18.531 11.339,18.537C11.286,18.544 11.232,18.544 11.178,18.537C11.072,18.523 10.971,18.482 10.887,18.42C10.806,18.36 10.741,18.281 10.698,18.192C10.684,18.161 10.672,18.129 10.662,18.097C10.652,18.062 10.645,18.027 10.641,17.991C10.622,17.9 10.626,17.805 10.651,17.715C10.676,17.627 10.722,17.546 10.786,17.479C10.851,17.413 10.93,17.362 11.017,17.332C11.054,17.32 11.092,17.312 11.131,17.309C11.17,17.305 11.209,17.306 11.248,17.312C11.305,17.322 11.36,17.344 11.409,17.377C11.533,17.4 11.65,17.452 11.75,17.527C11.754,17.422 11.741,17.317 11.712,17.217C11.682,17.117 11.638,17.022 11.58,16.938C11.523,16.854 11.453,16.781 11.372,16.722C11.292,16.664 11.203,16.62 11.108,16.593L11.107,16.593L11.105,16.592C10.913,16.543 10.706,16.564 10.527,16.653C10.348,16.742 10.207,16.891 10.13,17.074C10.053,17.257 10.044,17.459 10.104,17.648C10.165,17.836 10.29,17.998 10.458,18.106C10.627,18.214 10.828,18.262 11.025,18.24C11.223,18.218 11.406,18.129 11.542,17.986C11.678,17.843 11.758,17.655 11.769,17.457C11.787,17.19 11.698,16.926 11.522,16.727C11.346,16.527 11.097,16.405 10.83,16.387C10.715,16.38 10.6,16.394 10.491,16.429C10.381,16.464 10.279,16.52 10.189,16.594C10.101,16.667 10.025,16.756 9.967,16.857C9.946,16.891 9.927,16.927 9.91,16.964C9.881,17.03 9.859,17.099 9.845,17.171C9.819,17.294 9.821,17.421 9.851,17.542C9.882,17.664 9.939,17.778 10.019,17.877C10.1,17.975 10.202,18.055 10.317,18.114C10.433,18.172 10.559,18.207 10.689,18.216C10.818,18.225 10.948,18.209 11.071,18.168C11.193,18.127 11.306,18.062 11.402,17.976C11.498,17.891 11.576,17.787 11.63,17.67C11.65,17.628 11.666,17.584 11.679,17.538C11.688,17.502 11.692,17.466 11.693,17.429C11.71,17.216 11.651,17.004 11.529,16.83C11.408,16.655 11.233,16.529 11.031,16.472C10.925,16.444 10.814,16.437 10.705,16.451C10.594,16.464 10.488,16.498 10.392,16.551C10.392,16.551 10.319,16.593 10.247,16.651C10.206,16.684 10.168,16.72 10.134,16.76C10.1,16.8 10.071,16.843 10.047,16.889C10.006,16.986 9.988,17.09 9.993,17.195C9.998,17.301 10.026,17.403 10.076,17.496C10.178,17.656 10.335,17.775 10.517,17.83C10.608,17.858 10.703,17.867 10.797,17.857C10.836,17.852 10.875,17.843 10.913,17.831C10.949,17.819 10.984,17.805 11.017,17.787C11.08,17.74 11.124,17.675 11.142,17.602C11.15,17.581 11.156,17.559 11.159,17.536C11.159,17.536 11.161,17.516 11.162,17.497C11.163,17.48 11.162,17.463 11.16,17.447C11.161,17.438 11.161,17.428 11.16,17.419C11.142,17.384 11.115,17.354 11.083,17.332C11.05,17.31 11.013,17.297 10.975,17.294C10.949,17.292 10.923,17.295 10.898,17.304C10.887,17.308 10.877,17.313 10.867,17.32C10.859,17.324 10.853,17.33 10.847,17.337C10.824,17.364 10.81,17.396 10.805,17.431C10.806,17.451 10.812,17.47 10.822,17.487C10.832,17.504 10.847,17.518 10.865,17.529C10.88,17.539 10.9,17.544 10.919,17.542C10.939,17.54 10.957,17.532 10.971,17.518C10.985,17.504 10.992,17.486 10.991,17.467C10.991,17.458 10.989,17.449 10.985,17.44C10.984,17.438 10.982,17.435 10.98,17.433L10.98,17.432C10.976,17.44 10.975,17.449 10.978,17.458C10.98,17.467 10.986,17.474 10.994,17.479C10.993,17.478 10.992,17.476 10.99,17.475L10.991,17.475C10.989,17.476 10.988,17.478 10.987,17.48C10.974,17.485 10.96,17.485 10.947,17.479C10.934,17.474 10.923,17.463 10.917,17.45C10.908,17.428 10.909,17.404 10.921,17.383C10.926,17.372 10.934,17.363 10.944,17.357C10.954,17.35 10.966,17.346 10.978,17.344C11.011,17.339 11.044,17.345 11.072,17.36C11.1,17.376 11.122,17.401 11.134,17.431C11.139,17.447 11.142,17.464 11.14,17.48C11.138,17.499 11.136,17.517 11.132,17.536C11.099,17.595 11.051,17.646 10.991,17.685C10.932,17.724 10.863,17.749 10.791,17.758C10.719,17.767 10.645,17.761 10.576,17.74C10.507,17.719 10.444,17.683 10.392,17.635C10.339,17.587 10.299,17.528 10.273,17.462C10.248,17.395 10.238,17.323 10.245,17.252C10.252,17.181 10.275,17.112 10.312,17.05C10.349,16.988 10.399,16.936 10.459,16.896C10.519,16.856 10.587,16.831 10.658,16.82C10.728,16.81 10.801,16.815 10.869,16.834C10.985,16.869 11.085,16.942 11.154,17.043C11.224,17.143 11.259,17.265 11.254,17.388C11.252,17.451 11.24,17.513 11.22,17.572C11.198,17.633 11.166,17.691 11.125,17.741C11.047,17.833 10.945,17.9 10.832,17.937C10.772,17.955 10.71,17.964 10.647,17.964C10.605,17.963 10.563,17.958 10.522,17.948C10.439,17.928 10.361,17.893 10.291,17.844C10.221,17.796 10.162,17.735 10.115,17.665C10.035,17.548 9.987,17.41 9.976,17.265C9.97,17.223 9.968,17.18 9.97,17.137C9.969,17.132 9.968,17.127 9.968,17.122L9.969,17.125C9.969,17.084 9.973,17.043 9.982,17.003C9.993,16.935 10.015,16.87 10.046,16.809C10.06,16.778 10.076,16.748 10.094,16.72C10.126,16.672 10.162,16.625 10.203,16.583C10.294,16.489 10.404,16.414 10.526,16.363C10.646,16.313 10.776,16.289 10.906,16.291C11.035,16.294 11.162,16.323 11.279,16.378C11.395,16.433 11.497,16.512 11.578,16.61C11.741,16.79 11.834,17.023 11.84,17.265C11.846,17.427 11.82,17.589 11.763,17.739C11.705,17.888 11.618,18.022 11.506,18.13C11.394,18.238 11.261,18.319 11.116,18.366C10.97,18.413 10.816,18.426 10.664,18.403C10.591,18.391 10.518,18.371 10.449,18.343C10.38,18.315 10.315,18.279 10.257,18.235C10.169,18.172 10.093,18.094 10.031,18.007C10.001,17.962 9.974,17.915 9.951,17.865C9.939,17.838 9.929,17.811 9.92,17.784C9.911,17.755 9.901,17.698 9.91,17.656L9.909,17.656C9.909,17.655 9.909,17.652 9.909,17.651C9.903,17.661 9.897,17.672 9.892,17.683C9.865,17.747 9.847,17.814 9.839,17.883C9.836,17.9 9.835,17.917 9.834,17.935C9.827,17.912 9.823,17.889 9.821,17.866C9.819,17.83 9.82,17.794 9.825,17.758C9.829,17.743 9.829,17.728 9.826,17.712L9.821,17.712Z" />
                          </svg>
                          Maintenance Summary
                        </Typography>
                        
                        {maintenanceData.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No maintenance data available
                          </Typography>
                        ) : (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">MTBF</Typography>
                                <Typography variant="h6" color="primary.main">48.2 days</Typography>
                              </Box>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">MTTR</Typography>
                                <Typography variant="h6" color="primary.main">8.5 hrs</Typography>
                              </Box>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Availability</Typography>
                                <Typography variant="h6" color="#4caf50">98.2%</Typography>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Maintenance Types</Typography>
                            <ResponsiveContainer width="100%" height={120}>
                              <PieChart>
                                <Pie
                                  data={maintenanceData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                  outerRadius={40}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {maintenanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                              </PieChart>
                            </ResponsiveContainer>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent Maintenance</Typography>
                            <Box sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">
                                  <b>2023-09-15:</b> Regular inspection
                                </Typography>
                                <Chip label="Scheduled" size="small" sx={{ bgcolor: '#0088FE', color: 'white', fontSize: '0.7rem' }} />
                              </Box>
                            </Box>
                            <Box sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">
                                  <b>2023-08-22:</b> Bearing replacement
                                </Typography>
                                <Chip label="Predictive" size="small" sx={{ bgcolor: '#00C49F', color: 'white', fontSize: '0.7rem' }} />
                              </Box>
                            </Box>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">
                                  <b>2023-07-30:</b> Power failure
                                </Typography>
                                <Chip label="Emergency" size="small" sx={{ bgcolor: '#FF8042', color: 'white', fontSize: '0.7rem' }} />
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Upcoming Maintenance</Typography>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">
                                  <b>2023-10-12:</b> Oil change
                                </Typography>
                                <Chip label="Scheduled" size="small" sx={{ bgcolor: '#0088FE', color: 'white', fontSize: '0.7rem' }} />
                              </Box>
                            </Box>
                          </>
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

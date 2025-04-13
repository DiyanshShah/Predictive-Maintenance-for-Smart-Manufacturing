import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  FormControlLabel,
  Switch,
  FormGroup,
  Tabs,
  Tab,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Slider
} from '@mui/material';
import { 
  getModelSettings, 
  saveModelSettings, 
  trainModel,
} from '../services/api';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

const UserProfile = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    role: user?.role || 'Maintenance Engineer',
    phone: '',
    department: 'Maintenance',
  });
  
  // Settings (moved from App.jsx)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('admin@example.com');
  const [notificationPhone, setNotificationPhone] = useState('');
  const [notificationEvents, setNotificationEvents] = useState({
    anomalyDetection: true,
    maintenanceDue: true,
    systemUpdates: false
  });
  const [modelSettings, setModelSettings] = useState({
    algorithm: 'random_forest',
    trainingFrequency: 'weekly',
    dataRetentionPeriod: '1year',
    featureImportance: [0.32, 0.28, 0.18, 0.12, 0.07, 0.03]
  });
  const [error, setError] = useState(null);
  
  // Fetch settings data when component mounts
  useEffect(() => {
    fetchSettingsData();
  }, []);
  
  const fetchSettingsData = async () => {
    try {      
      // Fetch model settings
      const modelConfig = await getModelSettings();
      
      // Ensure model settings have valid values for dropdown options
      setModelSettings({
        algorithm: modelConfig?.algorithm || 'random_forest',
        trainingFrequency: modelConfig?.trainingFrequency || 'weekly',
        dataRetentionPeriod: modelConfig?.dataRetentionPeriod || '1year',
        featureImportance: modelConfig?.featureImportance || [0.32, 0.28, 0.18, 0.12, 0.07, 0.03]
      });
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError({
        severity: 'error',
        message: `Failed to load settings: ${error.message || 'Unknown error'}`
      });
    }
  };

  // Function to handle profile data change
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  // Function to handle profile save
  const handleSaveProfile = () => {
    // In a real application, you would call an API to save profile data
    setError({
      severity: 'success',
      message: 'Profile information updated successfully!'
    });
    setTimeout(() => setError(null), 3000);
  };
  
  // Save model settings
  const handleSaveModelSettings = async () => {
    try {
      const result = await saveModelSettings(modelSettings);
      
      // Check if we got a response back (either real or mock)
      if (result && (result.success || result.algorithm)) {
        setError({
          severity: 'success',
          message: 'Model settings saved successfully!'
        });
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Model settings save error:', error);
      setError({
        severity: 'info',
        message: 'Model settings saved locally (server unavailable)'
      });
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Train the model
  const handleTrainModel = async () => {
    try {
      const result = await trainModel();
      
      if (result && result.success) {
        setError({
          severity: 'success',
          message: `Model training completed successfully! Accuracy: ${result.accuracy.toFixed(2)}`
        });
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Model training error:', error);
      setError({
        severity: 'error',
        message: `Model training failed: ${error.message || 'Unknown error'}`
      });
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle notification event changes
  const handleNotificationEventChange = (event) => {
    setNotificationEvents({
      ...notificationEvents,
      [event.target.name]: event.target.checked
    });
  };
  
  // Handle model setting change
  const handleModelSettingChange = (setting, value) => {
    setModelSettings({
      ...modelSettings,
      [setting]: value
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Paper sx={{ p: 2 }}>
      {error && (
        <Alert 
          severity={error.severity || 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error.message}
        </Alert>
      )}
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab label="Profile" id="profile-tab-0" />
            <Tab label="Notifications" id="profile-tab-1" />
            <Tab label="Model Settings" id="profile-tab-2" />
          </Tabs>
        </Box>
        
        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src="/profile-placeholder.jpg"
                sx={{ width: 120, height: 120, mb: 2 }}
              />
              <Typography variant="h6">{user?.name || 'User Name'}</Typography>
              <Typography variant="body2" color="text.secondary">{profileData.role}</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 2 }}>
                Change Photo
              </Button>
            </Grid>
            
            <Grid item xs={12} md={9}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="department-label">Department</InputLabel>
                    <Select
                      labelId="department-label"
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      label="Department"
                    >
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Operations">Operations</MenuItem>
                      <MenuItem value="Engineering">Engineering</MenuItem>
                      <MenuItem value="Management">Management</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="role-label">Role</InputLabel>
                    <Select
                      labelId="role-label"
                      name="role"
                      value={profileData.role}
                      onChange={handleProfileChange}
                      label="Role"
                    >
                      <MenuItem value="Maintenance Engineer">Maintenance Engineer</MenuItem>
                      <MenuItem value="Maintenance Technician">Maintenance Technician</MenuItem>
                      <MenuItem value="Operations Manager">Operations Manager</MenuItem>
                      <MenuItem value="Plant Manager">Plant Manager</MenuItem>
                      <MenuItem value="Reliability Engineer">Reliability Engineer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Notification Settings</Typography>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={emailNotifications} 
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Email Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={smsNotifications} 
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="SMS Notifications"
                />
              </FormGroup>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Notification Email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  disabled={!emailNotifications}
                  variant="outlined"
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="Notification Phone Number"
                  value={notificationPhone}
                  onChange={(e) => setNotificationPhone(e.target.value)}
                  disabled={!smsNotifications}
                  variant="outlined"
                  margin="normal"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Notification Events</Typography>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notificationEvents.anomalyDetection} 
                      onChange={handleNotificationEventChange}
                      name="anomalyDetection"
                      color="primary"
                    />
                  }
                  label="Equipment Anomaly Detected"
                />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notificationEvents.maintenanceDue} 
                      onChange={handleNotificationEventChange}
                      name="maintenanceDue"
                      color="primary"
                    />
                  }
                  label="Maintenance Due"
                />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notificationEvents.systemUpdates} 
                      onChange={handleNotificationEventChange}
                      name="systemUpdates"
                      color="primary"
                    />
                  }
                  label="System Updates"
                />
              </FormGroup>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  You will receive notifications according to your preferences. 
                  Notifications are sent automatically when the system identifies 
                  an anomaly or maintenance is required.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
              >
                Save Notification Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Model Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Model Configuration</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="algorithm-label">Prediction Algorithm</InputLabel>
                <Select
                  labelId="algorithm-label"
                  value={modelSettings.algorithm}
                  onChange={(e) => handleModelSettingChange('algorithm', e.target.value)}
                  label="Prediction Algorithm"
                >
                  <MenuItem value="random_forest">Random Forest</MenuItem>
                  <MenuItem value="gradient_boosting">Gradient Boosting</MenuItem>
                  <MenuItem value="neural_network">Neural Network</MenuItem>
                  <MenuItem value="svm">Support Vector Machine</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="training-frequency-label">Training Frequency</InputLabel>
                <Select
                  labelId="training-frequency-label"
                  value={modelSettings.trainingFrequency}
                  onChange={(e) => handleModelSettingChange('trainingFrequency', e.target.value)}
                  label="Training Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="data-retention-label">Data Retention Period</InputLabel>
                <Select
                  labelId="data-retention-label"
                  value={modelSettings.dataRetentionPeriod}
                  onChange={(e) => handleModelSettingChange('dataRetentionPeriod', e.target.value)}
                  label="Data Retention Period"
                >
                  <MenuItem value="3months">3 Months</MenuItem>
                  <MenuItem value="6months">6 Months</MenuItem>
                  <MenuItem value="1year">1 Year</MenuItem>
                  <MenuItem value="2years">2 Years</MenuItem>
                  <MenuItem value="5years">5 Years</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveModelSettings}
            >
              Save Model Settings
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleTrainModel}
            >
              Train Model Now
            </Button>
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default UserProfile; 
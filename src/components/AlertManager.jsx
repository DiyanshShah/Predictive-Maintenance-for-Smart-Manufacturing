import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import { getMachines, getSensorThresholds, saveSensorThresholds } from '../services/api';

const AlertManager = () => {
  const [machines, setMachines] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    parameter: 'temperature',
    condition: 'above',
    threshold: 80,
    severity: 'warning',
    notify_via: ['email'],
    enabled: true,
    notification_message: ''
  });

  // Parameter options with their units and default thresholds
  const parameterOptions = [
    { value: 'temperature', label: 'Temperature', unit: '°C', defaultThreshold: 80 },
    { value: 'vibration', label: 'Vibration', unit: 'mm/s', defaultThreshold: 10 },
    { value: 'pressure', label: 'Pressure', unit: 'kPa', defaultThreshold: 90 },
    { value: 'oil_level', label: 'Oil Level', unit: '%', defaultThreshold: 20 },
    { value: 'rotation_speed', label: 'Rotation Speed', unit: 'RPM', defaultThreshold: 3000 },
    { value: 'anomaly_score', label: 'Anomaly Score', unit: '', defaultThreshold: 0.7 },
    { value: 'failure_probability', label: 'Failure Probability', unit: '%', defaultThreshold: 60 }
  ];

  // Condition options
  const conditionOptions = [
    { value: 'above', label: 'Above' },
    { value: 'below', label: 'Below' },
    { value: 'equal', label: 'Equal to' },
    { value: 'not_equal', label: 'Not equal to' }
  ];

  // Severity options
  const severityOptions = [
    { value: 'info', label: 'Info', color: 'info' },
    { value: 'warning', label: 'Warning', color: 'warning' },
    { value: 'critical', label: 'Critical', color: 'error' }
  ];

  // Notification methods
  const notificationMethods = [
    { value: 'email', label: 'Email', icon: <EmailIcon /> },
    { value: 'sms', label: 'SMS', icon: <SmsIcon /> },
    { value: 'dashboard', label: 'Dashboard', icon: <NotificationsIcon /> }
  ];

  // Fetch machines and alert rules on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch machines
        const machinesData = await getMachines();
        setMachines(machinesData);

        // Fetch alert rules (sensor thresholds)
        const thresholds = await getSensorThresholds();
        setAlertRules(thresholds);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special case for parameter - set default threshold
    if (name === 'parameter') {
      const paramOption = parameterOptions.find(p => p.value === value);
      setFormData({
        ...formData,
        [name]: value,
        threshold: paramOption.defaultThreshold
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle notify via changes (multi-select)
  const handleNotifyViaChange = (method) => {
    const currentMethods = [...formData.notify_via];
    const methodIndex = currentMethods.indexOf(method);
    
    if (methodIndex === -1) {
      // Add method
      currentMethods.push(method);
    } else {
      // Remove method
      currentMethods.splice(methodIndex, 1);
    }
    
    setFormData({
      ...formData,
      notify_via: currentMethods
    });
  };

  // Toggle switch for enabled/disabled
  const handleEnabledToggle = () => {
    setFormData({
      ...formData,
      enabled: !formData.enabled
    });
  };

  // Open dialog to add/edit alert rule
  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      // Edit existing rule
      setEditIndex(index);
      setFormData(alertRules[index]);
    } else {
      // Add new rule
      setEditIndex(-1);
      setFormData({
        equipment_id: machines.length > 0 ? machines[0].equipment_id : '',
        parameter: 'temperature',
        condition: 'above',
        threshold: 80,
        severity: 'warning',
        notify_via: ['email'],
        enabled: true,
        notification_message: ''
      });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Save alert rule
  const handleSaveRule = () => {
    // Validate form
    if (!formData.equipment_id || !formData.parameter || !formData.condition) {
      setError('Please fill all required fields');
      return;
    }

    const newRules = [...alertRules];
    
    if (editIndex >= 0) {
      // Update existing rule
      newRules[editIndex] = formData;
    } else {
      // Add new rule
      newRules.push({
        ...formData,
        id: Date.now().toString(), // Generate a unique ID
        created_at: new Date().toISOString()
      });
    }
    
    setAlertRules(newRules);
    handleCloseDialog();
    
    // Save to backend
    saveAlertRules(newRules);
  };

  // Delete alert rule
  const handleDeleteRule = (index) => {
    const newRules = [...alertRules];
    newRules.splice(index, 1);
    setAlertRules(newRules);
    
    // Save to backend
    saveAlertRules(newRules);
  };

  // Toggle alert rule enabled/disabled
  const handleToggleRule = (index) => {
    const newRules = [...alertRules];
    newRules[index].enabled = !newRules[index].enabled;
    setAlertRules(newRules);
    
    // Save to backend
    saveAlertRules(newRules);
  };

  // Save alert rules to backend
  const saveAlertRules = async (rules) => {
    setLoading(true);
    try {
      await saveSensorThresholds(rules);
      setSuccess('Alert rules saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      setLoading(false);
    } catch (err) {
      setError('Failed to save alert rules: ' + err.message);
      setLoading(false);
    }
  };

  // Get machine name by ID
  const getMachineName = (id) => {
    const machine = machines.find(m => m.equipment_id === id);
    return machine ? machine.name : id;
  };

  // Format threshold with unit
  const formatThreshold = (threshold, parameter) => {
    const param = parameterOptions.find(p => p.value === parameter);
    return `${threshold}${param?.unit || ''}`;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const option = severityOptions.find(s => s.value === severity);
    return option ? option.color : 'default';
  };

  return (
    <Box>
      {/* Header with Add Button */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Alert Manager</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Alert Rule
        </Button>
      </Paper>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Alert Rules Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Configured Alert Rules</Typography>
        
        {alertRules.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsOffIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No alert rules configured. Click "Add Alert Rule" to create your first rule.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Notifications</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertRules.map((rule, index) => (
                  <TableRow key={rule.id || index} sx={{ opacity: rule.enabled ? 1 : 0.5 }}>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleRule(index)}
                        color={rule.enabled ? 'primary' : 'default'}
                      >
                        {rule.enabled ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getMachineName(rule.equipment_id)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rule.equipment_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {parameterOptions.find(p => p.value === rule.parameter)?.label || rule.parameter}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {conditionOptions.find(c => c.value === rule.condition)?.label || rule.condition} {' '}
                        {formatThreshold(rule.threshold, rule.parameter)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={severityOptions.find(s => s.value === rule.severity)?.label || rule.severity}
                        color={getSeverityColor(rule.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {rule.notify_via.map(method => (
                          <Chip 
                            key={method}
                            icon={notificationMethods.find(m => m.value === method)?.icon}
                            label={notificationMethods.find(m => m.value === method)?.label || method}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(index)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteRule(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Alert Rule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editIndex >= 0 ? 'Edit Alert Rule' : 'Add Alert Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {/* Equipment Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="equipment-label">Equipment</InputLabel>
                <Select
                  labelId="equipment-label"
                  id="equipment"
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleChange}
                  label="Equipment"
                >
                  {machines.map((machine) => (
                    <MenuItem key={machine.equipment_id} value={machine.equipment_id}>
                      {machine.name} ({machine.equipment_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Parameter Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="parameter-label">Parameter</InputLabel>
                <Select
                  labelId="parameter-label"
                  id="parameter"
                  name="parameter"
                  value={formData.parameter}
                  onChange={handleChange}
                  label="Parameter"
                >
                  {parameterOptions.map((param) => (
                    <MenuItem key={param.value} value={param.value}>
                      {param.label} {param.unit ? `(${param.unit})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Condition */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="condition-label">Condition</InputLabel>
                <Select
                  labelId="condition-label"
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  label="Condition"
                >
                  {conditionOptions.map((condition) => (
                    <MenuItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Threshold Value */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Threshold Value"
                name="threshold"
                type="number"
                value={formData.threshold}
                onChange={handleChange}
                InputProps={{
                  endAdornment: <Typography variant="body2" color="text.secondary">
                    {parameterOptions.find(p => p.value === formData.parameter)?.unit || ''}
                  </Typography>
                }}
              />
            </Grid>

            {/* Severity */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="severity-label">Severity</InputLabel>
                <Select
                  labelId="severity-label"
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  label="Severity"
                >
                  {severityOptions.map((severity) => (
                    <MenuItem key={severity.value} value={severity.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PriorityHighIcon sx={{ color: `${severity.color}.main`, mr: 1 }} />
                        {severity.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Enabled Switch */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={handleEnabledToggle}
                    color="primary"
                  />
                }
                label="Enable Alert"
              />
            </Grid>

            {/* Notification Methods */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Notification Methods
              </Typography>
              <Stack direction="row" spacing={1}>
                {notificationMethods.map((method) => (
                  <Chip
                    key={method.value}
                    icon={method.icon}
                    label={method.label}
                    clickable
                    color={formData.notify_via.includes(method.value) ? 'primary' : 'default'}
                    variant={formData.notify_via.includes(method.value) ? 'filled' : 'outlined'}
                    onClick={() => handleNotifyViaChange(method.value)}
                  />
                ))}
              </Stack>
            </Grid>

            {/* Custom Message */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custom Notification Message (Optional)"
                name="notification_message"
                value={formData.notification_message}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Enter custom message to include in notifications..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained" color="primary">
            Save Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertManager; 
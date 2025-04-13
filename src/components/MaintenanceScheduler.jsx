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
  Alert,
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
  DialogTitle,
  Stack,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  BuildCircle as BuildCircleIcon,
  MoreVert as MoreVertIcon,
  PriorityHigh as PriorityHighIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { getMachines, getMachineDetails, scheduleMaintenance, runPrediction } from '../services/api';

const MaintenanceScheduler = () => {
  const [machines, setMachines] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipmentDetails, setEquipmentDetails] = useState(null);
  const [predictionResults, setPredictionResults] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    maintenance_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    maintenance_type: 'preventive',
    description: '',
    technician: '',
    priority: 'medium',
    estimated_duration: 120, // minutes
    cost: ''
  });

  // Maintenance type options
  const maintenanceTypes = [
    { value: 'predictive', label: 'Predictive', color: 'primary' },
    { value: 'preventive', label: 'Preventive', color: 'success' },
    { value: 'corrective', label: 'Corrective', color: 'error' },
    { value: 'condition-based', label: 'Condition-based', color: 'warning' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'info' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'critical', label: 'Critical', color: 'error' }
  ];

  // Fetch machines on component mount
  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true);
      try {
        const data = await getMachines();
        setMachines(data);
        
        // Select first machine by default
        if (data.length > 0 && !selectedEquipment) {
          setSelectedEquipment(data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch equipment list: ' + err.message);
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Fetch equipment details when selectedEquipment changes
  useEffect(() => {
    if (selectedEquipment) {
      fetchEquipmentDetails();
    }
  }, [selectedEquipment]);

  // Fetch equipment details and prediction results
  const fetchEquipmentDetails = async () => {
    if (!selectedEquipment) return;
    
    setLoading(true);
    try {
      // Fetch equipment details
      const details = await getMachineDetails(selectedEquipment.equipment_id);
      setEquipmentDetails(details);
      
      // Get latest reading for prediction
      if (details.readings && details.readings.length > 0) {
        const latestReading = details.readings[0];
        const predictionInput = {
          timestamp: latestReading.timestamp,
          equipment_id: selectedEquipment.equipment_id,
          readings: {
            temperature: latestReading.temperature,
            vibration: latestReading.vibration,
            pressure: latestReading.pressure,
            oil_level: latestReading.oil_level
          }
        };
        
        // Run prediction
        const prediction = await runPrediction(predictionInput);
        setPredictionResults(prediction);
        
        // Pre-fill maintenance form with prediction-based data
        if (prediction.maintenance_required) {
          const maintenanceDate = new Date();
          maintenanceDate.setDate(maintenanceDate.getDate() + 
            Math.max(1, Math.floor(prediction.estimated_time_to_failure * 0.8)));
          
          setFormData(prev => ({
            ...prev,
            equipment_id: selectedEquipment.equipment_id,
            maintenance_date: maintenanceDate,
            maintenance_type: 'predictive',
            description: `Predictive maintenance based on failure probability of ${(prediction.probability * 100).toFixed(1)}%`,
            priority: prediction.probability > 0.7 ? 'critical' : 
                     prediction.probability > 0.5 ? 'high' : 'medium'
          }));
        }
      }
      
      // Setup maintenance schedule from history
      if (details.maintenance_history) {
        // Combine history and upcoming maintenance
        const schedule = [
          ...details.maintenance_history.map(item => ({
            ...item,
            status: 'completed'
          })),
          ...(details.upcoming_maintenance || []).map(item => ({
            ...item,
            status: 'scheduled'
          }))
        ];
        
        // Sort by date, with upcoming first
        schedule.sort((a, b) => {
          // Put completed at the bottom
          if (a.status !== b.status) {
            return a.status === 'completed' ? 1 : -1;
          }
          
          // Then sort by date
          return new Date(b.date || b.maintenance_date) - new Date(a.date || a.maintenance_date);
        });
        
        setMaintenanceSchedule(schedule);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch equipment details: ' + err.message);
      setLoading(false);
    }
  };

  // Handle equipment selection change
  const handleEquipmentChange = (equipment) => {
    setSelectedEquipment(equipment);
    
    // Reset form with new equipment ID
    setFormData(prev => ({
      ...prev,
      equipment_id: equipment.equipment_id
    }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle date change
  const handleDateChange = (e) => {
    setFormData({
      ...formData,
      maintenance_date: new Date(e.target.value)
    });
  };

  // Open dialog to schedule maintenance
  const handleOpenDialog = () => {
    // Make sure equipment is selected
    if (selectedEquipment) {
      setFormData(prev => ({
        ...prev,
        equipment_id: selectedEquipment.equipment_id
      }));
    }
    
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Submit maintenance schedule
  const handleSubmit = async () => {
    // Validate form
    if (!formData.equipment_id || !formData.maintenance_date || !formData.maintenance_type) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Format date
      const formattedData = {
        ...formData,
        maintenance_date: formData.maintenance_date.toISOString()
      };
      
      // Schedule maintenance
      const result = await scheduleMaintenance(formattedData);
      
      // Show success message
      setSuccess('Maintenance scheduled successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Close dialog
      handleCloseDialog();
      
      // Refresh equipment details to get updated schedule
      fetchEquipmentDetails();
      
      setLoading(false);
    } catch (err) {
      setError('Failed to schedule maintenance: ' + err.message);
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option ? option.color : 'default';
  };

  // Get maintenance type color
  const getMaintenanceTypeColor = (type) => {
    const option = maintenanceTypes.find(t => t.value === type);
    return option ? option.color : 'default';
  };

  // Determine if maintenance should be recommended based on prediction
  const shouldRecommendMaintenance = () => {
    if (!predictionResults) return false;
    
    // Check if the prediction is in the new format or old format
    if (predictionResults.prediction && typeof predictionResults.prediction === 'object') {
      return predictionResults.prediction.recommended_action === 'maintenance' || 
             predictionResults.prediction.failure_probability > 0.4;
    }
    
    // Fallback to old format
    return predictionResults.maintenance_required || predictionResults.probability > 0.4;
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Maintenance Scheduler</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          disabled={!selectedEquipment}
        >
          Schedule Maintenance
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

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Equipment Selection */}
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
                    borderColor: selectedEquipment?.equipment_id === machine.equipment_id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: selectedEquipment?.equipment_id === machine.equipment_id ? 'action.selected' : 'background.paper',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEquipmentChange(machine)}
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
          {loading && !selectedEquipment ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading data...
              </Typography>
            </Paper>
          ) : !selectedEquipment ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Select equipment to view maintenance schedule
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Equipment Summary */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6">{selectedEquipment.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedEquipment.equipment_id} | Location: {selectedEquipment.location}
                    </Typography>
                  </Grid>
                  
                  {predictionResults && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1">Equipment Condition</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          {predictionResults.prediction && typeof predictionResults.prediction === 'object' ? (
                            // New format
                            <>
                              {predictionResults.prediction.recommended_action === 'maintenance' ? (
                                <Chip 
                                  icon={<WarningIcon />} 
                                  label="Maintenance Recommended" 
                                  color="primary" 
                                  sx={{ fontWeight: 'bold' }}
                                />
                              ) : (
                                <Chip 
                                  icon={<CheckCircleIcon />} 
                                  label="No Maintenance Needed" 
                                  color="primary"
                                />
                              )}
                              
                              <Typography variant="body2" color="text.secondary">
                                {predictionResults.prediction.remaining_useful_life_days} days remaining
                              </Typography>
                            </>
                          ) : (
                            // Old format
                            <>
                              {predictionResults.maintenance_required ? (
                                <Chip 
                                  icon={<WarningIcon />} 
                                  label="Maintenance Recommended" 
                                  color="primary" 
                                  sx={{ fontWeight: 'bold' }}
                                />
                              ) : (
                                <Chip 
                                  icon={<CheckCircleIcon />} 
                                  label="No Maintenance Needed" 
                                  color="primary"
                                />
                              )}
                              
                              <Typography variant="body2" color="text.secondary">
                                {predictionResults.estimated_time_to_failure} days remaining
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {shouldRecommendMaintenance() && (
                  <Alert 
                    severity="warning"
                    sx={{ mt: 2 }}
                    action={
                      <Button 
                        color="inherit" 
                        size="small"
                        onClick={handleOpenDialog}
                      >
                        Schedule Now
                      </Button>
                    }
                  >
                    <Typography variant="body1">
                      Maintenance recommended based on prediction results
                    </Typography>
                    <Typography variant="body2">
                      Failure probability: {
                        predictionResults.prediction && typeof predictionResults.prediction === 'object'
                          ? (predictionResults.prediction.failure_probability * 100).toFixed(1)
                          : (predictionResults.probability * 100).toFixed(1)
                      }%
                    </Typography>
                  </Alert>
                )}
              </Paper>
              
              {/* Maintenance Tabs */}
              <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Upcoming" icon={<CalendarMonthIcon />} iconPosition="start" />
                    <Tab label="History" icon={<ScheduleIcon />} iconPosition="start" />
                  </Tabs>
                </Box>
                
                {/* Upcoming Maintenance */}
                <Box sx={{ p: 2 }} hidden={tabValue !== 0}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell>Technician</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {maintenanceSchedule.filter(item => item.status === 'scheduled').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Box sx={{ py: 2 }}>
                                <Typography variant="body1" color="text.secondary">
                                  No upcoming maintenance scheduled
                                </Typography>
                                <Button 
                                  variant="outlined" 
                                  startIcon={<AddIcon />} 
                                  sx={{ mt: 2 }}
                                  onClick={handleOpenDialog}
                                >
                                  Schedule Maintenance
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          maintenanceSchedule
                            .filter(item => item.status === 'scheduled')
                            .map((maintenance, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {formatDate(maintenance.date || maintenance.maintenance_date)}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={maintenance.maintenance_type} 
                                    color={getMaintenanceTypeColor(maintenance.maintenance_type)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{maintenance.description}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={maintenance.priority || 'medium'} 
                                    color={getPriorityColor(maintenance.priority || 'medium')}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{maintenance.technician || 'Not assigned'}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={maintenance.status} 
                                    color="primary"
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                
                {/* Maintenance History */}
                <Box sx={{ p: 2 }} hidden={tabValue !== 1}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Cost</TableCell>
                          <TableCell>Technician</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {maintenanceSchedule.filter(item => item.status === 'completed').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                                No maintenance history available
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          maintenanceSchedule
                            .filter(item => item.status === 'completed')
                            .map((maintenance, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {formatDate(maintenance.date || maintenance.maintenance_date)}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={maintenance.maintenance_type} 
                                    color={getMaintenanceTypeColor(maintenance.maintenance_type)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{maintenance.description}</TableCell>
                                <TableCell>
                                  ${maintenance.cost ? Number(maintenance.cost).toFixed(2) : 'N/A'}
                                </TableCell>
                                <TableCell>{maintenance.technician || 'Not recorded'}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={maintenance.status} 
                                    color="primary"
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Paper>
              
              {/* Maintenance Metrics */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Maintenance Metrics</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          MTBF
                        </Typography>
                        <Typography variant="h4">
                          {equipmentDetails?.metrics?.mtbf || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mean Time Between Failures
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          MTTR
                        </Typography>
                        <Typography variant="h4">
                          {equipmentDetails?.metrics?.mttr || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mean Time To Repair
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Availability
                        </Typography>
                        <Typography variant="h4">
                          {equipmentDetails?.metrics?.availability 
                            ? `${equipmentDetails.metrics.availability}%` 
                            : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Overall Equipment Availability
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          YTD Cost
                        </Typography>
                        <Typography variant="h4">
                          ${equipmentDetails?.metrics?.maintenance_cost_ytd || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Year-to-date Maintenance Cost
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </Grid>
      </Grid>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Schedule Maintenance
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

            {/* Maintenance Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maintenance Date and Time"
                name="maintenance_date"
                type="datetime-local"
                value={formData.maintenance_date instanceof Date ? 
                  formData.maintenance_date.toISOString().slice(0, 16) : 
                  new Date().toISOString().slice(0, 16)}
                onChange={handleDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Maintenance Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="maintenance-type-label">Maintenance Type</InputLabel>
                <Select
                  labelId="maintenance-type-label"
                  id="maintenance-type"
                  name="maintenance_type"
                  value={formData.maintenance_type}
                  onChange={handleChange}
                  label="Maintenance Type"
                >
                  {maintenanceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                >
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PriorityHighIcon sx={{ color: `${priority.color}.main`, mr: 1 }} />
                        {priority.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Technician */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Technician"
                name="technician"
                value={formData.technician}
                onChange={handleChange}
                placeholder="Assigned technician"
              />
            </Grid>

            {/* Estimated Duration */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                name="estimated_duration"
                type="number"
                value={formData.estimated_duration}
                onChange={handleChange}
              />
            </Grid>

            {/* Estimated Cost */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Cost ($)"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleChange}
                placeholder="Enter estimated cost"
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Enter maintenance task details..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Schedule Maintenance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceScheduler; 
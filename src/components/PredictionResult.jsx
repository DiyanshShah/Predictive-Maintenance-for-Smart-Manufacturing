import { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Divider, 
  Chip,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { scheduleMaintenance } from '../services/api';

const PredictionResult = ({ result, loading, onScheduleMaintenance }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    maintenance_type: 'preventive',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1">Processing prediction...</Typography>
      </Paper>
    );
  }

  if (!result || !result.prediction) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No prediction results available. Run a prediction to see results here.
        </Typography>
      </Paper>
    );
  }

  const { equipment_id, prediction, note } = result;
  const { failure_probability, remaining_useful_life_days, recommended_action, confidence } = prediction;

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceData({
      ...maintenanceData,
      [name]: value
    });
  };

  const handleSubmitMaintenance = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      await scheduleMaintenance({
        equipment_id,
        ...maintenanceData
      });
      
      handleCloseDialog();
      
      if (onScheduleMaintenance) {
        onScheduleMaintenance({
          equipment_id,
          ...maintenanceData
        });
      }
    } catch (err) {
      setError('Failed to schedule maintenance. Please try again.');
      console.error('Error scheduling maintenance:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <svg style={{ width: 24, height: 24, marginRight: 8 }} viewBox="0 0 24 24">
          <path fill="currentColor" d="M13,2.05V4.05C17.39,4.59 20.5,8.58 19.96,12.97C19.5,16.61 16.64,19.5 13,19.93V21.93C18.5,21.38 22.5,16.5 21.95,11C21.5,6.25 17.73,2.5 13,2.03V2.05M5.67,19.74C7.18,21 9.04,21.79 11,22V20C9.58,19.82 8.23,19.25 7.1,18.37L5.67,19.74M7.1,5.74C8.22,4.84 9.57,4.26 11,4.06V2.06C9.05,2.25 7.19,3 5.67,4.26L7.1,5.74M5.69,7.1L4.26,5.67C3,7.19 2.26,9.04 2.05,11H4.05C4.24,9.58 4.8,8.23 5.69,7.1M4.06,13H2.06C2.26,14.96 3.03,16.81 4.27,18.33L5.69,16.9C4.81,15.77 4.24,14.42 4.06,13M10,16.5L16,12L10,7.5V16.5Z" />
        </svg>
        Prediction Results
      </Typography>

      {note && (
        <Box sx={{ mb: 2, backgroundColor: '#fff9c4', p: 1, borderRadius: 1 }}>
          <Typography variant="body2">{note}</Typography>
        </Box>
      )}
      
      <Box sx={{ mt: 3, mb: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center', position: 'relative', mb: 2 }}>
              <CircularProgress 
                variant="determinate" 
                value={failure_probability * 100} 
                size={120}
                thickness={5}
                sx={{ 
                  color: 'primary.main',
                  position: 'relative',
                  zIndex: 1
                }}
              />
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {Math.round(failure_probability * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failure Probability
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Remaining Useful Life</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {remaining_useful_life_days} days
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Recommended Action</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={recommended_action ? recommended_action : 'Unknown'} 
                    color="primary"
                    sx={{ fontWeight: 'medium', textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Prediction Confidence</Typography>
                <Typography variant="h6">
                  {Math.round(confidence * 100)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenDialog}
          disabled={recommended_action?.toLowerCase() !== 'maintenance'}
        >
          Schedule Maintenance
        </Button>
      </Box>
      
      {/* Maintenance Scheduling Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Schedule maintenance for equipment ID: <strong>{equipment_id}</strong>
            </Typography>
            
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="scheduled_date"
                  label="Maintenance Date"
                  type="date"
                  fullWidth
                  value={maintenanceData.scheduled_date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="maintenance-type-label">Maintenance Type</InputLabel>
                  <Select
                    labelId="maintenance-type-label"
                    name="maintenance_type"
                    value={maintenanceData.maintenance_type}
                    label="Maintenance Type"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="predictive">Predictive</MenuItem>
                    <MenuItem value="preventive">Preventive</MenuItem>
                    <MenuItem value="corrective">Corrective</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  fullWidth
                  value={maintenanceData.description}
                  onChange={handleInputChange}
                  placeholder="Enter maintenance tasks and notes..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitMaintenance} 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Submitting...' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PredictionResult; 
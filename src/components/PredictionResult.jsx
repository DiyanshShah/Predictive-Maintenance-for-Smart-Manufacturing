import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  Chip,
  Grid,
  CircularProgress,
  Button,
  TextField
} from '@mui/material';
import { useState } from 'react';

// Helper function to get color based on prediction status
const getPredictionColor = (prediction) => {
  if (!prediction) return '#9e9e9e';
  
  if (prediction.includes('Normal')) return '#4caf50';
  if (prediction.includes('Warning')) return '#ff9800';
  if (prediction.includes('Alert')) return '#f57c00';
  if (prediction.includes('Critical')) return '#f44336';
  
  return '#9e9e9e';
};

const PredictionResult = ({ result, loading, onScheduleMaintenance }) => {
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  
  if (loading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1">Running prediction...</Typography>
        </Box>
      </Paper>
    );
  }
  
  if (!result) {
    return (
      <Paper sx={{ p: 3, height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select a machine and run prediction to see results
        </Typography>
      </Paper>
    );
  }
  
  const handleSchedule = () => {
    if (onScheduleMaintenance) {
      onScheduleMaintenance({
        equipmentId: result.equipment_id,
        date: maintenanceDate,
        notes: maintenanceNotes
      });
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Prediction Result
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">
                Equipment ID: {result.equipment_id}
              </Typography>
              
              <Chip 
                label={result.prediction} 
                sx={{ 
                  bgcolor: getPredictionColor(result.prediction),
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Failure Probability
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  mr: 2
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={result.probability * 100}
                  sx={{
                    color: result.probability > 0.7 
                      ? '#f44336' 
                      : result.probability > 0.4 
                        ? '#ff9800' 
                        : '#4caf50'
                  }}
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
                  <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                  >
                    {`${Math.round(result.probability * 100)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1">
                {result.probability < 0.3 
                  ? 'Low risk' 
                  : result.probability < 0.7 
                    ? 'Medium risk' 
                    : 'High risk'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Anomaly Detection
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip 
                label={result.anomaly_detected ? 'Anomaly Detected' : 'No Anomalies'} 
                sx={{ 
                  bgcolor: result.anomaly_detected ? '#f44336' : '#4caf50',
                  color: 'white'
                }} 
              />
            </Box>
          </Grid>
          
          {result.maintenance_required && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Maintenance Required
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Suggested Date
                </Typography>
                <Typography variant="body1">
                  {result.next_maintenance_date || 'As soon as possible'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Time to Failure
                </Typography>
                <Typography variant="body1">
                  {result.estimated_time_to_failure ? `${result.estimated_time_to_failure} days` : 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Schedule Maintenance
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Maintenance Date"
                        type="date"
                        value={maintenanceDate}
                        onChange={(e) => setMaintenanceDate(e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Notes"
                        multiline
                        rows={2}
                        value={maintenanceNotes}
                        onChange={(e) => setMaintenanceNotes(e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        disabled={!maintenanceDate}
                        onClick={handleSchedule}
                      >
                        Schedule
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Paper>
  );
};

export default PredictionResult; 
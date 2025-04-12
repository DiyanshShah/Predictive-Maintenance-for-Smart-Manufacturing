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
    <Paper sx={{ 
      p: 3,
      borderRadius: '10px',
      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <svg style={{ width: 28, height: 28, marginRight: 10 }} viewBox="0 0 24 24">
          <path fill="#3f51b5" d="M12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3M14.9 7.5C14.92 7.5 14.94 7.5 14.96 7.51C14.96 7.51 14.95 7.5 14.94 7.5H14.9M13 7.5C13 7.5 12.97 7.5 12.94 7.51L13 7.5M9.5 7.5C9.45 7.5 9.41 7.5 9.37 7.5L9.5 7.5M7.5 9.5C7.5 9.45 7.5 9.41 7.5 9.37L7.5 9.5M7.5 13C7.5 13 7.5 12.97 7.51 12.94L7.5 13M7.5 14.9C7.5 14.92 7.5 14.94 7.51 14.96C7.51 14.96 7.5 14.95 7.5 14.94V14.9M9.5 16.5C9.45 16.5 9.41 16.5 9.37 16.5L9.5 16.5M12 16.5L11.96 16.5H12M14.9 16.5L14.96 16.5H14.9M16.5 14.9V14.96V14.9M16.5 12.96V13L16.5 12.96M16.5 9.5C16.5 9.45 16.5 9.41 16.5 9.37L16.5 9.5M15.03 7.5C15.28 7.5 15.5 7.72 15.5 7.97C15.5 8.22 15.28 8.44 15.03 8.44C14.77 8.44 14.5 8.22 14.5 7.97C14.5 7.72 14.77 7.5 15.03 7.5M12.03 7.5C12.28 7.5 12.5 7.72 12.5 7.97C12.5 8.22 12.28 8.44 12.03 8.44C11.77 8.44 11.5 8.22 11.5 7.97C11.5 7.72 11.77 7.5 12.03 7.5M9.03 7.5C9.28 7.5 9.5 7.72 9.5 7.97C9.5 8.22 9.28 8.44 9.03 8.44C8.78 8.44 8.56 8.22 8.56 7.97C8.56 7.72 8.78 7.5 9.03 7.5M8.44 9.03C8.44 8.78 8.22 8.56 7.97 8.56C7.72 8.56 7.5 8.78 7.5 9.03C7.5 9.28 7.72 9.5 7.97 9.5C8.22 9.5 8.44 9.28 8.44 9.03M8.44 12.03C8.44 11.77 8.22 11.5 7.97 11.5C7.72 11.5 7.5 11.77 7.5 12.03C7.5 12.28 7.72 12.5 7.97 12.5C8.22 12.5 8.44 12.28 8.44 12.03M8.44 15.03C8.44 14.77 8.22 14.5 7.97 14.5C7.72 14.5 7.5 14.77 7.5 15.03C7.5 15.28 7.72 15.5 7.97 15.5C8.22 15.5 8.44 15.28 8.44 15.03M12.03 16.5C11.77 16.5 11.5 16.28 11.5 16.03C11.5 15.77 11.77 15.5 12.03 15.5C12.28 15.5 12.5 15.77 12.5 16.03C12.5 16.28 12.28 16.5 12.03 16.5M9.03 16.5C8.78 16.5 8.56 16.28 8.56 16.03C8.56 15.77 8.78 15.5 9.03 15.5C9.28 15.5 9.5 15.77 9.5 16.03C9.5 16.28 9.28 16.5 9.03 16.5M15.03 16.5C14.77 16.5 14.5 16.28 14.5 16.03C14.5 15.77 14.77 15.5 15.03 15.5C15.28 15.5 15.5 15.77 15.5 16.03C15.5 16.28 15.28 16.5 15.03 16.5M16.5 15.03C16.5 15.28 16.28 15.5 16.03 15.5C15.77 15.5 15.5 15.28 15.5 15.03C15.5 14.77 15.77 14.5 16.03 14.5C16.28 14.5 16.5 14.77 16.5 15.03M16.5 12.03C16.5 12.28 16.28 12.5 16.03 12.5C15.77 12.5 15.5 12.28 15.5 12.03C15.5 11.77 15.77 11.5 16.03 11.5C16.28 11.5 16.5 11.77 16.5 12.03M16.5 9.03C16.5 9.28 16.28 9.5 16.03 9.5C15.77 9.5 15.5 9.28 15.5 9.03C15.5 8.78 15.77 8.56 16.03 8.56C16.28 8.56 16.5 8.78 16.5 9.03Z" />
        </svg>
        <Typography variant="h6" fontWeight="600" color="primary.dark">
          Prediction Result
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(63, 81, 181, 0.05)', borderRadius: '8px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="500">
                Equipment: <Box component="span" fontWeight="normal">{result.equipment_id}</Box>
              </Typography>
              
              <Chip 
                label={result.prediction} 
                sx={{ 
                  bgcolor: getPredictionColor(result.prediction),
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                }} 
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Grid container spacing={3}>  
        <Grid item xs={12} sm={6}>
          <Box sx={{ 
            p: 2, 
            height: '100%',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Failure Probability
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  mb: 2
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={result.probability * 100}
                  thickness={5}
                  size={120}
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
                    variant="h4"
                    component="div"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    {`${Math.round(result.probability * 100)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" fontWeight="500" sx={{
                color: result.probability > 0.7 
                  ? '#f44336' 
                  : result.probability > 0.4 
                    ? '#ff9800' 
                    : '#4caf50'
              }}>
                {result.probability < 0.3 
                  ? 'Low risk' 
                  : result.probability < 0.7 
                    ? 'Medium risk' 
                    : 'High risk'}
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ 
            p: 2, 
            height: '100%',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Anomaly Detection
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <svg style={{ 
                width: 80, 
                height: 80, 
                marginBottom: 2,
                color: result.anomaly_detected ? '#f44336' : '#4caf50'
              }} viewBox="0 0 24 24">
                {result.anomaly_detected ? (
                  <path fill="currentColor" d="M13 13H11V7H13M13 17H11V15H13M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2Z" />
                ) : (
                  <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                )}
              </svg>
              <Chip 
                label={result.anomaly_detected ? 'Anomaly Detected' : 'No Anomalies'} 
                sx={{ 
                  bgcolor: result.anomaly_detected ? '#f44336' : '#4caf50',
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Box>
        </Grid>
          
        {result.maintenance_required && (
          <>
            <Grid item xs={12}>
              <Box sx={{ 
                mt: 2,
                p: 2, 
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #ff9800 0%, #ff6d00 100%)',
                color: 'white'
              }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Maintenance Required
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Suggested Date:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {result.next_maintenance_date || 'As soon as possible'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Estimated Time to Failure:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {result.estimated_time_to_failure ? `${result.estimated_time_to_failure} days` : 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
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
    </Paper>
  );
};

export default PredictionResult; 
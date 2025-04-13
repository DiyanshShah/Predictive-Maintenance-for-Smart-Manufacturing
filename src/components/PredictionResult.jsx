import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Button, 
  Chip, 
  Alert 
} from '@mui/material';
import { scheduleMaintenance } from '../services/api';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PredictionResult = ({ result, loading, onScheduleMaintenance }) => {
  const handleScheduleMaintenance = () => {
    if (onScheduleMaintenance && result?.equipment_id) {
      onScheduleMaintenance(result.equipment_id);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ p: 5 }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Processing prediction...
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  if (!result || Object.keys(result).length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ p: 5 }}
      >
        <Typography variant="h6" color="textSecondary">
          No prediction results available
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Run a prediction to see results here
        </Typography>
      </Box>
    );
  }

  // Extract model prediction data with fallbacks
  const failure_probability = result.failure_probability !== undefined ? 
    result.failure_probability : (result.raw_prediction_data?.failure_probability || null);
  
  const confidence = result.confidence !== undefined ? 
    result.confidence : (result.raw_prediction_data?.confidence || null);
  
  const remaining_useful_life = result.remaining_useful_life !== undefined ? 
    result.remaining_useful_life : (result.raw_prediction_data?.remaining_useful_life || null);
  
  const anomaly_detected = result.anomaly_detected !== undefined ? 
    result.anomaly_detected : (result.raw_prediction_data?.anomaly_detected || null);
  
  const anomaly_score = result.anomaly_score !== undefined ? 
    result.anomaly_score : (result.raw_prediction_data?.anomaly_score || null);

  // Logging data for debugging
  console.log('Prediction result data:', result);

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Failure Probability
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 2 }}>
              {failure_probability !== null ? (
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    variant="determinate"
                    value={Math.round(failure_probability * 100)}
                    size={80}
                    thickness={4}
                    color={failure_probability > 0.7 ? 'error' : failure_probability > 0.4 ? 'warning' : 'success'}
                  />
                  <Box
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h6" component="div" color="text.secondary">
                      {Math.round(failure_probability * 100)}%
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Box>
            {confidence !== null && (
              <Typography variant="body2" color="textSecondary" align="center">
                Confidence: {Math.round(confidence * 100)}%
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Remaining Useful Life
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 2 }}>
              {remaining_useful_life !== null ? (
                <>
                  <Typography variant="h3" color="primary">
                    {remaining_useful_life}
                  </Typography>
                  <Typography variant="h5" sx={{ ml: 1 }}>
                    days
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="textSecondary" align="center">
              Next maintenance: {result.next_maintenance_date || 'Not scheduled'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recommended Action
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 2 }}>
              {result.recommended_action ? (
                <Chip 
                  label={result.recommended_action.replace(/_/g, ' ')}
                  color="primary"
                  sx={{ fontSize: '1rem', py: 2, px: 1 }}
                />
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No recommendation available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Anomaly Detection
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 2 }}>
              {anomaly_detected !== null ? (
                <Chip
                  icon={anomaly_detected ? <WarningIcon /> : <CheckCircleIcon />}
                  label={anomaly_detected ? 'Anomaly Detected' : 'Normal Operation'}
                  color={anomaly_detected ? 'error' : 'success'}
                  sx={{ fontSize: '1rem', py: 2, px: 1 }}
                />
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No anomaly data available
                </Typography>
              )}
            </Box>
            {anomaly_score !== null && (
              <Typography variant="body2" color="textSecondary" align="center">
                Anomaly Score: {Math.round(anomaly_score * 100)}%
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {result.affected_components && result.affected_components.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Affected Components
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
                {result.affected_components.map((component) => (
                  <Chip 
                    key={component}
                    label={component.replace(/_/g, ' ')}
                    variant="outlined" 
                    color="primary"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Prediction Details
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Prediction ID: {result.prediction_id || 'Unknown'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Generated: {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'Unknown'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Model Version: {result.model_version || result.raw_prediction_data?.model_version || 'Unknown'}
            </Typography>
            <Box mt={2} display="flex" justifyContent="center">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleScheduleMaintenance}
                disabled={!result.equipment_id || !failure_probability || failure_probability < 0.5}
              >
                Schedule Maintenance
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PredictionResult; 
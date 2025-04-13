import React, { useEffect } from 'react';
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

const PredictionResult = ({ predictionResult, isLoading, onScheduleMaintenance }) => {
  useEffect(() => {
    console.log("PredictionResult component received:", predictionResult);
  }, [predictionResult]);

  // Helper function to safely extract values from nested objects
  const extractValue = (data, path, defaultValue = null) => {
    if (!data) return defaultValue;
    
    const keys = Array.isArray(path) ? path : path.split('.');
    let current = data;
    
    for (const key of keys) {
      if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  };
  
  // Extract prediction data with fallbacks
  const failureProbability = extractValue(predictionResult, 'failure_probability', extractValue(predictionResult, 'results.failure_probability', 0));
  const confidenceLevel = extractValue(predictionResult, 'confidence', extractValue(predictionResult, 'results.confidence', 0));
  const remainingUsefulLife = extractValue(predictionResult, 'remaining_useful_life', extractValue(predictionResult, 'results.remaining_useful_life', null));
  const anomalyDetected = extractValue(predictionResult, 'anomaly_detected', extractValue(predictionResult, 'results.anomaly_detected', false));
  const anomalyScore = extractValue(predictionResult, 'anomaly_score', extractValue(predictionResult, 'results.anomaly_score', 0));
  const recommendedAction = extractValue(predictionResult, 'recommended_action', extractValue(predictionResult, 'results.recommended_action', 'Unknown'));

  // Debug logging
  console.log("Extracted values:", {
    failureProbability,
    confidenceLevel,
    remainingUsefulLife,
    anomalyDetected,
    anomalyScore,
    recommendedAction
  });

  // Format probability as percentage
  const formattedProbability = failureProbability !== null ? 
    (Number(failureProbability) * 100).toFixed(1) + '%' : 
    'N/A';

  // Format RUL as days
  const formattedRUL = remainingUsefulLife !== null ? 
    `${Math.round(Number(remainingUsefulLife))} days` : 
    'N/A';

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!predictionResult) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No prediction results available. Run a prediction to see results.
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2, borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        Prediction Results
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Failure Probability:
          </Typography>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={Number(failureProbability) * 100}
              size={60}
              thickness={5}
              sx={{ color: (theme) => theme.palette.primary.main }}
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
              <Typography variant="caption" component="div" fontWeight="bold">
                {formattedProbability}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Remaining Useful Life:
          </Typography>
          <Typography variant="body1">
            {formattedRUL}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Recommended Action:
          </Typography>
          <Chip 
            label={recommendedAction || 'Unknown'} 
            color="primary"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Prediction Confidence:
          </Typography>
          <Typography variant="body1">
            {confidenceLevel ? (Number(confidenceLevel) * 100).toFixed(1) + '%' : 'N/A'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            Anomaly Detected:
          </Typography>
          <Chip 
            label={anomalyDetected ? 'Yes' : 'No'} 
            color={anomalyDetected ? 'error' : 'success'}
          />
        </Box>
        
        {anomalyDetected && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Anomaly Score:
            </Typography>
            <Typography variant="body1">
              {(Number(anomalyScore) * 100).toFixed(1) + '%'}
            </Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={onScheduleMaintenance}
          disabled={!failureProbability || Number(failureProbability) < 0.3}
        >
          Schedule Maintenance
        </Button>
      </Box>
    </Paper>
  );
};

export default PredictionResult; 
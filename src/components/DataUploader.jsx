import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress,
  LinearProgress,
  Chip
} from '@mui/material';
import { uploadHistoricalData, trainModel } from '../services/api';
import { UploadFile as UploadFileIcon, CloudUpload as CloudUploadIcon, ModelTraining as ModelTrainingIcon } from '@mui/icons-material';

const DataUploader = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [trainingTriggered, setTrainingTriggered] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setAlert({
        severity: 'warning',
        message: 'Please select a file first'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 500);
      
      // Upload the file
      // eslint-disable-next-line no-unused-vars
      const result = await uploadHistoricalData(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show success message
      setAlert({
        severity: 'success',
        message: 'File uploaded successfully! Models have been trained with the new data.'
      });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      // Show error message
      setAlert({
        severity: 'error',
        message: `Upload failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      // Call uploadHistoricalData API
      await uploadHistoricalData(formData);
      
      setUploadSuccess(true);
      setTrainingTriggered(false);
      setFile(null);
      
      // Show success message for 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (error) {
      setUploadError(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleTrainModel = async () => {
    setTrainingTriggered(true);
    setTrainingStatus('starting');
    
    try {
      await trainModel();
      setTrainingStatus('success');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setTrainingTriggered(false);
        setTrainingStatus(null);
      }, 5000);
    } catch (error) {
      setTrainingStatus('error');
      setUploadError(`Model training failed: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Data Uploader</Typography>
      <Typography variant="body2" paragraph>
        Upload historical sensor data in CSV or JSON format to train the prediction models.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            sx={{ mr: 2 }}
            disabled={uploading}
            startIcon={<UploadFileIcon />}
          >
            Select File
            <input
              type="file"
              accept=".csv,.json"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFileUpload}
            disabled={!file || uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          
          {uploadSuccess && (
            <Button
              variant="outlined"
              color="success"
              sx={{ ml: 2 }}
              onClick={handleTrainModel}
              disabled={trainingTriggered}
              startIcon={trainingStatus === 'starting' ? <CircularProgress size={20} color="inherit" /> : <ModelTrainingIcon />}
            >
              {trainingStatus === 'starting' ? 'Training...' : 'Train Models'}
            </Button>
          )}
        </Box>
        
        {file && (
          <Chip
            label={file.name}
            onDelete={() => setFile(null)}
            color="primary"
            variant="outlined"
            sx={{ mb: 2 }}
          />
        )}
        
        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            File uploaded successfully! {trainingTriggered && trainingStatus === 'success' ? 'Models have been trained with the new data.' : 'Click "Train Models" to update prediction models with this data.'}
          </Alert>
        )}
        
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        )}
        
        {trainingStatus === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to train model. Please try again.
          </Alert>
        )}
        
        <Typography variant="subtitle2" gutterBottom>
          Supported Formats
        </Typography>
        <Typography variant="body2">
          • CSV files with headers for sensor readings (temperature, vibration, pressure, etc.)
        </Typography>
        <Typography variant="body2">
          • JSON files with timestamp, equipment_id, and sensor readings
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          The file should include historical data with failure indicators to train the model effectively.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DataUploader; 
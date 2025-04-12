import { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { uploadHistoricalData } from '../services/api';

const DataUploader = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alert, setAlert] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (selectedFile) {
      // Check file type
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.json')) {
        setAlert({
          severity: 'error',
          message: 'Only CSV and JSON files are supported'
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setAlert({
          severity: 'error',
          message: 'File size must be less than 10MB'
        });
        return;
      }
      
      setFile(selectedFile);
      setAlert(null);
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

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Historical Data
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Upload historical sensor data in CSV or JSON format to train the prediction models.
        The data should include sensor readings and failure indicators.
      </Typography>
      
      {alert && (
        <Alert 
          severity={alert.severity} 
          sx={{ mb: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <input
          accept=".csv,.json"
          style={{ display: 'none' }}
          id="upload-file"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <label htmlFor="upload-file">
          <Button
            variant="outlined"
            component="span"
            disabled={isUploading}
            sx={{ mr: 2 }}
          >
            Select File
          </Button>
        </label>
        
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Box>
      
      {file && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </Typography>
      )}
      
      {isUploading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" align="center" sx={{ display: 'block', mt: 1 }}>
            {uploadProgress}% Uploaded
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DataUploader; 
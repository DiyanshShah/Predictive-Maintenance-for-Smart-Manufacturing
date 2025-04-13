import { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  TextField,
  MenuItem,
  CircularProgress,
  Slider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import { runPrediction, getMachines } from '../services/api';

const sensorUnits = {
  temperature: '°C',
  vibration: 'mm/s',
  pressure: 'kPa',
  oil_level: '%'
};

const PredictionForm = ({ onPredictionResult }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [sensorReadings, setSensorReadings] = useState({
    temperature: 70,
    vibration: 3.0,
    pressure: 100,
    oil_level: 90
  });
  const [error, setError] = useState(null);
  const [fetchingMachines, setFetchingMachines] = useState(true);

  // Fetch available machines
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const machineData = await getMachines();
        setMachines(machineData);
        if (machineData.length > 0) {
          setSelectedMachine(machineData[0].equipment_id);
        }
      } catch (err) {
        setError('Error loading machines. Please try again later.');
        console.error('Error fetching machines:', err);
      } finally {
        setFetchingMachines(false);
      }
    };

    fetchMachines();
  }, []);

  const handleSensorChange = (sensor, value) => {
    setSensorReadings({
      ...sensorReadings,
      [sensor]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const predictionData = {
        equipment_id: selectedMachine,
        readings: sensorReadings
      };

      const result = await runPrediction(predictionData);
      
      // Pass the result to the parent component
      onPredictionResult(result);
    } catch (err) {
      setError('Failed to run prediction. Please try again.');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingMachines) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Run Prediction
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="machine-select-label">Equipment</InputLabel>
              <Select
                labelId="machine-select-label"
                value={selectedMachine}
                label="Equipment"
                onChange={(e) => setSelectedMachine(e.target.value)}
                disabled={loading}
              >
                {machines.map((machine) => (
                  <MenuItem key={machine.equipment_id} value={machine.equipment_id}>
                    {machine.name} ({machine.equipment_id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {Object.keys(sensorReadings).map((sensor) => (
            <Grid item xs={12} md={6} key={sensor}>
              <Typography id={`${sensor}-slider-label`} gutterBottom>
                {sensor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Slider
                  value={sensorReadings[sensor]}
                  onChange={(_, value) => handleSensorChange(sensor, value)}
                  aria-labelledby={`${sensor}-slider-label`}
                  min={
                    sensor === 'temperature' ? 20 : 
                    sensor === 'vibration' ? 0 : 
                    sensor === 'pressure' ? 50 : 
                    sensor === 'oil_level' ? 0 : 0
                  }
                  max={
                    sensor === 'temperature' ? 120 : 
                    sensor === 'vibration' ? 15 : 
                    sensor === 'pressure' ? 200 : 
                    sensor === 'oil_level' ? 100 : 100
                  }
                  step={
                    sensor === 'vibration' ? 0.1 : 1
                  }
                  disabled={loading}
                  sx={{ flexGrow: 1, mx: 2 }}
                />
                <TextField
                  value={sensorReadings[sensor]}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      handleSensorChange(sensor, value);
                    }
                  }}
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{sensorUnits[sensor]}</InputAdornment>,
                  }}
                  inputProps={{
                    min: sensor === 'temperature' ? 20 : 
                         sensor === 'vibration' ? 0 : 
                         sensor === 'pressure' ? 50 : 
                         sensor === 'oil_level' ? 0 : 0,
                    max: sensor === 'temperature' ? 120 : 
                         sensor === 'vibration' ? 15 : 
                         sensor === 'pressure' ? 200 : 
                         sensor === 'oil_level' ? 100 : 100,
                    step: sensor === 'vibration' ? 0.1 : 1,
                  }}
                  disabled={loading}
                  sx={{ width: 120 }}
                />
              </Box>
            </Grid>
          ))}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading || !selectedMachine}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Processing...' : 'Run Prediction'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PredictionForm; 
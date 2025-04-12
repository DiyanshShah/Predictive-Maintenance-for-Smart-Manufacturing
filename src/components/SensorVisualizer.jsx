import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Slider
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush
} from 'recharts';

// Mock data (replace with API calls)
const generateMockData = (days, sensorType) => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - days + i);
    
    // Generate random value based on sensor type
    let value;
    let anomalyThreshold;
    
    switch (sensorType) {
      case 'temperature':
        value = 70 + Math.random() * 30;
        anomalyThreshold = 90;
        break;
      case 'vibration':
        value = 0.3 + Math.random() * 1.2;
        anomalyThreshold = 1.0;
        break;
      case 'pressure':
        value = 90 + Math.random() * 15;
        anomalyThreshold = 95;
        break;
      case 'rotation_speed':
        value = 1000 + Math.random() * 300;
        anomalyThreshold = 1200;
        break;
      default:
        value = 50 + Math.random() * 50;
        anomalyThreshold = 85;
    }
    
    // Make some values anomalous
    const isAnomaly = Math.random() > 0.9;
    if (isAnomaly) {
      value = anomalyThreshold * (1 + Math.random() * 0.5);
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: value,
      isAnomaly: isAnomaly
    });
  }
  
  return data;
};

const SensorVisualizer = ({ equipmentId }) => {
  const [sensorType, setSensorType] = useState('temperature');
  const [timeRange, setTimeRange] = useState(30); // days
  const [chartType, setChartType] = useState('line');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Load data when sensor type or time range changes
    const loadData = async () => {
      setLoading(true);
      
      // In a real app, you would fetch data from your API here
      // Instead, we're using mock data
      setTimeout(() => {
        const newData = generateMockData(timeRange, sensorType);
        setData(newData);
        setLoading(false);
      }, 1000);
    };
    
    loadData();
  }, [sensorType, timeRange, equipmentId]);
  
  const handleSensorChange = (event) => {
    setSensorType(event.target.value);
  };
  
  const handleTimeRangeChange = (event, newValue) => {
    if (newValue !== null) {
      setTimeRange(newValue);
    }
  };
  
  const handleChartTypeChange = (event) => {
    // For Select components, we need to get the value from event.target.value
    const newChartType = event.target.value;
    setChartType(newChartType);
  };
  
  // Get appropriate units based on sensor type
  const getSensorUnit = () => {
    switch (sensorType) {
      case 'temperature':
        return '°C';
      case 'vibration':
        return 'mm/s';
      case 'pressure':
        return 'PSI';
      case 'rotation_speed':
        return 'RPM';
      default:
        return '';
    }
  };
  
  // Calculate threshold for this sensor type
  const getThreshold = () => {
    switch (sensorType) {
      case 'temperature':
        return 90;
      case 'vibration':
        return 1.0;
      case 'pressure':
        return 95;
      case 'rotation_speed':
        return 1200;
      default:
        return 85;
    }
  };
  
  const threshold = getThreshold();
  
  return (
    <Paper sx={{ 
      p: 3, 
      borderRadius: '10px',
      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
      background: 'linear-gradient(to bottom, #ffffff, #f9fafc)'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: 600,
          color: '#ff9800'
        }}>
          <svg style={{ width: 24, height: 24, marginRight: 8 }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.56,7.61C9.37,6.8 10.69,6.8 11.5,7.61C12.3,8.41 12.3,9.73 11.5,10.54C11,11.06 10.26,11.22 9.61,11.04L5.04,15.61L5.1,16.11C5.73,19.19 8.61,21.5 12,21.5C15.87,21.5 19,18.37 19,14.5C19,14.2 18.97,13.9 18.92,13.61L20.38,12.14C20.79,12.87 21,13.66 21,14.5C21,19.47 16.97,23.5 12,23.5C7.97,23.5 4.57,21.18 3.46,17.86L1.1,20.22L0.39,19.5L3,16.9L3,14M15.89,8.61C16.5,8 17.43,8 18.04,8.61C18.65,9.22 18.65,10.16 18.04,10.77L15.54,13.27L13.5,11.22L15.89,8.61M8.54,3.04L8.54,4.5C5.9,4.91 3.97,7.21 4.04,9.88C4.07,10.39 4.21,10.84 4.38,11.25L5.01,10.63L5.58,11.17L3.47,13.28C3.22,12.7 3.05,12.06 3.03,11.39C2.95,7.87 5.5,5 8.54,4.5L8.54,3.04M9.54,3.63L11.29,5.38L11.29,5.38L7.5,9.17L6.4,8.07L9.54,4.93V3.63Z" />
          </svg>
          Sensor Data Visualization
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
            <InputLabel id="sensor-type-label">Sensor Type</InputLabel>
            <Select
              labelId="sensor-type-label"
              value={sensorType}
              onChange={handleSensorChange}
              label="Sensor Type"
            >
              <MenuItem value="temperature">Temperature</MenuItem>
              <MenuItem value="vibration">Vibration</MenuItem>
              <MenuItem value="pressure">Pressure</MenuItem>
              <MenuItem value="rotation_speed">Rotation Speed</MenuItem>
              <MenuItem value="oil_level">Oil Level</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
            <InputLabel id="chart-type-label">Chart Type</InputLabel>
            <Select
              labelId="chart-type-label"
              value={chartType}
              onChange={handleChartTypeChange}
              label="Chart Type"
            >
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="bar">Bar Chart</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Time Range:
        </Typography>
        <Slider
          value={timeRange}
          onChange={handleTimeRangeChange}
          step={null}
          marks={[
            { value: 7, label: '7 days' },
            { value: 14, label: '14 days' },
            { value: 30, label: '30 days' },
            { value: 90, label: '90 days' },
          ]}
          min={7}
          max={90}
          sx={{ 
            color: '#ff9800',
            '& .MuiSlider-thumb': {
              width: 14,
              height: 14,
            }
          }}
        />
      </Box>
      
      <Box sx={{ height: 400, mt: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={['auto', 'auto']} 
                  label={{ 
                    value: `${sensorType.replace('_', ' ')} (${getSensorUnit()})`, 
                    angle: -90, 
                    position: 'insideLeft' 
                  }} 
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)} ${getSensorUnit()}`, sensorType.replace('_', ' ')]} 
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                
                {/* Reference line for threshold */}
                <Line
                  type="monotone"
                  dataKey="value"
                  key="sensor-value-line"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return payload.isAnomaly ? (
                      <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="red">
                        <circle cx="5" cy="5" r="5" />
                      </svg>
                    ) : (
                      <svg x={cx - 3} y={cy - 3} width={6} height={6} fill="#8884d8">
                        <circle cx="3" cy="3" r="3" />
                      </svg>
                    );
                  }}
                />
                
                <Brush dataKey="date" height={30} stroke="#8884d8" />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={['auto', 'auto']} 
                  label={{ 
                    value: `${sensorType.replace('_', ' ')} (${getSensorUnit()})`, 
                    angle: -90, 
                    position: 'insideLeft' 
                  }} 
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)} ${getSensorUnit()}`, sensorType.replace('_', ' ')]} 
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  // Color bars differently based on anomaly status
                  fill={(entry) => (entry.isAnomaly ? '#ff4d4f' : '#8884d8')}
                />
                <Brush dataKey="date" height={30} stroke="#8884d8" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <span style={{ color: 'red', fontWeight: 'bold' }}>●</span> Anomalies detected
          {' | '}
          Threshold: {threshold} {getSensorUnit()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SensorVisualizer; 
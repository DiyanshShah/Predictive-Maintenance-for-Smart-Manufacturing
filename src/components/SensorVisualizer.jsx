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
  CircularProgress
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
  
  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };
  
  const handleChartTypeChange = (event, newChartType) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sensor Data Visualization
        {equipmentId && ` - ${equipmentId}`}
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sensor Type</InputLabel>
          <Select
            value={sensorType}
            label="Sensor Type"
            onChange={handleSensorChange}
          >
            <MenuItem value="temperature">Temperature</MenuItem>
            <MenuItem value="vibration">Vibration</MenuItem>
            <MenuItem value="pressure">Pressure</MenuItem>
            <MenuItem value="rotation_speed">Rotation Speed</MenuItem>
          </Select>
        </FormControl>
        
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Time Range (Days)
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            aria-label="time range"
            size="small"
          >
            <ToggleButton value={7}>7</ToggleButton>
            <ToggleButton value={30}>30</ToggleButton>
            <ToggleButton value={90}>90</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Chart Type
          </Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
            size="small"
          >
            <ToggleButton value="line">Line</ToggleButton>
            <ToggleButton value="bar">Bar</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      <Box sx={{ height: 400 }}>
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
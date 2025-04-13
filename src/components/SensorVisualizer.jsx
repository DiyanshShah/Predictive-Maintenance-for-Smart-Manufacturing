import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
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
  Brush,
  ReferenceLine,
  Label
} from 'recharts';

const SensorVisualizer = ({ data = [], isLoading = false, selectedMachine }) => {
  const [sensorType, setSensorType] = useState('temperature');
  const [chartType, setChartType] = useState('line');

  console.log("SensorVisualizer received data:", data, "for equipment:", selectedMachine);
  
  const handleSensorChange = (event) => {
    setSensorType(event.target.value);
  };
  
  const handleChartTypeChange = (event) => {
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
      case 'oil_level':
        return '%';
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
        return 3.0;
      case 'pressure':
        return 130;
      case 'oil_level':
        return 30;
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
          color: '#714955'
        }}>
          <svg style={{ width: 24, height: 24, marginRight: 8 }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.56,7.61C9.37,6.8 10.69,6.8 11.5,7.61C12.3,8.41 12.3,9.73 11.5,10.54C11,11.06 10.26,11.22 9.61,11.04L5.04,15.61L5.1,16.11C5.73,19.19 8.61,21.5 12,21.5C15.87,21.5 19,18.37 19,14.5C19,14.2 18.97,13.9 18.92,13.61L20.38,12.14C20.79,12.87 21,13.66 21,14.5C21,19.47 16.97,23.5 12,23.5C7.97,23.5 4.57,21.18 3.46,17.86L1.1,20.22L0.39,19.5L3,16.9L3,14M15.89,8.61C16.5,8 17.43,8 18.04,8.61C18.65,9.22 18.65,10.16 18.04,10.77L15.54,13.27L13.5,11.22L15.89,8.61M8.54,3.04L8.54,4.5C5.9,4.91 3.97,7.21 4.04,9.88C4.07,10.39 4.21,10.84 4.38,11.25L5.01,10.63L5.58,11.17L3.47,13.28C3.22,12.7 3.05,12.06 3.03,11.39C2.95,7.87 5.5,5 8.54,4.5L8.54,3.04M9.54,3.63L11.29,5.38L11.29,5.38L7.5,9.17L6.4,8.07L9.54,4.93V3.63Z" />
          </svg>
          Sensor Data Visualization - {selectedMachine || 'No Equipment Selected'}
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
      
      <Box sx={{ height: 400, mt: 4 }}>
        {isLoading ? (
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
                <XAxis dataKey="name" />
                <YAxis label={{ value: getSensorUnit(), angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [value.toFixed(2) + ' ' + getSensorUnit(), sensorType.replace('_', ' ')]} />
                <Legend />
                <Line
                  key={`line-${sensorType}-${selectedMachine}`}
                  type="monotone"
                  dataKey={sensorType}
                  stroke="#714955"
                  activeDot={{ r: 8 }}
                  dot={{ 
                    stroke: '#714955', 
                    strokeWidth: 1, 
                    fill: '#ffffff',
                    r: 3,
                    // Add unique key for each dot
                    key: (dataItem, index) => `dot-${selectedMachine}-${index}`
                  }}
                />
                <Brush dataKey="name" height={30} stroke="#8884d8" />
                <ReferenceLine y={threshold} stroke="red" strokeDasharray="3 3" key={`threshold-line-${sensorType}`}>
                  <Label value="Threshold" position="right" />
                </ReferenceLine>
              </LineChart>
            ) : chartType === 'bar' ? (
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value.toFixed(2) + ' ' + getSensorUnit(), sensorType.replace('_', ' ')]} />
                <Legend />
                <Bar 
                  key={`bar-${sensorType}-${selectedMachine}`}
                  dataKey={sensorType} 
                  fill="#714955" 
                  // Add a name for each bar shape
                  shape={(props) => {
                    const { fill, x, y, width, height } = props;
                    // Add a unique key for each bar
                    return <rect key={`rect-${selectedMachine}-${props.index}`} x={x} y={y} width={width} height={height} fill={fill} />;
                  }}
                />
                <ReferenceLine y={threshold} stroke="red" strokeDasharray="3 3" key={`threshold-line-bar-${sensorType}`}>
                  <Label value="Threshold" position="right" />
                </ReferenceLine>
              </BarChart>
            ) : null}
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
};

export default SensorVisualizer; 
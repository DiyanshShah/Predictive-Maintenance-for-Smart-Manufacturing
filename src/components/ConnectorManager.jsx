import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
} from '@mui/material';
import {
  setupConnector,
  stopConnector,
  listConnectors,
  getMachines
} from '../services/api';

const ConnectorManager = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [machines, setMachines] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formValues, setFormValues] = useState({
    connector_type: 'csv',
    equipment_id: '',
    config: {},
    connection_params: {}
  });
  
  // Form fields for each connector type
  const connectorFields = {
    csv: [
      { name: 'file_path', label: 'CSV File Path', type: 'text', required: true, paramType: 'connection' },
      { name: 'interval', label: 'Update Interval (seconds)', type: 'number', defaultValue: 5, paramType: 'config' }
    ],
    api: [
      { name: 'api_url', label: 'API URL', type: 'text', required: true, paramType: 'connection' },
      { name: 'interval', label: 'Update Interval (seconds)', type: 'number', defaultValue: 60, paramType: 'config' }
    ],
    modbus: [
      { name: 'host', label: 'Host/IP Address', type: 'text', required: true, paramType: 'connection' },
      { name: 'port', label: 'Port', type: 'number', defaultValue: 502, paramType: 'connection' },
      { name: 'unit_id', label: 'Unit ID', type: 'number', defaultValue: 1, paramType: 'config' },
      { name: 'interval', label: 'Update Interval (seconds)', type: 'number', defaultValue: 5, paramType: 'config' }
    ],
    opcua: [
      { name: 'server_url', label: 'OPC UA Server URL', type: 'text', required: true, paramType: 'connection' },
      { name: 'interval', label: 'Update Interval (seconds)', type: 'number', defaultValue: 5, paramType: 'config' }
    ]
  };
  
  // Load existing connectors and machines
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [connectorsResponse, machinesResponse] = await Promise.all([
          listConnectors(),
          getMachines()
        ]);
        
        setConnectors(connectorsResponse);
        setMachines(machinesResponse);
      } catch (error) {
        setError('Failed to load data. ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Reset form
    setFormValues({
      connector_type: 'csv',
      equipment_id: '',
      config: {},
      connection_params: {}
    });
  };
  
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    
    if (name === 'connector_type') {
      // Reset form values when connector type changes
      setFormValues({
        connector_type: value,
        equipment_id: formValues.equipment_id,
        config: {},
        connection_params: {}
      });
    } else if (name === 'equipment_id') {
      setFormValues({
        ...formValues,
        equipment_id: value
      });
    } else {
      // Find the field definition
      const fieldDef = connectorFields[formValues.connector_type].find(f => f.name === name);
      
      if (fieldDef) {
        if (fieldDef.paramType === 'config') {
          setFormValues({
            ...formValues,
            config: {
              ...formValues.config,
              [name]: fieldDef.type === 'number' ? Number(value) : value
            }
          });
        } else if (fieldDef.paramType === 'connection') {
          setFormValues({
            ...formValues,
            connection_params: {
              ...formValues.connection_params,
              [name]: fieldDef.type === 'number' ? Number(value) : value
            }
          });
        }
      }
    }
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert form values to connector config
      const config = {
        connector_type: formValues.connector_type,
        equipment_id: formValues.equipment_id,
        config: formValues.config,
        connection_params: formValues.connection_params
      };
      
      // Special handling for authentication
      if (formValues.connector_type === 'api' && 
          formValues.config.auth_username && 
          formValues.config.auth_password) {
        config.config.auth = {
          username: formValues.config.auth_username,
          password: formValues.config.auth_password
        };
        
        // Remove separate auth fields
        delete config.config.auth_username;
        delete config.config.auth_password;
      }
      
      // Set up the connector
      await setupConnector(config);
      
      // Refresh connectors list
      const updatedConnectors = await listConnectors();
      setConnectors(updatedConnectors);
      
      // Close dialog
      handleCloseDialog();
    } catch (error) {
      setError('Failed to set up connector: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStopConnector = async (equipmentId) => {
    setLoading(true);
    
    try {
      await stopConnector(equipmentId);
      
      // Refresh connectors list
      const updatedConnectors = await listConnectors();
      setConnectors(updatedConnectors);
    } catch (error) {
      setError('Failed to stop connector: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Get connector type display name
  const getConnectorTypeName = (type) => {
    switch (type) {
      case 'CSVFileConnector': return 'CSV File';
      case 'APIConnector': return 'API';
      case 'ModbusConnector': return 'Modbus';
      case 'OPCUAConnector': return 'OPC UA';
      default: return type;
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Data Connectors</Typography>
        <Button 
          variant="contained" 
          onClick={handleOpenDialog}
          disabled={loading}
        >
          Add Connector
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {connectors.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No active data connectors. Click "Add Connector" to set up data streaming.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {connectors.map((connector) => (
                <Grid item xs={12} key={connector.equipment_id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {connector.equipment_id}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={getConnectorTypeName(connector.connector_type)} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Chip 
                            label={connector.status} 
                            size="small" 
                            color={connector.status === 'running' ? 'success' : 'error'} 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={() => handleStopConnector(connector.equipment_id)}
                      >
                        Stop
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Add Connector Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Data Connector</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Connector Type</InputLabel>
                  <Select
                    name="connector_type"
                    value={formValues.connector_type}
                    onChange={handleFormChange}
                    label="Connector Type"
                  >
                    <MenuItem value="csv">CSV File</MenuItem>
                    <MenuItem value="api">API</MenuItem>
                    <MenuItem value="modbus">Modbus</MenuItem>
                    <MenuItem value="opcua">OPC UA</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Equipment</InputLabel>
                  <Select
                    name="equipment_id"
                    value={formValues.equipment_id}
                    onChange={handleFormChange}
                    label="Equipment"
                  >
                    {machines.map((machine) => (
                      <MenuItem key={machine.equipment_id} value={machine.equipment_id}>
                        {machine.equipment_id} - {machine.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Connection Settings
                </Typography>
              </Grid>
              
              {/* Dynamic fields based on connector type */}
              {connectorFields[formValues.connector_type].map((field) => (
                <Grid item xs={12} sm={field.type === 'password' ? 12 : 6} key={field.name}>
                  <TextField
                    name={field.name}
                    label={field.label}
                    type={field.type}
                    required={field.required}
                    fullWidth
                    value={
                      field.paramType === 'config' 
                        ? formValues.config[field.name] || field.defaultValue || '' 
                        : formValues.connection_params[field.name] || field.defaultValue || ''
                    }
                    onChange={handleFormChange}
                  />
                </Grid>
              ))}
              
              {/* API Authentication Section */}
              {formValues.connector_type === 'api' && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Authentication (Optional)
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="auth_username"
                      label="Username"
                      type="text"
                      fullWidth
                      value={formValues.config.auth_username || ''}
                      onChange={handleFormChange}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="auth_password"
                      label="Password"
                      type="password"
                      fullWidth
                      value={formValues.config.auth_password || ''}
                      onChange={handleFormChange}
                      variant="outlined"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formValues.equipment_id}
          >
            {loading ? <CircularProgress size={24} /> : 'Set Up Connector'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ConnectorManager;

 
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
  // eslint-disable-next-line no-unused-vars
  FormHelperText,
  Card,
  CardContent,
  CardActions,
  Stack,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  CloudSync as CloudSyncIcon,
  Stop as StopIcon,
  // eslint-disable-next-line no-unused-vars
  Delete as DeleteIcon,
  Storage as StorageIcon,
  Cable as CableIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import {
  setupConnector,
  stopConnector,
  listConnectors,
  getMachines
} from '../services/api';

const ConnectorManager = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  
  const refreshConnectors = async () => {
    setRefreshing(true);
    try {
      const updatedConnectors = await listConnectors();
      setConnectors(updatedConnectors);
    } catch (error) {
      setError('Failed to refresh connectors: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

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

  // Get connector icon based on type
  const getConnectorIcon = (type) => {
    switch (type) {
      case 'CSVFileConnector': return <StorageIcon />;
      case 'APIConnector': return <ApiIcon />;
      case 'ModbusConnector': return <CableIcon />;
      case 'OPCUAConnector': return <CloudSyncIcon />;
      default: return <StorageIcon />;
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="500">Data Connectors</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh connectors">
            <IconButton 
              onClick={refreshConnectors}
              disabled={loading || refreshing}
              sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: theme => alpha(theme.palette.primary.main, 0.2) } }}
            >
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            onClick={handleOpenDialog}
            disabled={loading}
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Add Connector
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading && !refreshing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {connectors.length === 0 ? (
            <Card sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: 'background.default', 
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider'
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2,
                py: 3
              }}>
                <CloudSyncIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary">
                  No active data connectors
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mb: 2 }}>
                  Data connectors help stream real-time sensor data from your equipment to the predictive maintenance system.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleOpenDialog}
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Add Your First Connector
                </Button>
              </Box>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {connectors.map((connector) => {
                const machineName = machines.find(m => m.equipment_id === connector.equipment_id)?.name || connector.equipment_id;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={connector.equipment_id}>
                    <Card 
                      elevation={0} 
                      sx={{ 
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box 
                            sx={{ 
                              p: 1.5, 
                              borderRadius: 2, 
                              mr: 2,
                              bgcolor: theme => alpha(theme.palette.primary.main, 0.1)
                            }}
                          >
                            {getConnectorIcon(connector.connector_type)}
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="500" noWrap>
                              {machineName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              ID: {connector.equipment_id}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Stack direction="row" spacing={1} mt={2}>
                          <Chip 
                            label={getConnectorTypeName(connector.connector_type)} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Chip 
                            label={connector.status} 
                            size="small" 
                            color="primary"
                            sx={{
                              fontWeight: 'medium',
                              '& .MuiChip-label': { textTransform: 'capitalize' }
                            }}
                          />
                        </Stack>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          startIcon={<StopIcon />}
                          onClick={() => handleStopConnector(connector.equipment_id)}
                          sx={{ borderRadius: 1.5, textTransform: 'none' }}
                        >
                          Stop Connector
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
      
      {/* Add Connector Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 3,
            overflow: 'hidden'
          } 
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'background.default', 
          px: 3, 
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 500
        }}>
          Add Data Connector
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
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
                <FormControl fullWidth variant="outlined">
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
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, mt: 1 }}>
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
                    variant="outlined"
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
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, mt: 1 }}>
                      Authentication (Optional)
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="auth_username"
                      label="Username"
                      type="text"
                      fullWidth
                      variant="outlined"
                      value={formValues.config.auth_username || ''}
                      onChange={handleFormChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="auth_password"
                      label="Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      value={formValues.config.auth_password || ''}
                      onChange={handleFormChange}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2.5, 
          borderTop: '1px solid',
          borderColor: 'divider' 
        }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formValues.equipment_id}
            sx={{ 
              borderRadius: 1.5, 
              textTransform: 'none',
              px: 3,
              fontWeight: 500
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Set Up Connector'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ConnectorManager;

 
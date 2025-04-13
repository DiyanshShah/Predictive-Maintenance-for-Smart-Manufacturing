import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';

const UserProfile = ({ user }) => {
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    role: user?.role || 'Maintenance Engineer',
    phone: '',
    department: 'Maintenance',
  });
  const [error, setError] = useState(null);

  // Function to handle profile data change
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  // Function to handle profile save
  const handleSaveProfile = () => {
    // In a real application, you would call an API to save profile data
    setError({
      severity: 'success',
      message: 'Profile information updated successfully!'
    });
    setTimeout(() => setError(null), 3000);
  };

  return (
    <Paper sx={{ p: 2 }}>
      {error && (
        <Alert 
          severity={error.severity || 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error.message}
        </Alert>
      )}
      
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              src="/profile-placeholder.jpg"
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <Typography variant="h6">{user?.name || 'User Name'}</Typography>
            <Typography variant="body2" color="text.secondary">{profileData.role}</Typography>
            <Button variant="outlined" size="small" sx={{ mt: 2 }}>
              Change Photo
            </Button>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    label="Department"
                  >
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Management">Management</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={profileData.role}
                    onChange={handleProfileChange}
                    label="Role"
                  >
                    <MenuItem value="Maintenance Engineer">Maintenance Engineer</MenuItem>
                    <MenuItem value="Maintenance Technician">Maintenance Technician</MenuItem>
                    <MenuItem value="Operations Manager">Operations Manager</MenuItem>
                    <MenuItem value="Plant Manager">Plant Manager</MenuItem>
                    <MenuItem value="Reliability Engineer">Reliability Engineer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default UserProfile; 
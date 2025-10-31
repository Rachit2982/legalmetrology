import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Alert,
  Paper,
  Divider,
  IconButton,
  Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Upload, Delete, FilePresent } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const AddTrader = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    traderId: '2575TRD', // Default trader ID as requested
    numberOfItems: '',
    indentCertificateNo: '',
    beamScale: '',
    ironWeightHexagonal: '',
    meterMap: '',
    counter: '',
    bullion: '',
    ewm: '', // E.W.M. field
    totalNoOfItems: '',
    feeSubmissionDate: dayjs(),
    reVerificationDate: dayjs(), // Not linked to submission date anymore
    feeAmount: '',
    subscriptionPeriod: 1
  });
  
  const [files, setFiles] = useState({
    certificate: null,
    indent: null
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove auto-calculation as requested - dates are now independent
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.traderId) newErrors.traderId = 'Trader ID is required';
    if (!formData.indentCertificateNo) newErrors.indentCertificateNo = 'Indent/Certificate No. is required';
    if (!formData.numberOfItems || formData.numberOfItems <= 0) newErrors.numberOfItems = 'Valid number of items is required';
    if (!formData.feeSubmissionDate) newErrors.feeSubmissionDate = 'Fee submission date is required';
    if (!formData.reVerificationDate) newErrors.reVerificationDate = 'Re-verification date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    
    if (!validateForm()) return;
    
    try {
      // Get existing traders from localStorage for current user
      const userTradersKey = `traders_${currentUser?.id || 'default'}`;
      const existingTraders = JSON.parse(localStorage.getItem(userTradersKey) || '[]');
      
      // Check for duplicate trader ID
      if (existingTraders.some(trader => trader.traderId === formData.traderId)) {
        setErrors({ traderId: 'Trader ID already exists' });
        return;
      }
      
      // Create new trader object
      const newTrader = {
        ...formData,
        id: Date.now().toString(),
        feeSubmissionDate: formData.feeSubmissionDate.format('YYYY-MM-DD'),
        reVerificationDate: formData.reVerificationDate.format('YYYY-MM-DD'),
        certificateFile: files.certificate?.name || '',
        indentFile: files.indent?.name || '',
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage per user (in real app, this would save to database)
      const updatedTraders = [...existingTraders, newTrader];
      localStorage.setItem(userTradersKey, JSON.stringify(updatedTraders));
      
      // Save files to localStorage with actual content (in real app, these would be uploaded to server)
      const saveFile = (file, traderId, type) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = function(e) {
            const fileData = {
              name: file.name,
              type: file.type,
              size: file.size,
              content: e.target.result, // base64 content
              uploadDate: new Date().toISOString()
            };
            localStorage.setItem(`file_${traderId}_${type}`, JSON.stringify(fileData));
            resolve();
          };
          reader.readAsDataURL(file);
        });
      };

      // Save files with content
      const filePromises = [];
      if (files.certificate) {
        filePromises.push(saveFile(files.certificate, newTrader.id, 'certificate'));
      }
      if (files.indent) {
        filePromises.push(saveFile(files.indent, newTrader.id, 'indent'));
      }

      await Promise.all(filePromises);
      
      setSuccess('Trader added successfully!');
      
      // Reset form but keep default trader ID
      setFormData({
        traderId: '2575TRD',
        numberOfItems: '',
        indentCertificateNo: '',
        beamScale: '',
        ironWeightHexagonal: '',
        meterMap: '',
        counter: '',
        bullion: '',
        ewm: '',
        totalNoOfItems: '',
        feeSubmissionDate: dayjs(),
        reVerificationDate: dayjs(),
        feeAmount: '',
        subscriptionPeriod: 1
      });
      setFiles({ certificate: null, indent: null });
      
    } catch (error) {
      setErrors({ general: 'Error saving trader data. Please try again.' });
    }
  };

  const handleFileChange = (fileType, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [fileType]: 'Please upload only PDF, DOC, DOCX, JPG, or PNG files'
        }));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [fileType]: 'File size should not exceed 10MB'
        }));
        return;
      }

      setFiles(prev => ({
        ...prev,
        [fileType]: file
      }));

      // Clear any previous errors
      if (errors[fileType]) {
        setErrors(prev => ({
          ...prev,
          [fileType]: ''
        }));
      }
    }
  };

  const removeFile = (fileType) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: null
    }));
  };

  const FileUploadBox = ({ fileType, label }) => (
    <Box>
      <Paper
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: errors[fileType] ? 'error.main' : 'grey.300',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: errors[fileType] ? 'error.main' : 'primary.main',
            bgcolor: errors[fileType] ? 'error.light' : 'primary.light'
          }
        }}
      >
        {files[fileType] ? (
          <Box>
            <FilePresent sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              {files[fileType].name}
            </Typography>
            <Chip
              label={`${(files[fileType].size / 1024).toFixed(1)} KB`}
              size="small"
              color="success"
            />
            <IconButton
              size="small"
              onClick={() => removeFile(fileType)}
              sx={{ ml: 1 }}
            >
              <Delete />
            </IconButton>
          </Box>
        ) : (
          <Box>
            <Upload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              Click to upload {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports: PDF, DOC, DOCX, JPG, PNG
            </Typography>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(fileType, e)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
          </Box>
        )}
      </Paper>
      {errors[fileType] && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {errors[fileType]}
        </Typography>
      )}
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          Add New Trader
        </Typography>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              {errors.general && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errors.general}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Basic Information
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Trader ID *"
                    value={formData.traderId}
                    onChange={(e) => handleInputChange('traderId', e.target.value)}
                    error={!!errors.traderId}
                    helperText={errors.traderId}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of Items *"
                    type="number"
                    value={formData.numberOfItems}
                    onChange={(e) => handleInputChange('numberOfItems', parseInt(e.target.value) || '')}
                    error={!!errors.numberOfItems}
                    helperText={errors.numberOfItems}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Indent/Calibration Certificate No. *"
                    value={formData.indentCertificateNo}
                    onChange={(e) => handleInputChange('indentCertificateNo', e.target.value)}
                    error={!!errors.indentCertificateNo}
                    helperText={errors.indentCertificateNo}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Equipment Details
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Beam Scale"
                    value={formData.beamScale}
                    onChange={(e) => handleInputChange('beamScale', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Iron Weight Hexagonal"
                    value={formData.ironWeightHexagonal}
                    onChange={(e) => handleInputChange('ironWeightHexagonal', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Meter/Map"
                    value={formData.meterMap}
                    onChange={(e) => handleInputChange('meterMap', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Counter"
                    value={formData.counter}
                    onChange={(e) => handleInputChange('counter', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bullion"
                    value={formData.bullion}
                    onChange={(e) => handleInputChange('bullion', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E.W.M."
                    value={formData.ewm}
                    onChange={(e) => handleInputChange('ewm', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total No. of Items"
                    type="number"
                    value={formData.totalNoOfItems}
                    onChange={(e) => handleInputChange('totalNoOfItems', parseInt(e.target.value) || '')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fee Amount"
                    type="number"
                    value={formData.feeAmount}
                    onChange={(e) => handleInputChange('feeAmount', parseFloat(e.target.value) || '')}
                    InputProps={{
                      startAdornment: '₹'
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Important Dates
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fee Submission Date *"
                    value={formData.feeSubmissionDate}
                    onChange={(value) => handleInputChange('feeSubmissionDate', value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.feeSubmissionDate}
                        helperText={errors.feeSubmissionDate}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Re-verification Date *"
                    value={formData.reVerificationDate}
                    onChange={(value) => handleInputChange('reVerificationDate', value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.reVerificationDate}
                        helperText={errors.reVerificationDate || "Independent date - not auto-calculated"}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Subscription Period"
                    value={formData.subscriptionPeriod}
                    onChange={(e) => handleInputChange('subscriptionPeriod', parseInt(e.target.value))}
                  >
                    <MenuItem value={1}>1 Year</MenuItem>
                    <MenuItem value={2}>2 Years</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                File Uploads
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Certificate
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <FileUploadBox fileType="certificate" label="certificate" />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Indent
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <FileUploadBox fileType="indent" label="indent" />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setFormData({
                      traderId: '2575TRD',
                      numberOfItems: '',
                      indentCertificateNo: '',
                      beamScale: '',
                      ironWeightHexagonal: '',
                      meterMap: '',
                      counter: '',
                      bullion: '',
                      ewm: '',
                      totalNoOfItems: '',
                      feeSubmissionDate: dayjs(),
                      reVerificationDate: dayjs(),
                      feeAmount: '',
                      subscriptionPeriod: 1
                    });
                    setFiles({ certificate: null, indent: null });
                    setErrors({});
                    setSuccess('');
                  }}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ px: 4 }}
                >
                  Add Trader
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default AddTrader;

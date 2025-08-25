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

const AddTrader = () => {
  const [formData, setFormData] = useState({
    traderId: '',
    challanNumber: '',
    name: '',
    feeAmount: '',
    subscriptionPeriod: 1,
    feeSubmissionDate: dayjs(),
    reVerificationDate: dayjs().add(1, 'year')
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
    
    // Auto-calculate re-verification date based on subscription period and fee submission date
    if (field === 'subscriptionPeriod' || field === 'feeSubmissionDate') {
      const submissionDate = field === 'feeSubmissionDate' ? value : formData.feeSubmissionDate;
      const period = field === 'subscriptionPeriod' ? value : formData.subscriptionPeriod;
      
      if (submissionDate && period) {
        setFormData(prev => ({
          ...prev,
          reVerificationDate: submissionDate.add(period, 'year')
        }));
      }
    }
    
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
    if (!formData.challanNumber) newErrors.challanNumber = 'Challan Number is required';
    if (!formData.name) newErrors.name = 'Trader Name is required';
    if (!formData.feeAmount || formData.feeAmount <= 0) newErrors.feeAmount = 'Valid fee amount is required';
    if (!formData.feeSubmissionDate) newErrors.feeSubmissionDate = 'Fee submission date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');

    if (!validateForm()) return;

    try {
      // Get existing traders from localStorage
      const existingTraders = JSON.parse(localStorage.getItem('traders') || '[]');
      
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
      
      // Save to localStorage (in real app, this would save to database)
      const updatedTraders = [...existingTraders, newTrader];
      localStorage.setItem('traders', JSON.stringify(updatedTraders));
      
      // Save files to localStorage (in real app, these would be uploaded to server)
      if (files.certificate) {
        localStorage.setItem(`file_${newTrader.id}_certificate`, JSON.stringify({
          name: files.certificate.name,
          type: files.certificate.type,
          size: files.certificate.size
        }));
      }
      
      if (files.indent) {
        localStorage.setItem(`file_${newTrader.id}_indent`, JSON.stringify({
          name: files.indent.name,
          type: files.indent.type,
          size: files.indent.size
        }));
      }
      
      setSuccess('Trader added successfully!');
      
      // Reset form
      setFormData({
        traderId: '',
        challanNumber: '',
        name: '',
        feeAmount: '',
        subscriptionPeriod: 1,
        feeSubmissionDate: dayjs(),
        reVerificationDate: dayjs().add(1, 'year')
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
    <Paper
      sx={{
        p: 3,
        border: '2px dashed',
        borderColor: 'grey.300',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.light'
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
                    label="Challan Number *"
                    value={formData.challanNumber}
                    onChange={(e) => handleInputChange('challanNumber', e.target.value)}
                    error={!!errors.challanNumber}
                    helperText={errors.challanNumber}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Trader Name *"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fee Amount *"
                    type="number"
                    value={formData.feeAmount}
                    onChange={(e) => handleInputChange('feeAmount', parseFloat(e.target.value) || '')}
                    error={!!errors.feeAmount}
                    helperText={errors.feeAmount}
                    InputProps={{
                      startAdornment: '₹'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Subscription Period *"
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
                    label="Re-verification Date"
                    value={formData.reVerificationDate}
                    onChange={(value) => handleInputChange('reVerificationDate', value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          readOnly: true
                        }}
                        helperText="Auto-calculated based on subscription period"
                      />
                    )}
                  />
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
                      traderId: '',
                      challanNumber: '',
                      name: '',
                      feeAmount: '',
                      subscriptionPeriod: 1,
                      feeSubmissionDate: dayjs(),
                      reVerificationDate: dayjs().add(1, 'year')
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

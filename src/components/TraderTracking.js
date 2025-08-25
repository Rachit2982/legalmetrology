import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Search,
  FilterList,
  Visibility,
  GetApp,
  InsertDriveFile
} from '@mui/icons-material';
import dayjs from 'dayjs';

const TraderTracking = () => {
  const [traders, setTraders] = useState([]);
  const [filteredTraders, setFilteredTraders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, trader: null });

  useEffect(() => {
    loadTraders();
  }, []);

  useEffect(() => {
    filterTraders();
  }, [traders, searchTerm, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTraders = () => {
    const savedTraders = JSON.parse(localStorage.getItem('traders') || '[]');
    setTraders(savedTraders);
  };

  const filterTraders = () => {
    let filtered = [...traders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trader =>
        trader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trader.traderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trader.challanNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const today = dayjs();
      filtered = filtered.filter(trader => {
        const reVerificationDate = dayjs(trader.reVerificationDate);
        const daysUntilExpiry = reVerificationDate.diff(today, 'day');

        switch (statusFilter) {
          case 'expired':
            return daysUntilExpiry < 0;
          case 'expiring':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
          case 'active':
            return daysUntilExpiry > 30;
          default:
            return true;
        }
      });
    }

    setFilteredTraders(filtered);
  };

  const getStatusInfo = (reVerificationDate) => {
    const today = dayjs();
    const targetDate = dayjs(reVerificationDate);
    const daysUntilExpiry = targetDate.diff(today, 'day');

    if (daysUntilExpiry < 0) {
      return {
        status: 'Expired',
        color: 'error',
        icon: <Warning />,
        days: Math.abs(daysUntilExpiry)
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'Expiring Soon',
        color: 'warning',
        icon: <Warning />,
        days: daysUntilExpiry
      };
    } else {
      return {
        status: 'Active',
        color: 'success',
        icon: <CheckCircle />,
        days: daysUntilExpiry
      };
    }
  };

  const handleDeleteTrader = (trader) => {
    setDeleteDialog({ open: true, trader });
  };

  const confirmDelete = () => {
    if (deleteDialog.trader) {
      const updatedTraders = traders.filter(t => t.id !== deleteDialog.trader.id);
      localStorage.setItem('traders', JSON.stringify(updatedTraders));
      
      // Remove associated files
      localStorage.removeItem(`file_${deleteDialog.trader.id}_certificate`);
      localStorage.removeItem(`file_${deleteDialog.trader.id}_indent`);
      
      setTraders(updatedTraders);
    }
    setDeleteDialog({ open: false, trader: null });
  };

  const viewFile = (traderId, fileType) => {
    const fileData = localStorage.getItem(`file_${traderId}_${fileType}`);
    if (fileData) {
      try {
        const file = JSON.parse(fileData);
        if (file.content) {
          // Create a new window/tab to display the file
          const newWindow = window.open();
          if (newWindow) {
            if (file.type === 'application/pdf') {
              newWindow.document.write(`
                <html>
                  <head><title>${file.name}</title></head>
                  <body style="margin:0;">
                    <embed src="${file.content}" type="application/pdf" width="100%" height="100%">
                  </body>
                </html>
              `);
            } else {
              newWindow.document.write(`
                <html>
                  <head><title>${file.name}</title></head>
                  <body style="margin:0; text-align:center;">
                    <img src="${file.content}" style="max-width:100%; max-height:100vh;">
                  </body>
                </html>
              `);
            }
          }
        }
      } catch (error) {
        alert('Error opening file');
      }
    }
  };

  const downloadFile = (traderId, fileType) => {
    const fileData = localStorage.getItem(`file_${traderId}_${fileType}`);
    if (fileData) {
      try {
        const file = JSON.parse(fileData);
        if (file.content) {
          const link = document.createElement('a');
          link.href = file.content;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        alert('Error downloading file');
      }
    }
  };

  const getFileInfo = (traderId, fileType) => {
    const fileData = localStorage.getItem(`file_${traderId}_${fileType}`);
    if (fileData) {
      try {
        const file = JSON.parse(fileData);
        return file.content ? file : null;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  const getUpcomingReminders = () => {
    const today = dayjs();
    return traders.filter(trader => {
      const reVerificationDate = dayjs(trader.reVerificationDate);
      const daysUntilExpiry = reVerificationDate.diff(today, 'day');
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).sort((a, b) => dayjs(a.reVerificationDate).diff(dayjs(b.reVerificationDate)));
  };

  const upcomingReminders = getUpcomingReminders();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Trader Tracking & Reminders
      </Typography>

      {/* Reminders Section */}
      {upcomingReminders.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 4 }}
          icon={<Warning />}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            {upcomingReminders.length} Trader(s) require attention!
          </Typography>
          {upcomingReminders.slice(0, 3).map((trader, index) => {
            const daysLeft = dayjs(trader.reVerificationDate).diff(dayjs(), 'day');
            return (
              <Typography key={index} variant="body2">
                • <strong>{trader.name}</strong> (ID: {trader.traderId}) - {daysLeft} days until re-verification
              </Typography>
            );
          })}
          {upcomingReminders.length > 3 && (
            <Typography variant="body2">
              ... and {upcomingReminders.length - 3} more
            </Typography>
          )}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search traders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                InputProps={{
                  startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              >
                <MenuItem value="all">All Traders</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expiring">Expiring Soon</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredTraders.length} of {traders.length} traders
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Traders Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Trader ID</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Challan Number</strong></TableCell>
                  <TableCell><strong>Fee Amount</strong></TableCell>
                  <TableCell><strong>Subscription</strong></TableCell>
                  <TableCell><strong>Re-verification Date</strong></TableCell>
                  <TableCell><strong>Certificate</strong></TableCell>
                  <TableCell><strong>Indent</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTraders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {traders.length === 0 ? 'No traders added yet.' : 'No traders match your search criteria.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTraders.map((trader) => {
                    const statusInfo = getStatusInfo(trader.reVerificationDate);
                    const certificateFile = getFileInfo(trader.id, 'certificate');
                    const indentFile = getFileInfo(trader.id, 'indent');
                    
                    return (
                      <TableRow key={trader.id} hover>
                        <TableCell>{trader.traderId}</TableCell>
                        <TableCell>{trader.name}</TableCell>
                        <TableCell>{trader.challanNumber}</TableCell>
                        <TableCell>₹{trader.feeAmount}</TableCell>
                        <TableCell>{trader.subscriptionPeriod} Year(s)</TableCell>
                        <TableCell>
                          {dayjs(trader.reVerificationDate).format('DD/MM/YYYY')}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {statusInfo.status === 'Expired' 
                              ? `${statusInfo.days} days overdue`
                              : `${statusInfo.days} days remaining`
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {certificateFile ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <InsertDriveFile fontSize="small" color="success" />
                              <Typography variant="caption" sx={{ display: 'block', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {certificateFile.name}
                              </Typography>
                              <IconButton size="small" onClick={() => viewFile(trader.id, 'certificate')} title="View file">
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => downloadFile(trader.id, 'certificate')} title="Download file">
                                <GetApp fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Not uploaded
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {indentFile ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <InsertDriveFile fontSize="small" color="success" />
                              <Typography variant="caption" sx={{ display: 'block', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {indentFile.name}
                              </Typography>
                              <IconButton size="small" onClick={() => viewFile(trader.id, 'indent')} title="View file">
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => downloadFile(trader.id, 'indent')} title="Download file">
                                <GetApp fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Not uploaded
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.status}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            title="Edit trader"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTrader(trader)}
                            title="Delete trader"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, trader: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete trader "{deleteDialog.trader?.name}"? 
            This action cannot be undone and will also remove all associated files.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, trader: null })}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TraderTracking;

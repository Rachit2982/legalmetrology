import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Alert
} from '@mui/material';
import {
  PersonAdd,
  TrackChanges,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalTraders: 0,
    expiringSoon: 0,
    expired: 0,
    upToDate: 0
  });
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);

  useEffect(() => {
    // Load user-specific data - in real app, this would fetch from database
    const userTradersKey = `traders_${currentUser?.id || 'default'}`;
    const userTraders = JSON.parse(localStorage.getItem(userTradersKey) || '[]');
    const today = dayjs();
    
    const expiringSoon = userTraders.filter(trader => {
      const reVerificationDate = dayjs(trader.reVerificationDate);
      const daysUntilExpiry = reVerificationDate.diff(today, 'day');
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    const expired = userTraders.filter(trader => {
      const reVerificationDate = dayjs(trader.reVerificationDate);
      return reVerificationDate.isBefore(today);
    });

    const upToDate = userTraders.filter(trader => {
      const reVerificationDate = dayjs(trader.reVerificationDate);
      const daysUntilExpiry = reVerificationDate.diff(today, 'day');
      return daysUntilExpiry > 30;
    });

    setStats({
      totalTraders: mockTraders.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      upToDate: upToDate.length
    });

    setUpcomingRenewals([...expiringSoon, ...expired].slice(0, 5));
  }, []);

  const StatCard = ({ title, value, color, icon, onClick }) => (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)' } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ color, fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: '3rem' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Traders"
            value={stats.totalTraders}
            color="primary.main"
            icon={<PersonAdd />}
            onClick={() => navigate('/tracking')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expiring Soon"
            value={stats.expiringSoon}
            color="warning.main"
            icon={<Warning />}
            onClick={() => navigate('/tracking')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expired"
            value={stats.expired}
            color="error.main"
            icon={<Warning />}
            onClick={() => navigate('/tracking')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Up to Date"
            value={stats.upToDate}
            color="success.main"
            icon={<CheckCircle />}
            onClick={() => navigate('/tracking')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Upcoming Renewals
            </Typography>
            {upcomingRenewals.length === 0 ? (
              <Alert severity="success">
                No upcoming renewals in the next 30 days!
              </Alert>
            ) : (
              <List>
                {upcomingRenewals.map((trader, index) => {
                  const daysUntilExpiry = dayjs(trader.reVerificationDate).diff(dayjs(), 'day');
                  const isExpired = daysUntilExpiry < 0;
                  
                  return (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: isExpired ? 'error.light' : 'warning.light',
                        color: isExpired ? 'error.contrastText' : 'warning.contrastText'
                      }}
                    >
                      <ListItemText
                        primary={trader.name}
                        secondary={`Trader ID: ${trader.traderId} • Re-verification: ${dayjs(trader.reVerificationDate).format('DD/MM/YYYY')}`}
                      />
                      <Chip
                        label={isExpired ? `Expired ${Math.abs(daysUntilExpiry)} days ago` : `${daysUntilExpiry} days left`}
                        color={isExpired ? 'error' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/add-trader')}
                fullWidth
              >
                Add New Trader
              </Button>
              <Button
                variant="outlined"
                startIcon={<TrackChanges />}
                onClick={() => navigate('/tracking')}
                fullWidth
              >
                View All Traders
              </Button>
              <Button
                variant="outlined"
                startIcon={<Warning />}
                onClick={() => navigate('/export')}
                fullWidth
              >
                Export Data
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const alertRoutes = require('./routes/alerts');
const emailService = require('./services/emailService');
const alertMonitor = require('./services/alertMonitor');
const axios = require('axios');
const app = express();
const PORT = process.env. ALERT_SERVICE_PORT || 3007;

// Middleware
app. use(cors());
app.use(express. json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'alert-service',
    timestamp: new Date().toISOString(),
    monitoring: alertMonitor.isRunning
  });
});

// Routes
// Proxy all alert requests to alert service
app.use('/api/alerts', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${ALERT_SERVICE_URL}/api/alerts${req.url}`,
      data: req. body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Alert service proxy error:', error. message);
    res.status(error.response?.status || 500). json({
      success: false,
      message: error.response?. data?.message || 'Alert service error'
    });
  }
});

// MongoDB Connection
const MONGODB_URI = process.env. MONGODB_URI || 'mongodb://localhost:27017/cloudops-alerts';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB (Alerts DB)');
  
  // Verify email service
  await emailService.verifyConnection();
  
  // Start alert monitoring
  alertMonitor.start();
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Alert Service running on port ${PORT}`);
    console.log(`📧 Email notifications: ${process.env.SMTP_USER ?  'Configured' : 'Not configured'}`);
  });
})
. catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process. exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down alert service...');
  alertMonitor.stop();
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process. exit(0);
  });
});
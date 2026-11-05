'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const callRoutes = require('./routes/calls');
const technicianRoutes = require('./routes/technicians');
const documentRoutes = require('./routes/documents');
const serviceRequestRoutes = require('./routes/serviceRequests');
const serviceCategoryRoutes = require('./routes/serviceCategories');
const analyticsRoutes = require('./routes/analytics');
const activityRoutes = require('./routes/activity');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');
const publicJobReportRoutes = require('./routes/publicJobReport');
const technicianPlanRoutes = require('./routes/technicianPlans');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Static files (uploads: technician photos, government IDs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl) or any localhost/127.0.0.1 port
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsers
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// Auth-specific rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 500, // increased for easy development/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again in 15 minutes.'
  }
});

app.use(globalLimiter);

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/calls', callRoutes);
app.use('/api/v1/technicians', technicianRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/service-requests', serviceRequestRoutes);
app.use('/api/v1/service-categories', serviceCategoryRoutes);
app.use('/api/v1/categories', serviceCategoryRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/public/job-report', publicJobReportRoutes);
app.use('/api/v1/technician-plans', technicianPlanRoutes);

// Root and Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Karigar Setu Backend API is running successfully',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Karigar Setu API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Karigar Setu backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;

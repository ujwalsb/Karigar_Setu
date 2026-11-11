'use strict';

const fs = require('fs');
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
const db = require('./config/database');
const { getBrandingFromDb } = require('./utils/branding');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers (allow blob:/data: previews for technician documents & ID card PNG/print popups)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:", "data:", "blob:"],
      frameSrc: ["'self'", "blob:", "data:"],
      objectSrc: ["'self'", "blob:", "data:"],
      upgradeInsecureRequests: null
    }
  }
}));

// Static files (uploads: technician photos, government IDs)
const backendUploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(backendUploadsDir));
const rootUploadsDir = path.join(__dirname, '../../uploads');
if (rootUploadsDir !== backendUploadsDir && fs.existsSync(rootUploadsDir)) {
  app.use('/uploads', express.static(rootUploadsDir));
}

// Serve Frontend static assets if built into public/
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    setHeaders: (res, filePath) => {
      if (path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
}

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

// Health check
app.get('/api/v1/health', async (req, res) => {
  const branding = await getBrandingFromDb(db);
  res.json({
    success: true,
    companyName: branding.companyName,
    message: `${branding.companyName} API is running`,
    timestamp: new Date().toISOString()
  });
});

// If frontend build (index.html) exists in public/, serve it for all UI routes (SPA routing)
const indexHtmlPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  app.get('*', (req, res, next) => {
    // If request starts with /api or /uploads, let it fall through to 404
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(indexHtmlPath);
  });
} else {
  // Fallback API welcome route if frontend is not bundled
  app.get('/', async (req, res) => {
    const branding = await getBrandingFromDb(db);
    res.json({
      success: true,
      companyName: branding.companyName,
      message: `${branding.companyName} Backend API is running successfully`,
      status: 'online',
      version: '1.0.0',
      documentation: '/api/v1/health'
    });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const { initDatabase } = require('./config/initDb');

// Start server after auto-initializing database tables
initDatabase()
  .then(async () => {
    const branding = await getBrandingFromDb(db);
    app.listen(PORT, () => {
      console.log(`${branding.companyName} backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch((err) => {
    console.error('Database auto-initialization error:', err);
    app.listen(PORT, () => {
      console.log(`Service platform backend running on port ${PORT} (with DB warning)`);
    });
  });

module.exports = app;

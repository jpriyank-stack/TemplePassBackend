import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { appConfig } from './config/app_config.js';
import connectDB from './config/db_connect.js';
import { adminRoute, managerRoute } from './common/index.routes.js';


// Connect to database
connectDB();

// Initialize app
const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Serve static files from public folder
app.use('/public', express.static(path.join(__dirname, 'public')));


// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TemplePass API is running',
    version: '1.0.0',
    environment: appConfig.NODE_ENV,
  });
});

// Test config route (for development only)
if (appConfig.NODE_ENV === 'development') {
  app.get('/api/config-test', (req, res) => {
    res.json({
      success: true,
      config: {
        port: appConfig.PORT,
        nodeEnv: appConfig.NODE_ENV,
        templeName: appConfig.TEMPLE_NAME,
        ticketPrice: appConfig.TICKET_PRICE,
        maxTicketsPerDay: appConfig.MAX_TICKETS_PER_DAY,
        dbConnected: true,
        smsEnabled: !!appConfig.SMS_API_KEY,
        paymentEnabled: !!appConfig.RAZORPAY_KEY_ID,
      },
    });
  });
}

// API Routes (we'll add these later)
app.use('/admin', adminRoute);
app.use('/manager', managerRoute);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('\x1b[31m%s\x1b[0m', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: appConfig.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = appConfig.PORT;

const server = app.listen(PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `✅ Server running on port ${PORT}`);
  console.log('\x1b[36m%s\x1b[0m', `🌐 Environment: ${appConfig.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('\x1b[33m%s\x1b[0m', `⚠️  Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('\x1b[33m%s\x1b[0m', '👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('\x1b[32m%s\x1b[0m', '✅ Process terminated');
  });
});
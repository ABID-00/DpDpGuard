require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API version check
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'DPDPGuard API',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/controls', require('./routes/controls'));
app.use('/api/gaps', require('./routes/gaps'));
app.use('/api/action-plan', require('./routes/actionPlan'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/reports', require('./routes/reports'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     DPDPGuard Backend Server         ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 CORS enabled for: ${process.env.FRONTEND_URL}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log('\n✅ Ready to accept requests\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = server;

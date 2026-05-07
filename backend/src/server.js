require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// ── Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────
app.use('/api/blocks',       require('./routes/blockRoutes'));
app.use('/api/units',        require('./routes/unitRoutes'));
app.use('/api/tenants',      require('./routes/tenantRoutes'));
app.use('/api/leases',       require('./routes/leaseRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/maintenance',  require('./routes/maintenanceRoutes'));
app.use('/api/reports',      require('./routes/reportRoutes'));

// ── Health Check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// ── Global Error Handler ──────────────────────────────
// This catches any error thrown anywhere in the app
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Specific PostgreSQL errors
  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      error: 'A record with this value already exists'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist'
    });
  }

  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Value violates system rules: ' + err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ── Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🏢 Rental Management API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
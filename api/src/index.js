require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const providerRoutes = require('./routes/providers');
const adminRoutes = require('./routes/admin');
const sharedRoutes = require('./routes/shared');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json());

// Route manifest
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Ahilney API',
    version: '1.0.0',
    routes: {
      auth: ['POST /api/v1/auth/send-otp', 'POST /api/v1/auth/verify-otp', 'POST /api/v1/auth/provider/login', 'POST /api/v1/auth/admin/login'],
      shared: ['GET /api/v1/providers', 'GET /api/v1/providers/:id', 'GET /api/v1/regions', 'GET /api/v1/services', 'POST /api/v1/promos/validate'],
      patient: ['GET /api/v1/patient/profile', 'PUT /api/v1/patient/profile', 'GET /api/v1/patient/appointments', 'POST /api/v1/patient/appointments', 'GET /api/v1/patient/appointments/:id', 'POST /api/v1/patient/appointments/:id/rate', 'GET /api/v1/patient/wallet', 'POST /api/v1/patient/wallet/topup', 'GET /api/v1/patient/notifications', 'POST /api/v1/patient/notifications/:id/read'],
      provider: ['GET /api/v1/provider/profile', 'GET /api/v1/provider/appointments', 'POST /api/v1/provider/appointments/:id/accept', 'POST /api/v1/provider/appointments/:id/reject', 'POST /api/v1/provider/appointments/:id/start', 'POST /api/v1/provider/appointments/:id/summary', 'GET /api/v1/provider/shifts', 'PUT /api/v1/provider/shifts', 'GET /api/v1/provider/patients', 'GET /api/v1/provider/wallet', 'GET /api/v1/provider/notifications'],
      admin: ['GET /api/v1/admin/stats', 'GET /api/v1/admin/appointments', 'PUT /api/v1/admin/appointments/:id/status', 'GET /api/v1/admin/summaries', 'POST /api/v1/admin/summaries/:id/approve', 'POST /api/v1/admin/summaries/:id/reject', 'GET /api/v1/admin/providers', 'GET /api/v1/admin/providers/:id', 'PUT /api/v1/admin/providers/:id/status', 'PUT /api/v1/admin/providers/:id/documents/:docId', 'GET /api/v1/admin/patients', 'GET /api/v1/admin/patients/:id', 'POST /api/v1/admin/patients/:id/refund', 'GET /api/v1/admin/transactions', 'GET /api/v1/admin/promos', 'POST /api/v1/admin/promos', 'PUT /api/v1/admin/promos/:id', 'GET /api/v1/admin/regions', 'POST /api/v1/admin/regions/:id/subregions', 'DELETE /api/v1/admin/regions/:id/subregions/:subId'],
    },
  });
});

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', sharedRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV !== 'production' ? err.message : undefined });
});

// 404
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Ahilney API running on port ${PORT}`);
  console.log(`   Route manifest: http://localhost:${PORT}/api/v1`);
  console.log(`   Health check:   http://localhost:${PORT}/health`);
  console.log(`   Environment:    ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;

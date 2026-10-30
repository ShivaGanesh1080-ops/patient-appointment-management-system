const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const dbAsync = require('./src/db/database');
const seedData = require('./src/db/seed');

const doctorRoutes = require('./src/routes/doctorRoutes');
const slotRoutes = require('./src/routes/slotRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const { notFoundHandler, globalErrorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Lazy DB init middleware to support both local and Vercel serverless environments
let dbReadyPromise = null;
function getDbReady() {
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      await dbAsync.initSchema();
      const docCheck = await dbAsync.get('SELECT COUNT(*) AS count FROM doctors');
      if (!docCheck || docCheck.count === 0) {
        console.log('🌱 Seeding initial data...');
        await seedData();
      }
    })();
  }
  return dbReadyPromise;
}

app.use(async (req, res, next) => {
  try {
    await getDbReady();
    next();
  } catch (err) {
    next(err);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Patient Appointment Management System API',
    course: 'WTMP (Web Technology & Mobile Programming)',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'local'
  });
});

// API Routes
app.use('/api', doctorRoutes); // contains /api/departments and /api/doctors
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/stats', statsRoutes);

// Catch 404 for undefined API routes
app.use('/api/*', notFoundHandler);

// Fallback to index.html for SPA client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use(globalErrorHandler);

// Start Server locally
async function startServer() {
  try {
    await getDbReady();

    app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`🏥 PATIENT APPOINTMENT MANAGEMENT SYSTEM`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`📋 API Docs & Explorer: http://localhost:${PORT}#api-docs`);
      console.log(`🩺 Doctor Profiles: http://localhost:${PORT}/api/doctors`);
      console.log(`🕒 Available Slots: http://localhost:${PORT}/api/slots?doctorId=doc-101&date=${new Date().toISOString().split('T')[0]}`);
      console.log(`📅 Appointments: http://localhost:${PORT}/api/appointments`);
      console.log('================================================================');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;

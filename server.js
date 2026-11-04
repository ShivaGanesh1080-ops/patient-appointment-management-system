const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');

const dbAsync = require('./src/db/database');
const seedData = require('./src/db/seed');

const doctorRoutes = require('./src/routes/doctorRoutes');
const slotRoutes = require('./src/routes/slotRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const { notFoundHandler, globalErrorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Helmet with customized CSP for CDNs & Medical Headshots
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.unsplash.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Tiered Rate Limiting Middleware
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Anti-DoS rate limit active. Please try again in 15 minutes.'
  }
});

const bookingActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 booking/cancellation actions per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Booking request threshold reached. Anti-bot protection active. Please wait a few minutes before trying again.'
  }
});

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '100kb' })); // Guard against oversized payload attacks
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Lazy DB init middleware to support both local and Vercel serverless environments
let dbReadyPromise = null;
function getDbReady() {
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      console.log('🔄 Initializing SQLite database schema...');
      await dbAsync.initSchema();
      
      const clinicCheck = await dbAsync.get('SELECT COUNT(*) AS count FROM clinics');
      const docCheck = await dbAsync.get('SELECT COUNT(*) AS count FROM doctors');
      if (!docCheck || docCheck.count < 12 || !clinicCheck || clinicCheck.count < 3) {
        console.log('🌱 Updating database with clinics and 12 Indian doctor profiles...');
        await seedData();
      } else {
        console.log(`✅ Database schema verified (${docCheck.count} doctors, ${clinicCheck.count} clinics loaded).`);
      }
    })().catch((err) => {
      console.error('❌ Database initialization error:', err.message);
      dbReadyPromise = null; // Clear cached rejection on failure so subsequent attempts retry
      throw err;
    });
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

// Enterprise Health Check & System Diagnostics Probe
app.get('/api/health', async (req, res) => {
  const t0 = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;
  let doctorCount = 0;

  try {
    await dbAsync.get('SELECT 1 AS ok');
    dbLatencyMs = Date.now() - t0;
    const docCheck = await dbAsync.get('SELECT COUNT(*) AS count FROM doctors');
    doctorCount = docCheck ? docCheck.count : 0;
  } catch (err) {
    dbStatus = 'degraded';
  }

  const mem = process.memoryUsage();
  res.json({
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    service: 'Patient Appointment Management System API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      engine: 'SQLite 3 (WAL Mode)',
      status: dbStatus,
      latencyMs: dbLatencyMs,
      verifiedDoctors: doctorCount
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMB: {
        rss: parseFloat((mem.rss / (1024 * 1024)).toFixed(2)),
        heapUsed: parseFloat((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        heapTotal: parseFloat((mem.heapTotal / (1024 * 1024)).toFixed(2))
      }
    },
    security: {
      rateLimiter: 'active',
      helmetProtection: 'active',
      concurrencyProtection: 'active'
    },
    environment: process.env.VERCEL ? 'vercel-serverless' : 'production-local'
  });
});

// Apply General Rate Limiter to all API endpoints
app.use('/api', generalApiLimiter);

// Apply strict rate limiting to booking endpoints (exempt SSE real-time stream)
app.use('/api/appointments', (req, res, next) => {
  if (req.path === '/stream') return next();
  return bookingActionLimiter(req, res, next);
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
let serverInstance = null;

async function startServer() {
  try {
    await getDbReady();

    const docCheck = await dbAsync.get('SELECT COUNT(*) AS count FROM doctors');

    serverInstance = app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`🏥 PATIENT APPOINTMENT MANAGEMENT SYSTEM (MediPulse)`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`🩺 Verified Doctors: ${docCheck ? docCheck.count : 0}`);
      console.log(`🛡️ Rate Limiting & Helmet Security: ACTIVE`);
      console.log(`📋 API Docs & Explorer: http://localhost:${PORT}#api-docs`);
      console.log('================================================================');

      // Auto-open browser on local startup once server is confirmed ready
      if (!process.env.VERCEL && !process.env.NO_OPEN) {
        setTimeout(() => {
          exec(`start http://localhost:${PORT}`);
        }, 300);
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful Shutdown Handler to cleanly flush SQLite WAL and close HTTP listeners
function handleGracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Draining connections and shutting down gracefully...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      console.log('🔒 Closed active HTTP listener.');
      try {
        await dbAsync.close();
        console.log('💾 SQLite connection safely closed with WAL checkpoints flushed.');
      } catch (err) {
        console.error('⚠️ Error closing database during shutdown:', err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

if (!process.env.VERCEL) {
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  startServer();
}

module.exports = app;

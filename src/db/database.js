const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists (handles both local and Vercel serverless /tmp)
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel 
  ? path.join('/tmp', 'data') 
  : path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'appointments.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath);
  }
});

// Enable Foreign Keys & WAL mode for performance and consistency
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');
  db.run('PRAGMA journal_mode = WAL;');
});

// Initialize Schema
function initSchema() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Departments Table
      db.run(`
        CREATE TABLE IF NOT EXISTS departments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          icon TEXT NOT NULL,
          description TEXT NOT NULL
        )
      `);

      // 2. Doctors Table
      db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          department_id TEXT NOT NULL,
          qualification TEXT NOT NULL,
          experience_years INTEGER NOT NULL,
          consultation_fee REAL NOT NULL,
          rating REAL NOT NULL,
          clinic_address TEXT NOT NULL,
          avatar_url TEXT NOT NULL,
          bio TEXT NOT NULL,
          available_days TEXT NOT NULL,
          slot_start_time TEXT NOT NULL DEFAULT '09:00',
          slot_end_time TEXT NOT NULL DEFAULT '17:00',
          slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
        )
      `);

      // 3. Appointments Table
      db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_reference TEXT NOT NULL UNIQUE,
          doctor_id TEXT NOT NULL,
          patient_name TEXT NOT NULL,
          patient_phone TEXT NOT NULL,
          patient_email TEXT,
          patient_age INTEGER NOT NULL,
          patient_gender TEXT NOT NULL,
          appointment_date TEXT NOT NULL,
          appointment_time TEXT NOT NULL,
          reason TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'CONFIRMED',
          cancellation_reason TEXT,
          cancelled_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
        )
      `);

      // Indexes for rapid queries and conflict lookups
      db.run(`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date, appointment_time, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_appointments_ref ON appointments(booking_reference)`);

      resolve(true);
    });
  });
}

// Promise-based query helpers for clean async/await in controllers
const dbAsync = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  db,
  initSchema
};

module.exports = dbAsync;

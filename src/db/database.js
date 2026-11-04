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

// Helper to execute multi-statement SQL atomically
function execAsync(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Initialize Schema atomically using db.exec
async function initSchema() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      operating_hours TEXT NOT NULL DEFAULT '08:00 - 20:00',
      total_beds INTEGER DEFAULT 50,
      rating REAL DEFAULT 4.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      clinic_id TEXT DEFAULT 'clinic-sru',
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
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_reference TEXT NOT NULL UNIQUE,
      doctor_id TEXT NOT NULL,
      clinic_id TEXT DEFAULT 'clinic-sru',
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
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date, appointment_time, status);
    CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone);
    CREATE INDEX IF NOT EXISTS idx_appointments_ref ON appointments(booking_reference);
  `;

  await execAsync(schemaSql);

  // Dynamic migration for existing databases: ensure clinic_id column exists
  try {
    const doctorColumns = await new Promise((res, rej) => {
      db.all("PRAGMA table_info(doctors)", (err, rows) => err ? rej(err) : res(rows));
    });
    const hasDoctorClinic = doctorColumns.some(col => col.name === 'clinic_id');
    if (!hasDoctorClinic) {
      await execAsync("ALTER TABLE doctors ADD COLUMN clinic_id TEXT DEFAULT 'clinic-sru';");
    }

    const aptColumns = await new Promise((res, rej) => {
      db.all("PRAGMA table_info(appointments)", (err, rows) => err ? rej(err) : res(rows));
    });
    const hasAptClinic = aptColumns.some(col => col.name === 'clinic_id');
    if (!hasAptClinic) {
      await execAsync("ALTER TABLE appointments ADD COLUMN clinic_id TEXT DEFAULT 'clinic-sru';");
    }

    // Now safe to create index on clinic_id
    await execAsync("CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id);");
  } catch (migErr) {
    console.warn('Notice on schema migration:', migErr.message);
  }

  return true;
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
  exec: execAsync,
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  db,
  initSchema
};

module.exports = dbAsync;

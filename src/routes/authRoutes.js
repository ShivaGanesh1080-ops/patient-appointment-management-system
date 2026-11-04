const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * POST /api/auth/doctor-login
 * Authenticates a doctor using their hospital-issued email and password
 */
router.post('/doctor-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Hospital email and password are required.'
      });
    }

    const doctor = await db.get(
      `SELECT d.id, d.name, d.email, d.clinic_id, d.department_id, d.qualification,
              d.experience_years, d.consultation_fee, d.avatar_url, d.rating,
              c.name AS clinic_name, c.city AS clinic_city, dep.name AS department_name
       FROM doctors d
       LEFT JOIN clinics c ON d.clinic_id = c.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE LOWER(TRIM(d.email)) = LOWER(TRIM(?)) AND d.password = ?`,
      [email, password]
    );

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid doctor hospital email or password. Please verify your credentials.'
      });
    }

    res.json({
      success: true,
      message: `Welcome back, ${doctor.name}`,
      doctor
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/hospital-admin-login
 * Authenticates hospital administration personnel
 */
router.post('/hospital-admin-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Hospital admin email and password are required.'
      });
    }

    const clinic = await db.get(
      `SELECT id, name, slug, city, address, phone, admin_email, operating_hours, total_beds, rating
       FROM clinics
       WHERE LOWER(TRIM(admin_email)) = LOWER(TRIM(?)) AND admin_password = ?`,
      [email, password]
    );

    if (!clinic) {
      return res.status(401).json({
        success: false,
        message: 'Invalid hospital admin credentials for this facility.'
      });
    }

    res.json({
      success: true,
      message: `Authenticated as Hospital Operations Desk for ${clinic.name}`,
      clinic
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/platform-admin-login
 * Authenticates master platform superadmin
 */
router.post('/platform-admin-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Superadmin email and password are required.'
      });
    }

    const superAdmin = await db.get(
      `SELECT id, email, name FROM platform_admins WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND password = ?`,
      [email, password]
    );

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid platform superadmin credentials.'
      });
    }

    res.json({
      success: true,
      message: 'Platform SuperAdmin session authenticated.',
      admin: superAdmin
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/patients/quick-register
 * Lightweight patient identification for frictionless booking
 */
router.post('/patient-auth', async (req, res, next) => {
  try {
    const { name, phone, age, gender } = req.body;
    if (!name || !phone || !age) {
      return res.status(400).json({
        success: false,
        message: 'Name, 10-digit mobile number, and age are required.'
      });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }

    const patientId = `pat-${cleanPhone}`;
    await db.run(
      `INSERT OR REPLACE INTO patients (id, name, phone, age, gender)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, name.trim(), cleanPhone, parseInt(age, 10), gender || 'Other']
    );

    const patient = await db.get(`SELECT * FROM patients WHERE id = ?`, [patientId]);

    res.json({
      success: true,
      message: 'Patient identity verified.',
      patient
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clinics
 * Platform SuperAdmin onboards a new hospital into the multi-tenant SaaS
 */
router.post('/clinics', async (req, res, next) => {
  try {
    const { name, city, address, phone, admin_email, admin_password, operating_hours, total_beds } = req.body;
    if (!name || !city || !address || !admin_email || !admin_password) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name, city, address, admin email, and initial password are required.'
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const clinicId = `clinic-${Date.now().toString().slice(-4)}-${slug.slice(0, 10)}`;

    const existing = await db.get(
      `SELECT id FROM clinics WHERE LOWER(admin_email) = LOWER(?) OR slug = ?`,
      [admin_email.trim(), slug]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A hospital with this admin email or name already exists in the network.'
      });
    }

    await db.run(
      `INSERT INTO clinics (id, name, slug, city, address, phone, admin_email, admin_password, operating_hours, total_beds, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.9)`,
      [
        clinicId,
        name.trim(),
        slug,
        city.trim(),
        address.trim(),
        phone || '+91 800 0000000',
        admin_email.trim().toLowerCase(),
        admin_password.trim(),
        operating_hours || '08:00 - 20:00',
        parseInt(total_beds || 50, 10)
      ]
    );

    const newClinic = await db.get(`SELECT * FROM clinics WHERE id = ?`, [clinicId]);

    res.status(201).json({
      success: true,
      message: `Hospital ${name} successfully onboarded into MediPulse network!`,
      clinic: newClinic
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

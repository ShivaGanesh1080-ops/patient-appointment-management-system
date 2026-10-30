const express = require('express');
const router = express.Router();
const dbAsync = require('../db/database');

/**
 * GET /api/departments
 * Fetch all medical departments with doctor count
 */
router.get('/departments', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        d.id, 
        d.name, 
        d.icon, 
        d.description,
        COUNT(doc.id) AS doctor_count
      FROM departments d
      LEFT JOIN doctors doc ON doc.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `;
    const departments = await dbAsync.all(query);
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/doctors
 * List doctors with filtering, search, and sorting
 */
router.get('/doctors', async (req, res, next) => {
  try {
    const { department, search, sortBy } = req.query;

    let sql = `
      SELECT 
        doc.*,
        dept.name AS department_name,
        dept.icon AS department_icon
      FROM doctors doc
      JOIN departments dept ON doc.department_id = dept.id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'all') {
      sql += ` AND doc.department_id = ?`;
      params.push(department);
    }

    if (search && search.trim()) {
      sql += ` AND (
        doc.name LIKE ? OR 
        doc.qualification LIKE ? OR 
        dept.name LIKE ? OR 
        doc.clinic_address LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    if (sortBy === 'rating') {
      sql += ` ORDER BY doc.rating DESC`;
    } else if (sortBy === 'experience') {
      sql += ` ORDER BY doc.experience_years DESC`;
    } else if (sortBy === 'fee_asc') {
      sql += ` ORDER BY doc.consultation_fee ASC`;
    } else if (sortBy === 'fee_desc') {
      sql += ` ORDER BY doc.consultation_fee DESC`;
    } else {
      sql += ` ORDER BY doc.rating DESC, doc.experience_years DESC`;
    }

    const doctors = await dbAsync.all(sql, params);

    // Parse JSON fields
    const formattedDoctors = doctors.map(doc => ({
      ...doc,
      available_days: JSON.parse(doc.available_days || '[]')
    }));

    res.json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/doctors/:id
 * Get single doctor profile with upcoming schedule stats
 */
router.get('/doctors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        doc.*,
        dept.name AS department_name,
        dept.icon AS department_icon,
        dept.description AS department_description
      FROM doctors doc
      JOIN departments dept ON doc.department_id = dept.id
      WHERE doc.id = ?
    `;
    const doctor = await dbAsync.get(sql, [id]);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with ID ${id} not found.`
      });
    }

    doctor.available_days = JSON.parse(doctor.available_days || '[]');

    // Appointment count stats for this doctor
    const stats = await dbAsync.get(
      `SELECT 
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) AS active_appointments,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_appointments
       FROM appointments WHERE doctor_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...doctor,
        stats: {
          activeAppointments: stats.active_appointments || 0,
          completedAppointments: stats.completed_appointments || 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

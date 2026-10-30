const express = require('express');
const router = express.Router();
const dbAsync = require('../db/database');

/**
 * GET /api/stats
 * Dashboard summary statistics
 */
router.get('/', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Counts by status
    const statusCounts = await dbAsync.get(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) AS confirmed,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled,
        COUNT(CASE WHEN appointment_date = ? THEN 1 END) AS today_appointments
      FROM appointments
    `, [today]);

    // Distinct patients
    const patientCount = await dbAsync.get(`
      SELECT COUNT(DISTINCT patient_phone) AS unique_patients FROM appointments
    `);

    // Doctors count
    const doctorCount = await dbAsync.get(`
      SELECT COUNT(*) AS total_doctors FROM doctors
    `);

    // Total revenue from completed consultations
    const revenue = await dbAsync.get(`
      SELECT SUM(doc.consultation_fee) AS total_revenue
      FROM appointments apt
      JOIN doctors doc ON apt.doctor_id = doc.id
      WHERE apt.status = 'COMPLETED'
    `);

    // Department breakdown
    const departmentBreakdown = await dbAsync.all(`
      SELECT 
        dept.name,
        dept.icon,
        COUNT(apt.id) AS appointment_count
      FROM departments dept
      LEFT JOIN doctors doc ON doc.department_id = dept.id
      LEFT JOIN appointments apt ON apt.doctor_id = doc.id
      GROUP BY dept.id
      ORDER BY appointment_count DESC
    `);

    res.json({
      success: true,
      data: {
        totalAppointments: statusCounts.total || 0,
        confirmedAppointments: statusCounts.confirmed || 0,
        completedAppointments: statusCounts.completed || 0,
        cancelledAppointments: statusCounts.cancelled || 0,
        todayAppointments: statusCounts.today_appointments || 0,
        uniquePatients: patientCount.unique_patients || 0,
        totalDoctors: doctorCount.total_doctors || 0,
        totalRevenue: revenue.total_revenue || 0,
        departmentBreakdown
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;

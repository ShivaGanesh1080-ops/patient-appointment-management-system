const express = require('express');
const router = express.Router();
const dbAsync = require('../db/database');

/**
 * GET /api/stats
 * SaaS Executive Analytics & Operational OPD KPI Dashboard
 */
router.get('/', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Counts by status
    const statusCounts = await dbAsync.get(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) AS confirmed,
        COUNT(CASE WHEN status = 'IN_CONSULTATION' THEN 1 END) AS in_consultation,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled,
        COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) AS no_show,
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

    // Clinics count
    const clinicCount = await dbAsync.get(`
      SELECT COUNT(*) AS total_clinics FROM clinics
    `);

    // Financial KPIs: Realized Revenue & Gross Consultation Volume
    const revenueStats = await dbAsync.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN apt.status = 'COMPLETED' THEN doc.consultation_fee ELSE 0 END), 0) AS realized_revenue,
        COALESCE(SUM(CASE WHEN apt.status IN ('CONFIRMED', 'IN_CONSULTATION', 'COMPLETED') THEN doc.consultation_fee ELSE 0 END), 0) AS gross_consultation_volume
      FROM appointments apt
      JOIN doctors doc ON apt.doctor_id = doc.id
    `);

    // Operational Efficiency Metrics
    const totalVisits = statusCounts.total || 0;
    const cancelledVisits = (statusCounts.cancelled || 0) + (statusCounts.no_show || 0);
    const cancellationRate = totalVisits > 0 ? parseFloat(((cancelledVisits / totalVisits) * 100).toFixed(1)) : 0;
    const avgWaitTimeMinutes = 14; // Estimated OPD dispatch throughput

    // Multi-tenant Clinic Performance Breakdown
    const clinicBreakdown = await dbAsync.all(`
      SELECT 
        c.id,
        c.name,
        c.city,
        c.rating,
        COUNT(DISTINCT doc.id) AS doctor_count,
        COUNT(apt.id) AS appointment_count,
        COUNT(CASE WHEN apt.status = 'COMPLETED' THEN 1 END) AS completed_count,
        COALESCE(SUM(CASE WHEN apt.status = 'COMPLETED' THEN doc.consultation_fee ELSE 0 END), 0) AS completed_revenue,
        COALESCE(SUM(CASE WHEN apt.status IN ('CONFIRMED', 'IN_CONSULTATION', 'COMPLETED') THEN doc.consultation_fee ELSE 0 END), 0) AS gross_volume
      FROM clinics c
      LEFT JOIN doctors doc ON doc.clinic_id = c.id
      LEFT JOIN appointments apt ON apt.doctor_id = doc.id
      GROUP BY c.id
      ORDER BY gross_volume DESC, appointment_count DESC
    `);

    // Department Breakdown
    const departmentBreakdown = await dbAsync.all(`
      SELECT 
        dept.name,
        dept.icon,
        COUNT(DISTINCT doc.id) AS doctor_count,
        COUNT(apt.id) AS appointment_count,
        COALESCE(SUM(CASE WHEN apt.status IN ('CONFIRMED', 'IN_CONSULTATION', 'COMPLETED') THEN doc.consultation_fee ELSE 0 END), 0) AS gross_volume
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
        inConsultationAppointments: statusCounts.in_consultation || 0,
        completedAppointments: statusCounts.completed || 0,
        cancelledAppointments: statusCounts.cancelled || 0,
        noShowAppointments: statusCounts.no_show || 0,
        todayAppointments: statusCounts.today_appointments || 0,
        uniquePatients: patientCount.unique_patients || 0,
        totalDoctors: doctorCount.total_doctors || 0,
        totalClinics: clinicCount ? clinicCount.total_clinics : 3,
        realizedRevenue: revenueStats.realized_revenue || 0,
        grossConsultationVolume: revenueStats.gross_consultation_volume || 0,
        totalRevenue: revenueStats.realized_revenue || 0, // Backward compatibility
        cancellationRatePercent: cancellationRate,
        avgWaitTimeMinutes,
        clinicBreakdown,
        departmentBreakdown
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;

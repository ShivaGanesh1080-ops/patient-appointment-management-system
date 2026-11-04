const express = require('express');
const router = express.Router();
const dbAsync = require('../db/database');
const { validateAppointmentPayload, validateCancellationPayload } = require('../middleware/validator');

// Active Server-Sent Events (SSE) Client Connections
const sseClients = new Set();

/**
 * Broadcast event to all connected doctor OPD screens & reception displays
 */
function broadcastAppointmentEvent(eventType, payload) {
  const dataStr = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      if (!client.doctorId || client.doctorId === payload.doctor_id) {
        client.res.write(`data: ${dataStr}\n\n`);
      }
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

/**
 * Generate a clean, unique booking reference
 * Format: APT-YYYY-XXXX (e.g. APT-2026-7842)
 */
function generateBookingReference() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `APT-${year}-${randomNum}`;
}

/**
 * GET /api/appointments/stream
 * Real-time SSE Live Queue stream for Doctor Workspace & OPD Displays
 */
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Handshake event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'MediPulse Real-Time OPD Queue Stream Connected', timestamp: new Date().toISOString() })}\n\n`);

  const client = { res, doctorId: req.query.doctorId || null };
  sseClients.add(client);

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (err) {
      clearInterval(heartbeat);
      sseClients.delete(client);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(client);
  });
});

/**
 * POST /api/appointments
 * Book a new appointment with concurrency guard against double-booking
 */
router.post('/', validateAppointmentPayload, async (req, res, next) => {
  try {
    const {
      doctor_id,
      patient_name,
      patient_phone,
      patient_email,
      patient_age,
      patient_gender,
      appointment_date,
      appointment_time,
      reason
    } = req.body;

    // 1. Verify doctor exists and grab clinic
    const doctor = await dbAsync.get('SELECT id, name, consultation_fee, clinic_id FROM doctors WHERE id = ?', [doctor_id]);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Selected doctor (ID: ${doctor_id}) does not exist.`
      });
    }

    const clinicId = req.body.clinic_id || doctor.clinic_id || 'clinic-sru';

    // 2. Concurrency Check: Check if slot is already occupied
    const existing = await dbAsync.get(
      `SELECT id, booking_reference FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'CANCELLED'`,
      [doctor_id, appointment_date, appointment_time]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Conflict: This time slot (${appointment_time}) on ${appointment_date} has already been reserved. Please select another slot.`,
        conflictBookingRef: existing.booking_reference
      });
    }

    // 3. Generate unique booking reference
    let bookingReference = generateBookingReference();
    let collisionCheck = await dbAsync.get('SELECT id FROM appointments WHERE booking_reference = ?', [bookingReference]);
    while (collisionCheck) {
      bookingReference = generateBookingReference();
      collisionCheck = await dbAsync.get('SELECT id FROM appointments WHERE booking_reference = ?', [bookingReference]);
    }

    // 4. Insert appointment record
    const insertSql = `
      INSERT INTO appointments (
        booking_reference, doctor_id, clinic_id, patient_name, patient_phone,
        patient_email, patient_age, patient_gender, appointment_date,
        appointment_time, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `;

    const result = await dbAsync.run(insertSql, [
      bookingReference,
      doctor_id,
      clinicId,
      patient_name.trim(),
      patient_phone.trim(),
      patient_email ? patient_email.trim() : null,
      parseInt(patient_age, 10),
      patient_gender,
      appointment_date,
      appointment_time,
      reason.trim()
    ]);

    // 5. Fetch complete joined record to return to client
    const newAppointment = await dbAsync.get(
      `SELECT 
        apt.*,
        doc.name AS doctor_name,
        doc.qualification AS doctor_qualification,
        doc.clinic_address AS clinic_address,
        doc.consultation_fee AS consultation_fee,
        doc.avatar_url AS doctor_avatar,
        dept.name AS department_name,
        dept.icon AS department_icon,
        c.name AS clinic_name,
        c.city AS clinic_city
       FROM appointments apt
       JOIN doctors doc ON apt.doctor_id = doc.id
       JOIN departments dept ON doc.department_id = dept.id
       LEFT JOIN clinics c ON apt.clinic_id = c.id
       WHERE apt.id = ?`,
      [result.lastID]
    );

    // Real-Time Dispatch: Broadcast event to Live Queue
    broadcastAppointmentEvent('NEW_BOOKING', newAppointment);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: newAppointment
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/appointments
 * Fetch appointment history with flexible filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { phone, ref, doctorId, clinicId, status, date } = req.query;

    let sql = `
      SELECT 
        apt.*,
        doc.name AS doctor_name,
        doc.qualification AS doctor_qualification,
        doc.clinic_address AS clinic_address,
        doc.consultation_fee AS consultation_fee,
        doc.avatar_url AS doctor_avatar,
        dept.name AS department_name,
        dept.icon AS department_icon,
        c.name AS clinic_name,
        c.city AS clinic_city
      FROM appointments apt
      JOIN doctors doc ON apt.doctor_id = doc.id
      JOIN departments dept ON doc.department_id = dept.id
      LEFT JOIN clinics c ON apt.clinic_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (phone && phone.trim()) {
      sql += ` AND apt.patient_phone LIKE ?`;
      params.push(`%${phone.trim()}%`);
    }

    if (ref && ref.trim()) {
      sql += ` AND apt.booking_reference LIKE ?`;
      params.push(`%${ref.trim().toUpperCase()}%`);
    }

    if (doctorId && doctorId !== 'all') {
      sql += ` AND apt.doctor_id = ?`;
      params.push(doctorId);
    }

    if (clinicId && clinicId !== 'all') {
      sql += ` AND (apt.clinic_id = ? OR c.slug = ?)`;
      params.push(clinicId, clinicId);
    }

    if (status && status !== 'all') {
      sql += ` AND apt.status = ?`;
      params.push(status.toUpperCase());
    }

    if (date) {
      sql += ` AND apt.appointment_date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY apt.appointment_date DESC, apt.appointment_time DESC`;

    const appointments = await dbAsync.all(sql, params);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/appointments/:idOrRef
 * Lookup single appointment
 */
router.get('/:idOrRef', async (req, res, next) => {
  try {
    const { idOrRef } = req.params;

    const sql = `
      SELECT 
        apt.*,
        doc.name AS doctor_name,
        doc.qualification AS doctor_qualification,
        doc.clinic_address AS clinic_address,
        doc.consultation_fee AS consultation_fee,
        doc.avatar_url AS doctor_avatar,
        dept.name AS department_name,
        dept.icon AS department_icon,
        c.name AS clinic_name,
        c.city AS clinic_city
      FROM appointments apt
      JOIN doctors doc ON apt.doctor_id = doc.id
      JOIN departments dept ON doc.department_id = dept.id
      LEFT JOIN clinics c ON apt.clinic_id = c.id
      WHERE apt.id = ? OR apt.booking_reference = ?
    `;

    const appointment = await dbAsync.get(sql, [idOrRef, idOrRef]);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `Appointment with ID/Reference "${idOrRef}" not found.`
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/appointments/:idOrRef/cancel
 * Cancel an appointment with mandatory cancellation reason
 */
router.patch('/:idOrRef/cancel', validateCancellationPayload, async (req, res, next) => {
  try {
    const { idOrRef } = req.params;
    const { cancellation_reason } = req.body;

    const existing = await dbAsync.get(
      'SELECT id, status, booking_reference FROM appointments WHERE id = ? OR booking_reference = ?',
      [idOrRef, idOrRef]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Appointment "${idOrRef}" not found.`
      });
    }

    if (existing.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Appointment ${existing.booking_reference} is already cancelled.`
      });
    }

    if (existing.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an appointment that has already been marked as Completed.`
      });
    }

    await dbAsync.run(
      `UPDATE appointments 
       SET status = 'CANCELLED',
           cancellation_reason = ?,
           cancelled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [cancellation_reason.trim(), existing.id]
    );

    const updated = await dbAsync.get(
      `SELECT 
        apt.*,
        doc.name AS doctor_name,
        dept.name AS department_name,
        c.name AS clinic_name
       FROM appointments apt
       JOIN doctors doc ON apt.doctor_id = doc.id
       JOIN departments dept ON doc.department_id = dept.id
       LEFT JOIN clinics c ON apt.clinic_id = c.id
       WHERE apt.id = ?`,
      [existing.id]
    );

    // Broadcast live event to doctor queue
    broadcastAppointmentEvent('CANCELLED', updated);

    res.json({
      success: true,
      message: `Appointment ${existing.booking_reference} has been cancelled successfully.`,
      data: updated
    });

  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/appointments/:idOrRef/status
 * Update status (CONFIRMED, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW)
 */
router.patch('/:idOrRef/status', async (req, res, next) => {
  try {
    const { idOrRef } = req.params;
    const { status } = req.body;

    const allowed = ['CONFIRMED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!status || !allowed.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`
      });
    }

    const existing = await dbAsync.get(
      'SELECT id, booking_reference FROM appointments WHERE id = ? OR booking_reference = ?',
      [idOrRef, idOrRef]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Appointment "${idOrRef}" not found.`
      });
    }

    await dbAsync.run(
      `UPDATE appointments 
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status.toUpperCase(), existing.id]
    );

    const updated = await dbAsync.get(
      `SELECT 
        apt.*,
        doc.name AS doctor_name,
        dept.name AS department_name,
        c.name AS clinic_name
       FROM appointments apt
       JOIN doctors doc ON apt.doctor_id = doc.id
       JOIN departments dept ON doc.department_id = dept.id
       LEFT JOIN clinics c ON apt.clinic_id = c.id
       WHERE apt.id = ?`,
      [existing.id]
    );

    // Broadcast live status transition
    broadcastAppointmentEvent('STATUS_UPDATED', updated);

    res.json({
      success: true,
      message: `Appointment ${existing.booking_reference} status updated to ${status.toUpperCase()}.`,
      data: updated
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;

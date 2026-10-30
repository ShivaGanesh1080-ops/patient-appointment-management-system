const express = require('express');
const router = express.Router();
const dbAsync = require('../db/database');

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime12H(time24) {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // '0' should be '12'
  const hPadded = h < 10 ? `0${h}` : `${h}`;
  return `${hPadded}:${m} ${ampm}`;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * GET /api/slots?doctorId=doc-101&date=2026-10-31
 * Calculates dynamic time slots and availability status
 */
router.get('/', async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId query parameter is required.' });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'date query parameter in YYYY-MM-DD format is required.' });
    }

    // Retrieve doctor
    const doctor = await dbAsync.get(
      'SELECT id, name, available_days, slot_start_time, slot_end_time, slot_duration_minutes FROM doctors WHERE id = ?',
      [doctorId]
    );

    if (!doctor) {
      return res.status(404).json({ success: false, message: `Doctor ${doctorId} not found.` });
    }

    const targetDate = new Date(`${date}T00:00:00`);
    const dayName = DAYS_OF_WEEK[targetDate.getDay()];
    const availableDays = JSON.parse(doctor.available_days || '[]');
    const isWorkingDay = availableDays.includes(dayName);

    if (!isWorkingDay) {
      return res.json({
        success: true,
        doctorId,
        doctorName: doctor.name,
        date,
        dayName,
        isWorkingDay: false,
        message: `${doctor.name} does not have clinic hours on ${dayName}s.`,
        totalSlots: 0,
        availableCount: 0,
        slots: []
      });
    }

    // Query booked appointments for this doctor & date
    const bookedAppointments = await dbAsync.all(
      `SELECT appointment_time, status, booking_reference 
       FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND status != 'CANCELLED'`,
      [doctorId, date]
    );

    const bookedMap = new Map();
    bookedAppointments.forEach(apt => {
      bookedMap.set(apt.appointment_time, apt);
    });

    // Determine current local time for past slot detection
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = (date === todayStr);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Generate slots
    const startMins = timeToMinutes(doctor.slot_start_time || '09:00');
    const endMins = timeToMinutes(doctor.slot_end_time || '17:00');
    const duration = doctor.slot_duration_minutes || 30;

    const slots = [];
    let availableCount = 0;

    for (let current = startMins; current + duration <= endMins; current += duration) {
      const time24 = minutesToTime(current);
      const displayTime = formatTime12H(time24);

      let period = 'Morning';
      if (current >= 12 * 60 && current < 17 * 60) {
        period = 'Afternoon';
      } else if (current >= 17 * 60) {
        period = 'Evening';
      }

      let status = 'AVAILABLE';
      let bookingRef = null;

      if (bookedMap.has(time24)) {
        status = 'BOOKED';
        bookingRef = bookedMap.get(time24).booking_reference;
      } else if (isToday && current <= currentMinutes) {
        status = 'PAST';
      } else {
        availableCount++;
      }

      slots.push({
        time: time24,
        displayTime,
        period,
        status,
        bookingRef
      });
    }

    res.json({
      success: true,
      doctorId,
      doctorName: doctor.name,
      date,
      dayName,
      isWorkingDay: true,
      totalSlots: slots.length,
      availableCount,
      slots
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;

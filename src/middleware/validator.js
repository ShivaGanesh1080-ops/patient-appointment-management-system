function validateAppointmentPayload(req, res, next) {
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

  const errors = [];

  if (!doctor_id || typeof doctor_id !== 'string') {
    errors.push('Doctor ID is required.');
  }

  if (!patient_name || typeof patient_name !== 'string' || patient_name.trim().length < 2) {
    errors.push('Patient name must be at least 2 characters long.');
  }

  // Validate 10-digit mobile number
  const cleanPhone = (patient_phone || '').replace(/[\s-]/g, '');
  if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
    errors.push('Valid 10-digit phone number is required.');
  }

  // Validate Email if provided
  if (patient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient_email)) {
    errors.push('Please provide a valid email address.');
  }

  const ageNum = parseInt(patient_age, 10);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    errors.push('Patient age must be between 1 and 120.');
  }

  const validGenders = ['Male', 'Female', 'Other'];
  if (!patient_gender || !validGenders.includes(patient_gender)) {
    errors.push('Patient gender must be Male, Female, or Other.');
  }

  // Validate Date format YYYY-MM-DD
  if (!appointment_date || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
    errors.push('Appointment date must be in YYYY-MM-DD format.');
  } else {
    // Check if appointment date is before today
    const selectedDate = new Date(`${appointment_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.push('Appointment date cannot be in the past.');
    }
  }

  // Validate Time format HH:MM
  if (!appointment_time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(appointment_time)) {
    errors.push('Appointment time must be in HH:MM (24-hour) format.');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    errors.push('Reason for visit must be at least 3 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors
    });
  }

  next();
}

function validateCancellationPayload(req, res, next) {
  const { cancellation_reason } = req.body;
  if (!cancellation_reason || typeof cancellation_reason !== 'string' || cancellation_reason.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'A cancellation reason of at least 3 characters is required.'
    });
  }
  next();
}

module.exports = {
  validateAppointmentPayload,
  validateCancellationPayload
};

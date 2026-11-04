/**
 * api.js - REST API Client Module
 * Provides clean async methods for interacting with the Express backend
 */

const API_BASE = '/api';

const api = {
  // Clinic endpoints
  async getClinics() {
    const res = await fetch(`${API_BASE}/clinics`);
    return await handleResponse(res);
  },

  // Department endpoints
  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`);
    return await handleResponse(res);
  },

  // Doctor endpoints
  async getDoctors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_BASE}/doctors?${queryString}` : `${API_BASE}/doctors`;
    const res = await fetch(url);
    return await handleResponse(res);
  },

  async getDoctorById(id) {
    const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(id)}`);
    return await handleResponse(res);
  },

  async createDoctor(payload) {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleResponse(res);
  },

  async deleteDoctor(id) {
    const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await handleResponse(res);
  },

  // Slot endpoints
  async getSlots(doctorId, date) {
    const res = await fetch(`${API_BASE}/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
    return await handleResponse(res);
  },

  // Appointment endpoints
  async bookAppointment(payload) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleResponse(res);
  },

  async getAppointments(filters = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== 'all') query.append(key, val);
    });
    const url = query.toString() ? `${API_BASE}/appointments?${query.toString()}` : `${API_BASE}/appointments`;
    const res = await fetch(url);
    return await handleResponse(res);
  },

  async getAppointmentById(idOrRef) {
    const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(idOrRef)}`);
    return await handleResponse(res);
  },

  async cancelAppointment(idOrRef, cancellationReason) {
    const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(idOrRef)}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancellation_reason: cancellationReason })
    });
    return await handleResponse(res);
  },

  async updateAppointmentStatus(idOrRef, status) {
    const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(idOrRef)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await handleResponse(res);
  },

  // System statistics
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return await handleResponse(res);
  },

  // Auth & Multi-Tenant Management
  async doctorLogin(email, password) {
    const res = await fetch(`${API_BASE}/auth/doctor-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(res);
  },

  async hospitalAdminLogin(email, password) {
    const res = await fetch(`${API_BASE}/auth/hospital-admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(res);
  },

  async platformAdminLogin(email, password) {
    const res = await fetch(`${API_BASE}/auth/platform-admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(res);
  },

  async registerPatient(name, phone, age, gender) {
    const res = await fetch(`${API_BASE}/patient-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, age, gender })
    });
    return await handleResponse(res);
  },

  async createHospital(payload) {
    const res = await fetch(`${API_BASE}/clinics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleResponse(res);
  },

  // ---------------------------------------------------------
  // Custom Doctor Persistence & Self-Healing Synchronization
  // ---------------------------------------------------------
  getCustomDoctors() {
    try {
      return JSON.parse(localStorage.getItem('medipulse_custom_doctors') || '[]');
    } catch (e) {
      return [];
    }
  },

  saveCustomDoctor(doctor) {
    if (!doctor || !doctor.name) return;
    try {
      let list = this.getCustomDoctors();
      if (!doctor.department_name && doctor.department_id) {
        const deptNames = {
          'dept-cardio': 'Cardiology',
          'dept-derma': 'Dermatology',
          'dept-pediatrics': 'Pediatrics',
          'dept-ortho': 'Orthopedics',
          'dept-neuro': 'Neurology',
          'dept-genmed': 'General Medicine'
        };
        doctor.department_name = deptNames[doctor.department_id] || 'Specialist';
      }
      const existingIdx = list.findIndex(d => 
        (d.id && doctor.id && d.id === doctor.id) || 
        (d.email && doctor.email && d.email.toLowerCase() === doctor.email.toLowerCase())
      );
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...doctor };
      } else {
        list.unshift(doctor);
      }
      localStorage.setItem('medipulse_custom_doctors', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist custom doctor locally:', e);
    }
  },

  removeCustomDoctor(id) {
    try {
      let list = this.getCustomDoctors();
      list = list.filter(d => d.id !== id);
      localStorage.setItem('medipulse_custom_doctors', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to remove custom doctor from local storage:', e);
    }
  },

  syncDoctors(serverDoctors = [], clinicId = null) {
    let result = Array.isArray(serverDoctors) ? [...serverDoctors] : [];
    const customDocs = this.getCustomDoctors();

    const matchingCustom = customDocs.filter(doc => {
      if (!clinicId || clinicId === 'all') return true;
      return doc.clinic_id === clinicId || !doc.clinic_id;
    });

    for (const customDoc of matchingCustom) {
      const existsOnServer = result.some(d => 
        d.id === customDoc.id || 
        (d.email && customDoc.email && d.email.toLowerCase() === customDoc.email.toLowerCase())
      );

      if (!existsOnServer) {
        result.unshift(customDoc);
        // Self-heal: ensure server SQLite has row in background
        this.healDoctorOnServer(customDoc);
      }
    }

    return result;
  },

  async healDoctorOnServer(doc) {
    try {
      await fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: doc.id,
          name: doc.name,
          email: doc.email,
          password: doc.password || 'doctor123',
          clinic_id: doc.clinic_id || 'clinic-sru',
          clinic_address: doc.clinic_address || 'Hospital Medical Campus',
          department_id: doc.department_id,
          consultation_fee: doc.consultation_fee,
          qualification: doc.qualification,
          experience_years: doc.experience_years,
          rating: doc.rating || 4.9,
          avatar_url: doc.avatar_url,
          bio: doc.bio,
          available_days: doc.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          slot_start_time: doc.slot_start_time || '09:00',
          slot_end_time: doc.slot_end_time || '16:00',
          slot_duration_minutes: doc.slot_duration_minutes || 30
        })
      });
    } catch (e) {
      // Non-blocking self-healing
    }
  },

  // ---------------------------------------------------------
  // Appointment Persistence & Cross-Portal Synchronization
  // ---------------------------------------------------------
  saveCustomAppointment(apt) {
    if (!apt || !apt.booking_reference) return;
    try {
      let list = this.getCustomAppointments();
      const idx = list.findIndex(a => a.booking_reference === apt.booking_reference);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...apt };
      } else {
        list.unshift(apt);
      }
      localStorage.setItem('medipulse_all_appointments', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save custom appointment locally:', e);
    }
  },

  getCustomAppointments() {
    let combined = [];
    try {
      const allApts = JSON.parse(localStorage.getItem('medipulse_all_appointments') || '[]');
      const passes = JSON.parse(localStorage.getItem('medipulse_my_passes') || '[]');
      const seen = new Set();
      [...allApts, ...passes].forEach(item => {
        if (item && item.booking_reference && !seen.has(item.booking_reference)) {
          seen.add(item.booking_reference);
          combined.push(item);
        }
      });
    } catch (e) {
      combined = [];
    }
    return combined;
  },

  syncDoctorAppointments(serverApts = [], doctor = null) {
    let result = Array.isArray(serverApts) ? [...serverApts] : [];
    if (!doctor) return result;

    const localApts = this.getCustomAppointments();
    const docId = (doctor.id || '').toLowerCase();
    const docName = (doctor.name || '').toLowerCase().replace('dr.', '').trim();

    // Match appointments for this doctor by ID or doctor_name
    const matchingLocal = localApts.filter(apt => {
      const aptDocId = (apt.doctor_id || '').toLowerCase();
      const aptDocName = (apt.doctor_name || '').toLowerCase().replace('dr.', '').trim();
      return (aptDocId && aptDocId === docId) ||
             (aptDocName && docName && (aptDocName.includes(docName) || docName.includes(aptDocName)));
    });

    for (const lApt of matchingLocal) {
      const exists = result.some(a => a.booking_reference === lApt.booking_reference);
      if (!exists) {
        result.unshift(lApt);
        this.healAppointmentOnServer(lApt);
      }
    }

    return result;
  },

  async healAppointmentOnServer(apt) {
    try {
      await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: apt.doctor_id,
          doctor_name: apt.doctor_name,
          clinic_id: apt.clinic_id,
          patient_name: apt.patient_name,
          patient_phone: apt.patient_phone,
          patient_email: apt.patient_email,
          patient_age: apt.patient_age,
          patient_gender: apt.patient_gender,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          reason: apt.reason || 'General Medical Consultation'
        })
      });
    } catch (e) {
      // Non-blocking self-healing
    }
  }
};

/**
 * Handle HTTP Response & Error Extraction
 */
async function handleResponse(response) {
  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(`Invalid JSON response: HTTP ${response.status}`);
  }

  if (!response.ok) {
    const errorMsg = json.message || (json.errors ? json.errors.join(', ') : `HTTP ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.payload = json;
    throw error;
  }

  return json;
}

window.api = api;

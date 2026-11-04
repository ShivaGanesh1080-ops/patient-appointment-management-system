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

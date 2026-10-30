/**
 * doctor-portal.js - Doctor & Clinic Desk Operations
 * Handles doctor consultation queue, status transitions to 'COMPLETED', and doctor analytics
 */

let portalState = {
  activeDoctorId: '',
  appointments: []
};

/**
 * Initialize Doctor Portal View
 */
async function loadDoctorPortalData() {
  const select = document.getElementById('portal-doctor-select');
  if (!select) return;

  // Populate doctor select if not populated
  if (select.options.length === 0) {
    state.doctors.forEach(doc => {
      const opt = document.createElement('option');
      opt.value = doc.id;
      opt.textContent = `${doc.name} (${doc.department_name})`;
      select.appendChild(opt);
    });
  }

  if (!portalState.activeDoctorId && select.options.length > 0) {
    portalState.activeDoctorId = select.value;
  } else if (select.value) {
    portalState.activeDoctorId = select.value;
  }

  if (!portalState.activeDoctorId) return;

  await renderDoctorSnapshot(portalState.activeDoctorId);
  await renderDoctorQueue(portalState.activeDoctorId);
}

/**
 * Render Doctor Header Snapshot
 */
async function renderDoctorSnapshot(doctorId) {
  const container = document.getElementById('portal-doctor-snapshot');
  if (!container) return;

  try {
    const res = await api.getDoctorById(doctorId);
    const doc = res.data;

    container.innerHTML = `
      <div class="flex items-center space-x-4">
        <img 
          src="${doc.avatar_url}" 
          alt="${doc.name}" 
          class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-md bg-slate-800"
        />
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-indigo-300">${doc.department_name} Consultation Desk</span>
          <h3 class="text-xl font-bold text-white">${doc.name}</h3>
          <p class="text-xs text-slate-300">${doc.qualification} • ${doc.clinic_address}</p>
        </div>
      </div>

      <div class="flex items-center space-x-4 text-xs">
        <div class="bg-indigo-900/60 border border-indigo-700/60 px-4 py-2 rounded-xl text-center">
          <p class="text-indigo-200">Scheduled</p>
          <p class="text-lg font-bold text-white">${doc.stats.activeAppointments}</p>
        </div>
        <div class="bg-emerald-900/40 border border-emerald-700/60 px-4 py-2 rounded-xl text-center">
          <p class="text-emerald-300">Completed</p>
          <p class="text-lg font-bold text-emerald-300">${doc.stats.completedAppointments}</p>
        </div>
        <div class="bg-blue-900/40 border border-blue-700/60 px-4 py-2 rounded-xl text-center">
          <p class="text-blue-200">Fee / Visit</p>
          <p class="text-lg font-bold text-white">₹${doc.consultation_fee}</p>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-red-400">Failed to load doctor snapshot: ${err.message}</p>`;
  }
}

/**
 * Render Doctor Scheduled Queue
 */
async function renderDoctorQueue(doctorId) {
  const container = document.getElementById('portal-appointments-container');
  const countEl = document.getElementById('portal-queue-count');
  if (!container) return;

  container.innerHTML = `
    <div class="py-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-500 mb-2"></i>
      <p class="text-xs">Fetching consultations queue...</p>
    </div>
  `;

  try {
    const res = await api.getAppointments({ doctorId });
    portalState.appointments = res.data;

    if (countEl) {
      countEl.textContent = `Showing ${res.data.length} appointment records`;
    }

    if (res.data.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <i class="fa-solid fa-calendar-check text-3xl mb-2 text-slate-300"></i>
          <p class="text-sm font-semibold text-slate-700">No appointments scheduled for this doctor</p>
          <p class="text-xs text-slate-500 mt-0.5">Patients can book slots via the Book Appointment tab.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = res.data.map(apt => {
      let isActionable = (apt.status === 'CONFIRMED');

      let statusBadge = '';
      if (apt.status === 'CONFIRMED') {
        statusBadge = `<span class="badge-confirmed px-2.5 py-0.5 rounded-full text-xs font-bold">Upcoming</span>`;
      } else if (apt.status === 'COMPLETED') {
        statusBadge = `<span class="badge-completed px-2.5 py-0.5 rounded-full text-xs font-bold">Completed</span>`;
      } else if (apt.status === 'CANCELLED') {
        statusBadge = `<span class="badge-cancelled px-2.5 py-0.5 rounded-full text-xs font-bold">Cancelled</span>`;
      }

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                ${apt.booking_reference}
              </span>
              ${statusBadge}
              <span class="text-xs text-slate-400">•</span>
              <span class="text-xs font-bold text-slate-700">
                <i class="fa-regular fa-clock mr-1 text-indigo-500"></i> ${apt.appointment_date} at ${apt.appointment_time}
              </span>
            </div>

            <h4 class="font-bold text-slate-900 text-sm">
              ${apt.patient_name} <span class="text-xs text-slate-500 font-normal">(${apt.patient_age} yrs, ${apt.patient_gender})</span>
            </h4>

            <p class="text-xs text-slate-600">
              <span class="text-slate-400">Phone:</span> <strong>${apt.patient_phone}</strong> • 
              <span class="text-slate-400">Reason:</span> <em>"${apt.reason}"</em>
            </p>
          </div>

          <!-- Doctor Queue Actions -->
          <div class="flex items-center space-x-2 self-end md:self-auto">
            ${isActionable ? `
              <button 
                onclick="markConsultationCompleted('${apt.booking_reference}')" 
                class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5 transition-all"
              >
                <i class="fa-solid fa-check"></i>
                <span>Mark Completed</span>
              </button>
            ` : ''}

            <button 
              onclick="viewSlipFromHistory('${apt.booking_reference}')" 
              class="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Slip
            </button>
          </div>

        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="p-4 text-center text-red-500 text-xs">Error: ${err.message}</div>`;
  }
}

/**
 * Mark Consultation as Completed
 */
async function markConsultationCompleted(bookingRef) {
  try {
    const res = await api.updateAppointmentStatus(bookingRef, 'COMPLETED');
    showToast(`Appointment ${bookingRef} marked as Completed!`, 'success');

    // Refresh views
    await renderDoctorSnapshot(portalState.activeDoctorId);
    await renderDoctorQueue(portalState.activeDoctorId);
    await refreshStats();

  } catch (err) {
    showToast(err.message || 'Failed to update appointment status.', 'error');
  }
}

// Global expose
window.loadDoctorPortalData = loadDoctorPortalData;
window.markConsultationCompleted = markConsultationCompleted;

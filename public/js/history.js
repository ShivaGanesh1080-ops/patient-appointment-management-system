/**
 * history.js - Appointment History & Cancellation Management Module
 * Filters, Status Badges, Cancellation Dialog, and Printable Slip Generator
 */

let historyState = {
  appointments: [],
  selectedForCancel: null
};

let historySearchTimeout = null;

function debounceAppointmentSearch() {
  clearTimeout(historySearchTimeout);
  historySearchTimeout = setTimeout(() => {
    fetchAppointmentsHistory();
  }, 300);
}

/**
 * Fetch and Render Appointments History
 */
async function fetchAppointmentsHistory() {
  const container = document.getElementById('appointments-list-container');
  if (!container) return;

  const phone = document.getElementById('filter-phone-input').value.trim();
  const ref = document.getElementById('filter-ref-input').value.trim();
  const status = document.getElementById('filter-status-select').value;
  const doctorId = document.getElementById('filter-doctor-select').value;

  container.innerHTML = `
    <div class="py-12 text-center text-slate-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i>
      <p class="text-xs">Loading appointment records...</p>
    </div>
  `;

  // Populate doctor select in filter if empty
  populateHistoryDoctorFilter();

  try {
    const res = await api.getAppointments({ phone, ref, status, doctorId });
    historyState.appointments = res.data;
    renderAppointmentsHistory(historyState.appointments);
  } catch (err) {
    container.innerHTML = `
      <div class="py-8 text-center text-red-500 text-xs">
        Failed to fetch records: ${err.message}
      </div>
    `;
  }
}

/**
 * Populate Doctor Filter in History
 */
function populateHistoryDoctorFilter() {
  const select = document.getElementById('filter-doctor-select');
  if (!select || select.options.length > 1) return;

  state.doctors.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = doc.name;
    select.appendChild(opt);
  });
}

/**
 * Render Appointment History Cards
 */
function renderAppointmentsHistory(appointments) {
  const container = document.getElementById('appointments-list-container');
  if (!container) return;

  if (appointments.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        <i class="fa-regular fa-calendar-xmark text-3xl mb-2 text-slate-300"></i>
        <p class="text-sm font-semibold text-slate-700">No appointments found</p>
        <p class="text-xs text-slate-500 mt-0.5">Try clearing your search query or filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appointments.map(apt => {
    let statusBadge = '';
    let isCancellable = (apt.status === 'CONFIRMED');

    if (apt.status === 'CONFIRMED') {
      statusBadge = `<span class="badge-confirmed px-2.5 py-1 rounded-full text-xs font-bold flex items-center"><i class="fa-solid fa-circle-check mr-1.5 text-[10px]"></i> Confirmed</span>`;
    } else if (apt.status === 'COMPLETED') {
      statusBadge = `<span class="badge-completed px-2.5 py-1 rounded-full text-xs font-bold flex items-center"><i class="fa-solid fa-check-double mr-1.5 text-[10px]"></i> Completed</span>`;
    } else if (apt.status === 'CANCELLED') {
      statusBadge = `<span class="badge-cancelled px-2.5 py-1 rounded-full text-xs font-bold flex items-center"><i class="fa-solid fa-ban mr-1.5 text-[10px]"></i> Cancelled</span>`;
    }

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <!-- Left Column: Details -->
        <div class="flex items-start space-x-3.5">
          <img 
            src="${apt.doctor_avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100'}" 
            alt="${apt.doctor_name}" 
            class="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
          />

          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                ${apt.booking_reference}
              </span>
              ${statusBadge}
            </div>

            <h4 class="font-bold text-slate-900 text-sm sm:text-base">
              ${apt.patient_name} <span class="text-xs font-normal text-slate-500">(${apt.patient_age} yrs, ${apt.patient_gender})</span>
            </h4>

            <p class="text-xs text-slate-600">
              Consulting <strong>${apt.doctor_name}</strong> • <span class="text-slate-500">${apt.department_name}</span>
            </p>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
              <span><i class="fa-regular fa-calendar mr-1 text-blue-500"></i> ${apt.appointment_date}</span>
              <span><i class="fa-regular fa-clock mr-1 text-blue-500"></i> ${apt.appointment_time}</span>
              <span><i class="fa-solid fa-phone mr-1 text-slate-400"></i> ${apt.patient_phone}</span>
              <span><i class="fa-solid fa-indian-rupee-sign mr-1 text-emerald-500"></i> ₹${apt.consultation_fee}</span>
            </div>

            <p class="text-xs text-slate-500 italic pt-1">
              "Reason: ${apt.reason}"
            </p>

            ${apt.status === 'CANCELLED' && apt.cancellation_reason ? `
              <p class="text-[11px] text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 mt-1 inline-block">
                <strong>Cancellation Note:</strong> ${apt.cancellation_reason}
              </p>
            ` : ''}
          </div>
        </div>

        <!-- Right Column: Actions -->
        <div class="flex md:flex-col items-center justify-end space-x-2 md:space-x-0 md:space-y-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <button 
            onclick="viewSlipFromHistory('${apt.booking_reference}')" 
            class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-colors"
            title="Print or view token pass"
          >
            <i class="fa-solid fa-print text-blue-600"></i>
            <span>Token Pass</span>
          </button>

          ${isCancellable ? `
            <button 
              onclick="openCancelModal('${apt.booking_reference}')" 
              class="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center space-x-1.5 transition-colors"
            >
              <i class="fa-solid fa-xmark"></i>
              <span>Cancel Slot</span>
            </button>
          ` : ''}
        </div>

      </div>
    `;
  }).join('');
}

/**
 * Open Cancellation Modal
 */
function openCancelModal(bookingRef) {
  historyState.selectedForCancel = bookingRef;
  document.getElementById('cancel-modal-ref').textContent = bookingRef;
  document.getElementById('cancel-reason-input').value = '';
  document.getElementById('modal-cancel').classList.remove('hidden');
}

function closeCancelModal() {
  document.getElementById('modal-cancel').classList.add('hidden');
  historyState.selectedForCancel = null;
}

/**
 * Submit Appointment Cancellation
 */
async function submitCancellation() {
  const bookingRef = historyState.selectedForCancel;
  const reason = document.getElementById('cancel-reason-input').value.trim();

  if (!reason || reason.length < 3) {
    showToast('Please provide a reason of at least 3 characters.', 'warning');
    return;
  }

  try {
    const res = await api.cancelAppointment(bookingRef, reason);
    showToast(res.message, 'success');
    closeCancelModal();

    // Refresh views
    await fetchAppointmentsHistory();
    await refreshStats();

  } catch (err) {
    showToast(err.message || 'Failed to cancel appointment.', 'error');
  }
}

/**
 * View Slip for an appointment from History
 */
function viewSlipFromHistory(bookingRef) {
  const apt = historyState.appointments.find(a => a.booking_reference === bookingRef);
  if (apt && typeof openSlipModal === 'function') {
    openSlipModal(apt);
  }
}

function refreshAppointmentsHistory() {
  fetchAppointmentsHistory();
}

// Global expose
window.fetchAppointmentsHistory = fetchAppointmentsHistory;
window.debounceAppointmentSearch = debounceAppointmentSearch;
window.refreshAppointmentsHistory = refreshAppointmentsHistory;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.submitCancellation = submitCancellation;
window.viewSlipFromHistory = viewSlipFromHistory;

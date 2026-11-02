/**
 * booking.js - Appointment Booking & Time Slot Selection Controller
 * Handles Doctor Scheduling, Dynamic Slot Grid, Form Validation, and Slip Receipt
 */

const bookingState = {
  selectedDoctorId: '',
  selectedDoctor: null,
  selectedDate: '',
  selectedSlotTime: '',
  slotsData: []
};

document.addEventListener('DOMContentLoaded', () => {
  initializeBookingDateLimits();
});

/**
 * Set Minimum Date to Today and Maximum to 30 Days Out
 */
function initializeBookingDateLimits() {
  const dateInput = document.getElementById('booking-date-input');
  if (!dateInput) return;

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  const formatDate = (d) => d.toISOString().split('T')[0];

  dateInput.min = formatDate(today);
  dateInput.max = formatDate(maxDate);

  // Default to tomorrow if today is late evening, or today
  const defaultDate = new Date();
  if (defaultDate.getHours() >= 17) {
    defaultDate.setDate(defaultDate.getDate() + 1);
  }
  dateInput.value = formatDate(defaultDate);
  bookingState.selectedDate = dateInput.value;
}

/**
 * Populate Doctor Dropdown from state
 */
function populateBookingDoctors(doctors) {
  const select = document.getElementById('booking-doctor-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Choose a Consulting Doctor --</option>';

  doctors.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = `${doc.name} (${doc.department_name} • ₹${doc.consultation_fee})`;
    select.appendChild(opt);
  });

  if (currentVal) select.value = currentVal;
}

/**
 * Doctor selection changed
 */
async function onBookingDoctorChanged() {
  const select = document.getElementById('booking-doctor-select');
  const docId = select.value;
  bookingState.selectedDoctorId = docId;
  bookingState.selectedSlotTime = '';

  if (!docId) {
    bookingState.selectedDoctor = null;
    updateBookingSummary();
    const container = document.getElementById('slots-container');
    container.innerHTML = '<p class="text-xs text-slate-500 italic">Please select a doctor to view their schedule.</p>';
    return;
  }

  // Find doctor in state or fetch
  bookingState.selectedDoctor = state.doctors.find(d => d.id === docId) || null;
  if (!bookingState.selectedDoctor) {
    const res = await api.getDoctorById(docId);
    bookingState.selectedDoctor = res.data;
  }

  updateBookingSummary();
  await fetchAvailableSlots();
}

/**
 * Fetch and Render Available Slots for Selected Doctor & Date
 */
async function fetchAvailableSlots() {
  const dateInput = document.getElementById('booking-date-input');
  const docId = bookingState.selectedDoctorId;
  const date = dateInput.value;

  bookingState.selectedDate = date;
  bookingState.selectedSlotTime = '';
  updateBookingSummary();

  const container = document.getElementById('slots-container');
  if (!container) return;

  if (!docId) {
    container.innerHTML = '<p class="text-xs text-slate-500 italic">Please select a doctor first.</p>';
    return;
  }

  if (!date) {
    container.innerHTML = '<p class="text-xs text-slate-500 italic">Please select a valid date.</p>';
    return;
  }

  container.innerHTML = `
    <div class="py-6 text-center text-slate-400 w-full">
      <i class="fa-solid fa-spinner fa-spin text-xl text-emerald-600 mb-2"></i>
      <p class="text-xs">Computing live slot availability...</p>
    </div>
  `;

  try {
    const res = await api.getSlots(docId, date);
    bookingState.slotsData = res.slots || [];

    if (!res.isWorkingDay) {
      container.innerHTML = `
        <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center w-full">
          <i class="fa-solid fa-calendar-xmark text-lg mb-1 block"></i>
          <strong>${res.message}</strong>
          <p class="mt-1 text-slate-600">Available clinic days: ${bookingState.selectedDoctor.available_days.join(', ')}</p>
        </div>
      `;
      return;
    }

    if (bookingState.slotsData.length === 0) {
      container.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs text-center w-full">
          No slots generated for this schedule.
        </div>
      `;
      return;
    }

    // Group slots by period (Morning, Afternoon, Evening)
    const morningSlots = bookingState.slotsData.filter(s => s.period === 'Morning');
    const afternoonSlots = bookingState.slotsData.filter(s => s.period === 'Afternoon');
    const eveningSlots = bookingState.slotsData.filter(s => s.period === 'Evening');

    let html = `
      <div class="w-full space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-600 pb-1 border-b border-slate-200">
          <span>Day: <strong>${res.dayName}</strong> (${res.date})</span>
          <span class="font-semibold text-emerald-600">${res.availableCount} of ${res.totalSlots} Slots Available</span>
        </div>
    `;

    const renderSlotGroup = (title, slots, icon) => {
      if (slots.length === 0) return '';
      return `
        <div>
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
            <i class="${icon} mr-1.5 text-emerald-600"></i> ${title}
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            ${slots.map(s => {
              const isAvailable = s.status === 'AVAILABLE';
              let badgeColor = isAvailable 
                ? 'bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700' 
                : 'bg-slate-200/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-60';

              let titleHint = isAvailable ? 'Click to select this slot' : (s.status === 'BOOKED' ? 'Already reserved' : 'Time passed');

              return `
                <button 
                  type="button"
                  ${!isAvailable ? 'disabled' : ''}
                  class="slot-btn text-xs font-semibold py-2 px-2.5 rounded-xl border transition-all text-center ${badgeColor}"
                  data-time="${s.time}"
                  title="${titleHint}"
                  onclick="selectSlot('${s.time}')"
                >
                  ${s.displayTime}
                  ${!isAvailable ? `<span class="block text-[9px] font-normal uppercase">${s.status}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    };

    html += renderSlotGroup('Morning Sessions', morningSlots, 'fa-regular fa-sun');
    html += renderSlotGroup('Afternoon Sessions', afternoonSlots, 'fa-solid fa-cloud-sun');
    html += renderSlotGroup('Evening Sessions', eveningSlots, 'fa-regular fa-moon');
    html += `</div>`;

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `
      <div class="p-3 text-center text-red-500 text-xs">
        Failed to fetch slots: ${err.message}
      </div>
    `;
  }
}

/**
 * Handle Slot Selection
 */
function selectSlot(timeStr) {
  bookingState.selectedSlotTime = timeStr;

  // Update styles
  document.querySelectorAll('.slot-btn').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.getAttribute('data-time') === timeStr) {
      btn.classList.add('selected');
    }
  });

  updateBookingSummary();
}

/**
 * Update Booking Summary Box
 */
function updateBookingSummary() {
  const doc = bookingState.selectedDoctor;
  const docNameEl = document.getElementById('summary-doctor-name');
  const slotTimeEl = document.getElementById('summary-slot-time');
  const feeEl = document.getElementById('summary-fee');

  if (doc) {
    docNameEl.textContent = `${doc.name} (${doc.department_name})`;
    feeEl.textContent = `₹${doc.consultation_fee}`;
  } else {
    docNameEl.textContent = 'None Selected';
    feeEl.textContent = '₹0';
  }

  if (bookingState.selectedDate && bookingState.selectedSlotTime) {
    const slotObj = bookingState.slotsData.find(s => s.time === bookingState.selectedSlotTime);
    const displayTime = slotObj ? slotObj.displayTime : bookingState.selectedSlotTime;
    slotTimeEl.textContent = `${bookingState.selectedDate} at ${displayTime}`;
  } else if (bookingState.selectedDate) {
    slotTimeEl.textContent = `${bookingState.selectedDate} (Select a time slot)`;
  } else {
    slotTimeEl.textContent = '--';
  }
}

/**
 * Handle Booking Form Submission
 */
async function handleBookingSubmit(event) {
  event.preventDefault();

  const btn = document.getElementById('btn-submit-booking');

  if (!bookingState.selectedDoctorId) {
    showToast('Please select a consulting doctor first.', 'warning');
    return;
  }

  if (!bookingState.selectedDate) {
    showToast('Please select an appointment date.', 'warning');
    return;
  }

  if (!bookingState.selectedSlotTime) {
    showToast('Please choose an available time slot.', 'warning');
    return;
  }

  const payload = {
    doctor_id: bookingState.selectedDoctorId,
    patient_name: document.getElementById('patient-name').value.trim(),
    patient_phone: document.getElementById('patient-phone').value.trim(),
    patient_email: document.getElementById('patient-email').value.trim() || null,
    patient_age: parseInt(document.getElementById('patient-age').value, 10),
    patient_gender: document.getElementById('patient-gender').value,
    appointment_date: bookingState.selectedDate,
    appointment_time: bookingState.selectedSlotTime,
    reason: document.getElementById('patient-reason').value.trim()
  };

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Confirming Reservation...`;

  try {
    const res = await api.bookAppointment(payload);
    showToast(`Appointment booked successfully! Token: ${res.data.booking_reference}`, 'success');

    // Reset Form
    document.getElementById('appointment-booking-form').reset();
    bookingState.selectedSlotTime = '';
    updateBookingSummary();
    await fetchAvailableSlots();
    await refreshStats();

    // Show Printable Slip
    openSlipModal(res.data);

  } catch (err) {
    if (err.status === 409) {
      showToast('Concurrency Conflict: That slot was just booked! Please pick another slot.', 'error');
      await fetchAvailableSlots();
    } else {
      showToast(err.message || 'Booking failed. Check details.', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <i class="fa-solid fa-calendar-check"></i>
      <span>Confirm Appointment Booking</span>
    `;
  }
}

/**
 * Open Printable Slip Modal
 */
function openSlipModal(appointment) {
  document.getElementById('slip-token').textContent = appointment.booking_reference;
  document.getElementById('slip-patient-name').textContent = appointment.patient_name;
  document.getElementById('slip-patient-meta').textContent = `${appointment.patient_phone} • ${appointment.patient_age} Yrs • ${appointment.patient_gender}`;
  document.getElementById('slip-doctor-name').textContent = appointment.doctor_name;
  document.getElementById('slip-doctor-dept').textContent = appointment.department_name;
  document.getElementById('slip-datetime').textContent = `${appointment.appointment_date} at ${appointment.appointment_time}`;
  document.getElementById('slip-clinic-address').textContent = appointment.clinic_address;
  document.getElementById('slip-fee').textContent = `₹${appointment.consultation_fee}`;

  const statusEl = document.getElementById('slip-status');
  statusEl.textContent = appointment.status;
  statusEl.className = appointment.status === 'CONFIRMED' ? 'text-emerald-600 font-bold' : (appointment.status === 'COMPLETED' ? 'text-teal-600 font-bold' : 'text-red-600 font-bold');

  document.getElementById('modal-slip').classList.remove('hidden');
}

function closeSlipModal() {
  document.getElementById('modal-slip').classList.add('hidden');
}

/**
 * 1-Click Pre-fill for Faculty Viva Demonstration
 */
function autoFillDemoPatient() {
  const nameEl = document.getElementById('patient-name');
  const phoneEl = document.getElementById('patient-phone');
  const emailEl = document.getElementById('patient-email');
  const ageEl = document.getElementById('patient-age');
  const genderEl = document.getElementById('patient-gender');
  const reasonEl = document.getElementById('patient-reason');

  if (nameEl) nameEl.value = 'Aditya Sharma';
  if (phoneEl) phoneEl.value = '9876543210';
  if (emailEl) emailEl.value = 'aditya.sharma@example.com';
  if (ageEl) ageEl.value = '28';
  if (genderEl) genderEl.value = 'Male';
  if (reasonEl) reasonEl.value = 'Routine cardiovascular screening and seasonal wellness consultation.';

  if (typeof showToast === 'function') {
    showToast('⚡ Sample patient details auto-filled for quick demonstration!', 'info');
  }
}

// Global expose
window.populateBookingDoctors = populateBookingDoctors;
window.onBookingDoctorChanged = onBookingDoctorChanged;
window.fetchAvailableSlots = fetchAvailableSlots;
window.selectSlot = selectSlot;
window.handleBookingSubmit = handleBookingSubmit;
window.openSlipModal = openSlipModal;
window.closeSlipModal = closeSlipModal;
window.autoFillDemoPatient = autoFillDemoPatient;

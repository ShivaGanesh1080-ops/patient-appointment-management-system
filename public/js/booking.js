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
    opt.textContent = `${doc.name} (${doc.department_name} • ${doc.clinic_name || 'SRU Clinic'} • ₹${doc.consultation_fee})`;
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
      <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-600 mb-2"></i>
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
            <i class="${icon} mr-1.5 text-indigo-600"></i> ${title}
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            ${slots.map(s => {
              const isAvailable = s.status === 'AVAILABLE';
              let badgeColor = isAvailable 
                ? 'bg-white border-slate-300 text-slate-700 hover:border-indigo-500 hover:text-indigo-700' 
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
    docNameEl.textContent = `${doc.name} (${doc.department_name} • ${doc.clinic_name || 'SRU Clinic'})`;
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

function toggleDependentBooking() {
  const toggle = document.getElementById('booking-for-other-toggle');
  const container = document.getElementById('dependent-fields-container');
  if (toggle && container) {
    if (toggle.checked) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
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

  const otherToggle = document.getElementById('booking-for-other-toggle');
  const isForOther = otherToggle && otherToggle.checked;

  let primaryName = document.getElementById('patient-name').value.trim();
  let patientName = primaryName;
  let patientAge = parseInt(document.getElementById('patient-age').value, 10);
  let patientGender = document.getElementById('patient-gender').value;
  let reason = document.getElementById('patient-reason').value.trim();

  if (isForOther) {
    const depName = document.getElementById('dependent-name')?.value.trim();
    const depAge = parseInt(document.getElementById('dependent-age')?.value, 10);
    const depRelation = document.getElementById('dependent-relation')?.value || 'Dependent';
    const depGender = document.getElementById('dependent-gender')?.value || patientGender;

    if (depName) {
      patientName = `${depName} (${depRelation} of ${primaryName})`;
    }
    if (depAge) {
      patientAge = depAge;
    }
    if (depGender) {
      patientGender = depGender;
    }
  }

  const payload = {
    doctor_id: bookingState.selectedDoctorId,
    doctor_name: bookingState.selectedDoctor ? bookingState.selectedDoctor.name : undefined,
    clinic_id: bookingState.selectedDoctor ? bookingState.selectedDoctor.clinic_id : undefined,
    patient_name: patientName,
    patient_phone: document.getElementById('patient-phone').value.trim(),
    patient_email: document.getElementById('patient-email').value.trim() || null,
    patient_age: patientAge,
    patient_gender: patientGender,
    appointment_date: bookingState.selectedDate,
    appointment_time: bookingState.selectedSlotTime,
    reason: reason
  };

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Confirming Reservation...`;

  try {
    const res = await api.bookAppointment(payload);
    showToast(`Appointment booked successfully! Token: ${res.data.booking_reference}`, 'success');

    // Persist patient phone and booked appointment in localStorage for 100% reliable pass retrieval
    localStorage.setItem('medipulse_patient_phone', payload.patient_phone);
    localStorage.setItem('medipulse_last_booked_token', res.data.booking_reference);
    localStorage.setItem('medipulse_last_booked_pass', JSON.stringify(res.data));

    if (window.api && typeof api.saveCustomAppointment === 'function') {
      api.saveCustomAppointment(res.data);
    }

    let myPasses = [];
    try {
      myPasses = JSON.parse(localStorage.getItem('medipulse_my_passes') || '[]');
    } catch(e) {}
    myPasses = [res.data, ...myPasses.filter(p => p.booking_reference !== res.data.booking_reference)];
    localStorage.setItem('medipulse_my_passes', JSON.stringify(myPasses));

    // Sub-20ms Ultra-Fast Live Queue Broadcast to Consulting Doctor Portal
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const liveQueueChannel = new BroadcastChannel('medipulse_live_dispatch');
        liveQueueChannel.postMessage({
          type: 'NEW_BOOKING',
          doctor_id: res.data.doctor_id,
          doctor_name: res.data.doctor_name,
          appointment: res.data,
          dispatchedAt: Date.now()
        });
      }
      localStorage.setItem('medipulse_live_dispatch_ping', JSON.stringify({
        doctor_id: res.data.doctor_id,
        doctor_name: res.data.doctor_name,
        booking_reference: res.data.booking_reference,
        dispatchedAt: Date.now()
      }));
    } catch (bcErr) {
      console.warn('Real-time queue broadcast notification notice:', bcErr);
    }

    // Reset Form & Re-sync Patient Details
    document.getElementById('appointment-booking-form').reset();
    if (otherToggle) otherToggle.checked = false;
    toggleDependentBooking();
    if (typeof syncPatientDetailsToBookingForm === 'function') {
      syncPatientDetailsToBookingForm();
    }
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

let currentSlipData = null;

/**
 * Open Printable Slip Modal
 */
function openSlipModal(appointment) {
  if (!appointment) return;
  currentSlipData = appointment;
  window.currentAppointmentSlip = appointment;

  document.getElementById('slip-token').textContent = appointment.booking_reference || 'APT-2026-XXXX';
  document.getElementById('slip-patient-name').textContent = appointment.patient_name || 'Patient';
  document.getElementById('slip-patient-meta').textContent = `${appointment.patient_phone || ''} • ${appointment.patient_age || '--'} Yrs • ${appointment.patient_gender || 'Not Specified'}`;
  document.getElementById('slip-doctor-name').textContent = appointment.doctor_name || 'Consulting Specialist';
  document.getElementById('slip-doctor-dept').textContent = appointment.department_name || 'Clinical OPD';
  document.getElementById('slip-datetime').textContent = `${appointment.appointment_date || ''} at ${appointment.appointment_time || ''}`;
  document.getElementById('slip-clinic-address').textContent = appointment.clinic_address || appointment.clinic_name || 'Hospital Campus Reception Desk';
  document.getElementById('slip-fee').textContent = `₹${appointment.consultation_fee || 500}`;

  const statusEl = document.getElementById('slip-status');
  if (statusEl) {
    statusEl.textContent = appointment.status || 'CONFIRMED';
    statusEl.className = appointment.status === 'CONFIRMED' 
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200' 
      : (appointment.status === 'COMPLETED' 
        ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200' 
        : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200');
  }

  document.getElementById('modal-slip').classList.remove('hidden');
}

function closeSlipModal() {
  document.getElementById('modal-slip').classList.add('hidden');
}

/**
 * Copy Booking Token to Clipboard
 */
function copyBookingRef() {
  if (!currentSlipData || !currentSlipData.booking_reference) return;
  navigator.clipboard.writeText(currentSlipData.booking_reference).then(() => {
    if (typeof showToast === 'function') {
      showToast(`📋 Copied Token: ${currentSlipData.booking_reference}`, 'success');
    }
  }).catch(() => {
    if (typeof showToast === 'function') {
      showToast(`Token: ${currentSlipData.booking_reference}`, 'info');
    }
  });
}

/**
 * 1-Click Sync to Google Calendar
 */
function addToGoogleCalendar() {
  if (!currentSlipData) return;
  const { doctor_name, department_name, appointment_date, appointment_time, clinic_address, booking_reference } = currentSlipData;
  
  const startIso = `${appointment_date.replace(/-/g, '')}T${appointment_time.replace(/:/g, '')}00`;
  const [hh, mm] = appointment_time.split(':').map(Number);
  let endHour = hh;
  let endMin = mm + 30;
  if (endMin >= 60) {
    endHour += 1;
    endMin -= 60;
  }
  const endIso = `${appointment_date.replace(/-/g, '')}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`;

  const title = encodeURIComponent(`Doctor Appointment: ${doctor_name} (${department_name})`);
  const details = encodeURIComponent(`Consultation with ${doctor_name}.\nBooking Reference: ${booking_reference}\nClinic: ${clinic_address}\nPlease arrive 10 minutes prior to your time slot.`);
  const location = encodeURIComponent(clinic_address || 'MediPulse Clinic');
  
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  window.open(googleCalUrl, '_blank');
}

/**
 * 1-Click Download Standard .ics File for Outlook & Apple Calendar
 */
function downloadIcsFile() {
  if (!currentSlipData) return;
  const { doctor_name, department_name, appointment_date, appointment_time, clinic_address, booking_reference } = currentSlipData;
  
  const startIso = `${appointment_date.replace(/-/g, '')}T${appointment_time.replace(/:/g, '')}00`;
  const [hh, mm] = appointment_time.split(':').map(Number);
  let endHour = hh;
  let endMin = mm + 30;
  if (endMin >= 60) {
    endHour += 1;
    endMin -= 60;
  }
  const endIso = `${appointment_date.replace(/-/g, '')}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediPulse//Patient Appointment Management System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking_reference}@medipulse.local`,
    `DTSTAMP:${startIso}Z`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:Medical Consultation with ${doctor_name}`,
    `DESCRIPTION:Consultation with ${doctor_name} (${department_name}). Token: ${booking_reference}. Clinic: ${clinic_address}.`,
    `LOCATION:${clinic_address}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `MediPulse_${booking_reference}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof showToast === 'function') {
    showToast('📥 Downloaded .ics Calendar event!', 'success');
  }
}

/**
 * Real-time Phone Validation Feedback
 */
function handlePhoneInput(input) {
  const clean = input.value.replace(/\D/g, '');
  const indicator = document.getElementById('phone-valid-indicator');
  const icon = document.getElementById('phone-check-icon');
  
  if (clean.length === 10) {
    input.classList.remove('border-red-300', 'border-slate-200');
    input.classList.add('border-emerald-400', 'bg-emerald-50/20');
    if (indicator) {
      indicator.textContent = 'Valid 10-digit mobile';
      indicator.className = 'text-[10px] font-semibold text-emerald-600';
    }
    if (icon) icon.classList.remove('hidden');
  } else if (clean.length > 0) {
    input.classList.remove('border-emerald-400', 'bg-emerald-50/20');
    input.classList.add('border-slate-200');
    if (indicator) {
      indicator.textContent = `${10 - clean.length} more digits needed`;
      indicator.className = 'text-[10px] font-medium text-amber-600';
    }
    if (icon) icon.classList.add('hidden');
  } else {
    input.classList.remove('border-emerald-400', 'border-red-300', 'bg-emerald-50/20');
    input.classList.add('border-slate-200');
    if (indicator) indicator.textContent = '';
    if (icon) icon.classList.add('hidden');
  }
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
window.copyBookingRef = copyBookingRef;
window.addToGoogleCalendar = addToGoogleCalendar;
window.downloadIcsFile = downloadIcsFile;
window.handlePhoneInput = handlePhoneInput;
window.toggleDependentBooking = toggleDependentBooking;

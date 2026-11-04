/**
 * admin.js - Hospital Administration & Specialist Onboarding Controller
 * Allows hospital administrators to register new doctors, configure clinic schedules, and offboard specialists
 */

document.addEventListener('DOMContentLoaded', () => {
  const adminForm = document.getElementById('form-add-doctor');
  if (adminForm) {
    adminForm.addEventListener('submit', handleAddDoctorSubmit);
  }
});

/**
 * Handle Add Doctor Form Submission
 */
async function handleAddDoctorSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-doctor');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Registering Specialist...';
  }

  try {
    const name = document.getElementById('admin-doc-name').value.trim();
    const clinic_id = document.getElementById('admin-doc-clinic-id')?.value || 'clinic-sru';
    const department_id = document.getElementById('admin-doc-dept').value;
    const qualification = document.getElementById('admin-doc-qual').value.trim();
    const experience_years = parseInt(document.getElementById('admin-doc-exp').value, 10);
    const consultation_fee = parseFloat(document.getElementById('admin-doc-fee').value);
    const rating = parseFloat(document.getElementById('admin-doc-rating').value) || 4.9;
    const clinic_address = document.getElementById('admin-doc-clinic').value.trim();
    const avatar_url = document.getElementById('admin-doc-avatar').value.trim();
    const bio = document.getElementById('admin-doc-bio').value.trim();

    // Collect checked days
    const checkedDays = [];
    document.querySelectorAll('.admin-day-check:checked').forEach(cb => {
      checkedDays.push(cb.value);
    });

    if (checkedDays.length === 0) {
      throw new Error('Please select at least one clinic working day.');
    }

    const payload = {
      name,
      clinic_id,
      department_id,
      qualification,
      experience_years,
      consultation_fee,
      rating,
      clinic_address,
      avatar_url: avatar_url || undefined,
      bio: bio || undefined,
      available_days: checkedDays,
      slot_start_time: '09:00',
      slot_end_time: '17:00',
      slot_duration_minutes: 30
    };

    const res = await api.createDoctor(payload);

    if (typeof showToast === 'function') {
      showToast(`🎉 Specialist ${res.data.name} successfully registered in ${res.data.department_name}!`, 'success');
    }

    // Reset Form
    document.getElementById('form-add-doctor').reset();

    // Reload Doctors directory & Stats
    await Promise.all([
      loadDoctors(),
      refreshStats(),
      renderAdminRoster()
    ]);

    // Populate dropdowns in booking & portal
    if (typeof populateBookingDoctors === 'function') {
      populateBookingDoctors(state.doctors);
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(`Registration failed: ${err.message}`, 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-user-plus mr-1.5"></i> Register Medical Specialist';
    }
  }
}

/**
 * 1-Click Pre-fill for Demonstration
 */
function autoFillDemoDoctor() {
  const nameEl = document.getElementById('admin-doc-name');
  const deptEl = document.getElementById('admin-doc-dept');
  const qualEl = document.getElementById('admin-doc-qual');
  const expEl = document.getElementById('admin-doc-exp');
  const feeEl = document.getElementById('admin-doc-fee');
  const ratingEl = document.getElementById('admin-doc-rating');
  const clinicEl = document.getElementById('admin-doc-clinic');
  const avatarEl = document.getElementById('admin-doc-avatar');
  const bioEl = document.getElementById('admin-doc-bio');

  if (nameEl) nameEl.value = 'Dr. Sneha Roy';
  if (deptEl) deptEl.value = 'dept-cardio'; // Cardiology
  if (qualEl) qualEl.value = 'MBBS, MD, DM (Cardiology, AIIMS New Delhi)';
  if (expEl) expEl.value = '11';
  if (feeEl) feeEl.value = '750';
  if (ratingEl) ratingEl.value = '4.9';
  if (clinicEl) clinicEl.value = 'Subedari, Hanamkonda';
  if (avatarEl) avatarEl.value = 'https://images.unsplash.com/photo-1594824813589-20b12cfdf7ec?auto=format&fit=crop&q=80&w=400';
  if (bioEl) bioEl.value = 'Senior consultant interventional cardiologist specializing in preventive cardiology, coronary angioplasty, and cardiac rehabilitation.';

  // Check Monday through Friday
  document.querySelectorAll('.admin-day-check').forEach(cb => {
    cb.checked = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(cb.value);
  });

  if (typeof showToast === 'function') {
    showToast('⚡ Demo specialist profile pre-filled for quick testing!', 'info');
  }
}

/**
 * Render Active Doctors Roster in Admin Panel
 */
async function renderAdminRoster() {
  const container = document.getElementById('admin-roster-tbody');
  if (!container) return;

  try {
    const res = await api.getDoctors();
    const doctors = res.data;

    const countEl = document.getElementById('admin-roster-count');
    if (countEl) countEl.textContent = `${doctors.length} Registered Specialists`;

    if (doctors.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-slate-400">No doctors registered yet.</td>
        </tr>
      `;
      return;
    }

    container.innerHTML = doctors.map(doc => {
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
          <td class="py-3 px-4">
            <div class="flex items-center space-x-3">
              <img src="${doc.avatar_url}" alt="${doc.name}" class="w-9 h-9 rounded-xl object-cover border border-slate-200" />
              <div>
                <p class="font-bold text-slate-900">${doc.name}</p>
                <p class="text-[11px] text-slate-400">${doc.qualification}</p>
              </div>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <i class="fa-solid fa-hospital text-[9px] mr-1"></i> ${doc.clinic_name || 'SRU Campus'}
            </span>
          </td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              ${doc.department_name}
            </span>
          </td>
          <td class="py-3 px-4 text-slate-600 font-medium">₹${doc.consultation_fee}</td>
          <td class="py-3 px-4 text-slate-600 text-xs">${doc.clinic_address}</td>
          <td class="py-3 px-4">
            <div class="flex items-center text-amber-500 font-bold text-xs">
              <i class="fa-solid fa-star text-[10px] mr-1"></i> ${doc.rating}
            </div>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="handleDeleteDoctor('${doc.id}', '${doc.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors" title="Offboard Specialist">
              <i class="fa-solid fa-trash-can mr-1"></i> Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-4 text-center text-red-500 text-xs">Failed to load roster: ${err.message}</td>
      </tr>
    `;
  }
}

/**
 * Handle Delete / Offboarding of a Doctor
 */
async function handleDeleteDoctor(doctorId, doctorName) {
  if (!confirm(`Are you sure you want to offboard ${doctorName} (ID: ${doctorId}) from the hospital directory?`)) {
    return;
  }

  try {
    await api.deleteDoctor(doctorId);
    if (typeof showToast === 'function') {
      showToast(`Doctor ${doctorName} removed from directory.`, 'warning');
    }
    await Promise.all([
      loadDoctors(),
      refreshStats(),
      renderAdminRoster()
    ]);
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(`Failed to remove doctor: ${err.message}`, 'error');
    }
  }
}

window.autoFillDemoDoctor = autoFillDemoDoctor;
window.renderAdminRoster = renderAdminRoster;
window.handleDeleteDoctor = handleDeleteDoctor;

/**
 * app.js - Core UI Controller & State Orchestrator
 * MediPulse Multi-Tenant Healthcare SaaS
 * Supports:
 *  - Patient Session & Dependent Booking
 *  - Hospital Discovery & Branch Roster Filtering
 *  - Doctor Hospital-Email Authentication
 *  - Hospital Admin Operations
 *  - Platform SuperAdmin Multi-Tenant Provisioning
 */

// Global Application State
const state = {
  currentTab: 'tab-landing',
  doctors: [],
  departments: [],
  clinics: [],
  activeDepartment: 'all',
  activeClinic: 'all',
  searchQuery: '',
  sortBy: 'rating',
  globalStats: null,
  
  // Auth & Session States
  patient: null,           // { id, name, phone, age, gender }
  doctorSession: null,     // { id, name, email, clinic_id, clinic_name, ... }
  hospitalAdminSession: null, // { id, name, admin_email, ... }
  superAdminSession: null  // { id, name, email }
};

// Department Icons Map
const DEPT_ICONS = {
  'Cardiology': 'fa-solid fa-heart-pulse text-rose-500',
  'Dermatology': 'fa-solid fa-shield-virus text-amber-500',
  'Pediatrics': 'fa-solid fa-baby text-sky-500',
  'Orthopedics': 'fa-solid fa-bone text-emerald-500',
  'Neurology': 'fa-solid fa-brain text-purple-500',
  'General Medicine': 'fa-solid fa-stethoscope text-teal-600'
};

document.addEventListener('DOMContentLoaded', async () => {
  initStoredSessions();
  await initializeApp();
});

/**
 * Initialize Stored Sessions from LocalStorage / SessionStorage
 */
function initStoredSessions() {
  // Patient session
  try {
    const savedPatient = localStorage.getItem('medipulse_patient');
    if (savedPatient) {
      state.patient = JSON.parse(savedPatient);
      updatePatientNavBadge();
    }
  } catch (e) {
    console.warn('Error restoring patient session', e);
  }

  // Doctor session
  try {
    const savedDoc = sessionStorage.getItem('medipulse_doctor');
    if (savedDoc) {
      state.doctorSession = JSON.parse(savedDoc);
    }
  } catch (e) {
    console.warn('Error restoring doctor session', e);
  }

  // Hospital Admin session
  try {
    const savedAdmin = sessionStorage.getItem('medipulse_hospital_admin');
    if (savedAdmin) {
      state.hospitalAdminSession = JSON.parse(savedAdmin);
    }
  } catch (e) {
    console.warn('Error restoring admin session', e);
  }

  // Platform SuperAdmin session
  try {
    const savedSuper = sessionStorage.getItem('medipulse_superadmin');
    if (savedSuper) {
      state.superAdminSession = JSON.parse(savedSuper);
    }
  } catch (e) {
    console.warn('Error restoring superadmin session', e);
  }
}

/**
 * Initialize Application Data
 */
async function initializeApp() {
  try {
    await Promise.all([
      loadClinics(),
      loadDepartments(),
      loadDoctors(),
      refreshStats()
    ]);
    handleHashRouting();
  } catch (err) {
    showToast('Failed to initialize application data: ' + err.message, 'error');
  }
}

/**
 * Handle Direct URL Hash Routing
 */
function handleHashRouting() {
  const hash = window.location.hash.replace('#', '') || 'tab-landing';
  const validTabs = [
    'tab-landing',
    'tab-doctors',
    'tab-booking',
    'tab-history',
    'tab-doctor-login',
    'tab-portal',
    'tab-admin-login',
    'tab-admin',
    'tab-platform-admin'
  ];

  if (validTabs.includes(hash)) {
    switchTab(hash);
  } else {
    switchTab('tab-landing');
  }
}

window.addEventListener('hashchange', handleHashRouting);

// Quick Search Keyboard Shortcut (Ctrl+K or /)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
    e.preventDefault();
    switchTab('tab-doctors');
    const searchInput = document.getElementById('doctor-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
});

/**
 * Master Tab Navigation Switcher
 */
function switchTab(tabId) {
  state.currentTab = tabId;

  // Protect doctor portal view if not authenticated
  if (tabId === 'tab-portal' && !state.doctorSession) {
    tabId = 'tab-doctor-login';
    state.currentTab = 'tab-doctor-login';
  }

  // Protect hospital admin view if not authenticated
  if (tabId === 'tab-admin' && !state.hospitalAdminSession) {
    tabId = 'tab-admin-login';
    state.currentTab = 'tab-admin-login';
  }

  // Sync URL hash without page jumping
  if (window.location.hash !== '#' + tabId) {
    history.replaceState(null, null, '#' + tabId);
  }

  // Toggle tab contents
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
  });
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.remove('hidden');
  }

  // Update navigation button active styles
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll(`[onclick*="switchTab('${tabId}')"]`).forEach(btn => {
    btn.classList.add('active');
  });

  // Tab-specific lifecycle activations
  if (tabId === 'tab-history') {
    if (typeof fetchAppointmentsHistory === 'function') fetchAppointmentsHistory();
  } else if (tabId === 'tab-portal') {
    if (typeof initDoctorPortalView === 'function') initDoctorPortalView();
  } else if (tabId === 'tab-admin') {
    if (typeof initHospitalAdminView === 'function') initHospitalAdminView();
  } else if (tabId === 'tab-platform-admin') {
    if (typeof initPlatformAdminView === 'function') initPlatformAdminView();
  } else if (tabId === 'tab-booking') {
    syncPatientDetailsToBookingForm();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   PATIENT IDENTIFICATION & SESSION LOGIC
   ========================================================================== */

function openPatientAuthModal() {
  const modal = document.getElementById('modal-patient-auth');
  if (modal) {
    modal.classList.remove('hidden');
    if (state.patient) {
      document.getElementById('auth-patient-name').value = state.patient.name || '';
      document.getElementById('auth-patient-phone').value = state.patient.phone || '';
      document.getElementById('auth-patient-age').value = state.patient.age || '';
      document.getElementById('auth-patient-gender').value = state.patient.gender || 'Male';
    }
  }
}

function closePatientAuthModal() {
  const modal = document.getElementById('modal-patient-auth');
  if (modal) modal.classList.add('hidden');
}

async function handlePatientAuthSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('auth-patient-name').value.trim();
  const phone = document.getElementById('auth-patient-phone').value.trim();
  const age = document.getElementById('auth-patient-age').value.trim();
  const gender = document.getElementById('auth-patient-gender').value;

  if (!name || !phone || !age) {
    showToast('Please enter your Name, 10-digit Phone, and Age.', 'warning');
    return;
  }

  try {
    const res = await api.registerPatient(name, phone, age, gender);
    state.patient = res.patient;
    localStorage.setItem('medipulse_patient', JSON.stringify(res.patient));
    updatePatientNavBadge();
    closePatientAuthModal();
    syncPatientDetailsToBookingForm();
    showToast(`Welcome, ${res.patient.name}! You are signed in as patient.`, 'success');
  } catch (err) {
    showToast('Failed to save patient profile: ' + err.message, 'error');
  }
}

function clearPatientAuth() {
  state.patient = null;
  localStorage.removeItem('medipulse_patient');
  updatePatientNavBadge();
  syncPatientDetailsToBookingForm();
  showToast('Signed out of patient session.', 'info');
}

function updatePatientNavBadge() {
  const badgeContainer = document.getElementById('nav-patient-badge-container');
  if (!badgeContainer) return;

  if (state.patient) {
    badgeContainer.innerHTML = `
      <div class="flex items-center space-x-2 bg-[#dbe2ef]/70 border border-[#3f72af]/30 px-3 py-1.5 rounded-xl text-xs">
        <div class="w-6 h-6 rounded-full bg-[#3f72af] text-white flex items-center justify-center font-bold text-[10px]">
          ${state.patient.name.charAt(0).toUpperCase()}
        </div>
        <div class="text-left leading-tight hidden sm:block">
          <p class="font-bold text-[#112d4e] truncate max-w-[120px]">${state.patient.name}</p>
          <p class="text-[10px] text-slate-500 font-mono">${state.patient.phone}</p>
        </div>
        <button onclick="clearPatientAuth()" class="text-slate-400 hover:text-red-600 transition-colors ml-1" title="Sign out / Switch Patient">
          <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
        </button>
      </div>
    `;
  } else {
    badgeContainer.innerHTML = `
      <button onclick="openPatientAuthModal()" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#112d4e] bg-[#dbe2ef]/60 hover:bg-[#dbe2ef] border border-[#dbe2ef] transition-all">
        <i class="fa-solid fa-user-check text-[#3f72af]"></i>
        <span>Patient Sign-In</span>
      </button>
    `;
  }
}

function syncPatientDetailsToBookingForm() {
  const nameInput = document.getElementById('patient-name');
  const phoneInput = document.getElementById('patient-phone');
  const ageInput = document.getElementById('patient-age');
  const genderInput = document.getElementById('patient-gender');

  if (!nameInput) return;

  const otherToggle = document.getElementById('booking-for-other-toggle');
  const isForOther = otherToggle && otherToggle.checked;

  if (state.patient && !isForOther) {
    nameInput.value = state.patient.name || '';
    phoneInput.value = state.patient.phone || '';
    ageInput.value = state.patient.age || '';
    if (genderInput) genderInput.value = state.patient.gender || 'Male';
    if (typeof handlePhoneInput === 'function') handlePhoneInput(phoneInput);
  }
}

/* ==========================================================================
   HOSPITAL DIRECTORY & SHOWCASE CONTROLLER
   ========================================================================== */

async function loadClinics() {
  try {
    const res = await api.getClinics();
    state.clinics = res.data || [];
    renderHospitalShowcase();
    populateClinicSelectDropdowns();
  } catch (err) {
    console.warn('Failed to load clinics:', err);
  }
}

function renderHospitalShowcase() {
  const container = document.getElementById('hospitals-showcase-grid');
  if (!container) return;

  if (state.clinics.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-xs text-slate-400 py-6">No hospitals currently registered.</p>`;
    return;
  }

  container.innerHTML = state.clinics.map(clinic => {
    return `
      <article class="hospital-card p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm hover:border-[#3f72af] transition-all bg-white relative overflow-hidden group">
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-[#dbe2ef]/70 text-[#112d4e] flex items-center justify-center text-xl shadow-sm border border-[#dbe2ef]">
              <i class="fa-solid fa-hospital text-[#3f72af]"></i>
            </div>
            <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#eff6ff] text-[#112d4e] border border-[#dbe2ef]">
              <i class="fa-solid fa-star text-amber-500 text-[10px]"></i>
              <span>${clinic.rating ? clinic.rating.toFixed(1) : '4.9'}</span>
            </span>
          </div>

          <div>
            <h3 class="font-extrabold text-base sm:text-lg text-[#112d4e] group-hover:text-[#3f72af] transition-colors">${clinic.name}</h3>
            <p class="text-xs text-slate-500 font-medium flex items-center mt-1">
              <i class="fa-solid fa-location-dot text-[#3f72af] mr-1.5 text-xs"></i>
              ${clinic.city} — ${clinic.address}
            </p>
          </div>

          <div class="pt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span class="px-2 py-0.5 rounded-lg bg-[#f9f7f7] text-[#112d4e] border border-[#dbe2ef] font-medium">
              <i class="fa-regular fa-clock mr-1 text-[#3f72af]"></i>${clinic.operating_hours || '08:00 - 20:00'}
            </span>
            <span class="px-2 py-0.5 rounded-lg bg-[#f9f7f7] text-[#112d4e] border border-[#dbe2ef] font-medium">
              <i class="fa-solid fa-bed-pulse mr-1 text-[#3f72af]"></i>${clinic.total_beds || 50} Beds
            </span>
            ${clinic.phone ? `
              <span class="px-2 py-0.5 rounded-lg bg-[#f9f7f7] text-slate-600 border border-[#dbe2ef]">
                <i class="fa-solid fa-phone mr-1 text-slate-400"></i>${clinic.phone}
              </span>
            ` : ''}
          </div>
        </div>

        <div class="pt-4 border-t border-[#dbe2ef]/80">
          <button 
            onclick="selectHospitalAndBrowseDoctors('${clinic.id}')" 
            class="w-full py-2.5 px-4 rounded-xl text-xs font-bold btn-primary flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Consult Specialists Here</span>
            <i class="fa-solid fa-arrow-right text-[11px]"></i>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function populateClinicSelectDropdowns() {
  const selects = ['clinic-filter-select', 'admin-doc-clinic-id'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const currentVal = el.value;
    const isFilter = id === 'clinic-filter-select';
    
    let html = isFilter ? '<option value="all">All Healthcare Facilities</option>' : '';
    state.clinics.forEach(c => {
      html += `<option value="${c.id}">${c.name} (${c.city})</option>`;
    });
    el.innerHTML = html;
    if (currentVal) el.value = currentVal;
  });
}

function selectHospitalAndBrowseDoctors(clinicId) {
  state.activeClinic = clinicId;
  const select = document.getElementById('clinic-filter-select');
  if (select) select.value = clinicId;
  switchTab('tab-doctors');
  loadDoctors();
  showToast(`Viewing specialists at selected hospital.`, 'info');
}

/* ==========================================================================
   DOCTORS DIRECTORY & SEARCH/FILTER
   ========================================================================== */

async function loadDepartments() {
  const res = await api.getDepartments();
  state.departments = res.data;
  renderDepartmentFilters();
}

function renderDepartmentFilters() {
  const container = document.getElementById('department-filters-container');
  if (!container) return;

  let html = `
    <button class="dept-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold ${state.activeDepartment === 'all' ? 'bg-[#112d4e] text-white shadow-sm' : 'bg-white text-[#112d4e] border border-[#dbe2ef] hover:bg-[#dbe2ef]/50'}" data-dept="all" onclick="filterByDepartment('all')">
      All Specialties
    </button>
  `;

  state.departments.forEach(dept => {
    const isActive = state.activeDepartment === dept.id;
    html += `
      <button class="dept-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${isActive ? 'bg-[#112d4e] text-white shadow-sm' : 'bg-white text-[#112d4e] border border-[#dbe2ef] hover:bg-[#dbe2ef]/50'}" data-dept="${dept.id}" onclick="filterByDepartment('${dept.id}')">
        ${dept.name} (${dept.doctor_count})
      </button>
    `;
  });

  container.innerHTML = html;
}

async function filterByDepartment(deptId) {
  state.activeDepartment = deptId;
  renderDepartmentFilters();
  await loadDoctors();
}

let searchDebounceTimeout = null;
function handleDoctorSearch(event) {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(async () => {
    state.searchQuery = event.target.value.trim();
    await loadDoctors();
  }, 250);
}

async function handleSortChange() {
  const sortSelect = document.getElementById('doctor-sort-select');
  state.sortBy = sortSelect.value;
  await loadDoctors();
}

async function handleClinicFilterChange(event) {
  state.activeClinic = event.target.value;
  await loadDoctors();
}

async function loadDoctors() {
  const grid = document.getElementById('doctors-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${Array(6).fill(0).map(() => `
        <div class="glass-card p-5 rounded-3xl border border-[#dbe2ef] animate-pulse space-y-4">
          <div class="flex items-center space-x-3.5">
            <div class="w-14 h-14 rounded-2xl bg-[#dbe2ef] skeleton shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-[#dbe2ef] rounded-md w-3/4 skeleton"></div>
              <div class="h-3 bg-[#dbe2ef] rounded-md w-1/2 skeleton"></div>
            </div>
          </div>
          <div class="h-10 bg-slate-100 rounded-xl skeleton"></div>
          <div class="flex justify-between items-center pt-2">
            <div class="h-4 bg-[#dbe2ef] rounded w-1/3 skeleton"></div>
            <div class="h-8 bg-[#dbe2ef] rounded-xl w-24 skeleton"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  try {
    const params = {
      department: state.activeDepartment,
      clinic: state.activeClinic,
      search: state.searchQuery,
      sortBy: state.sortBy
    };

    const res = await api.getDoctors(params);
    state.doctors = res.data;
    renderDoctors(state.doctors);

    if (typeof populateBookingDoctors === 'function') {
      populateBookingDoctors(state.doctors);
    }
  } catch (err) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-red-500">
        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 block"></i>
        Failed to load doctors: ${err.message}
      </div>
    `;
  }
}

function renderDoctors(doctors) {
  const grid = document.getElementById('doctors-grid');
  if (!grid) return;

  if (doctors.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 glass-panel rounded-3xl border border-[#dbe2ef]">
        <i class="fa-solid fa-user-doctor text-3xl mb-3 text-slate-300"></i>
        <h3 class="font-bold text-base text-[#112d4e]">No specialists match your criteria</h3>
        <p class="text-xs text-slate-400 mt-1">Try selecting another department or clearing the hospital filter.</p>
        <button onclick="state.activeDepartment='all'; state.activeClinic='all'; document.getElementById('clinic-filter-select').value='all'; loadDoctors();" class="mt-4 px-4 py-2 bg-[#3f72af] text-white rounded-xl text-xs font-semibold">
          Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = doctors.map(doc => {
    const deptIconClass = DEPT_ICONS[doc.department_name] || 'fa-solid fa-user-doctor text-[#3f72af]';
    const daysBadges = doc.available_days.map(d => 
      `<span class="px-1.5 py-0.5 rounded text-[10px] bg-[#f9f7f7] text-[#112d4e] border border-[#dbe2ef] font-medium">${d.slice(0, 3)}</span>`
    ).join(' ');

    return `
      <article class="doctor-card rounded-3xl border border-[#dbe2ef] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#3f72af] transition-all bg-white">
        
        <div>
          <!-- Top Row: Avatar & Rating -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center space-x-3.5">
              <img 
                src="${doc.avatar_url}" 
                alt="${doc.name}" 
                class="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-100"
                onerror="this.src='https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'"
              />
              <div>
                <div class="flex items-center space-x-1.5 flex-wrap gap-y-1 mb-1">
                  <span class="inline-flex items-center text-[10px] font-semibold text-[#112d4e] bg-[#dbe2ef]/60 px-2 py-0.5 rounded-full border border-[#dbe2ef]">
                    <i class="${deptIconClass} mr-1 text-[10px]"></i> ${doc.department_name}
                  </span>
                  ${doc.clinic_name ? `
                    <span class="inline-flex items-center text-[10px] font-bold text-[#3f72af] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">
                      <i class="fa-solid fa-hospital text-[9px] mr-1"></i> ${doc.clinic_name}
                    </span>
                  ` : ''}
                </div>
                <h3 class="font-extrabold text-base text-[#112d4e] group-hover:text-[#3f72af] transition-colors">${doc.name}</h3>
                <p class="text-xs text-slate-500 font-medium line-clamp-1">${doc.qualification}</p>
              </div>
            </div>

            <!-- Star Rating Badge -->
            <div class="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
              <i class="fa-solid fa-star text-amber-500 text-[11px]"></i>
              <span>${doc.rating ? doc.rating.toFixed(1) : '4.9'}</span>
            </div>
          </div>

          <!-- Doctor Bio Snippet -->
          <p class="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">${doc.bio}</p>

          <!-- Clinic & Meta Stats -->
          <div class="space-y-1.5 text-xs text-slate-600 border-t border-[#dbe2ef]/70 pt-3 mb-4">
            <div class="flex items-center justify-between">
              <span class="text-slate-400"><i class="fa-solid fa-hospital mr-1 text-[#3f72af]"></i> Hospital Campus:</span>
              <span class="font-semibold text-[#112d4e]">${doc.clinic_name || 'SRU Campus'} (${doc.clinic_city || 'Warangal'})</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400"><i class="fa-solid fa-briefcase mr-1 text-slate-400"></i> Experience:</span>
              <span class="font-semibold text-[#112d4e]">${doc.experience_years}+ Years</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400"><i class="fa-solid fa-indian-rupee-sign mr-1 text-slate-400"></i> Consultation Fee:</span>
              <span class="font-bold text-[#112d4e] text-sm">₹${doc.consultation_fee}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400"><i class="fa-regular fa-clock mr-1 text-slate-400"></i> Clinic Hours:</span>
              <span class="font-medium text-slate-700">${doc.slot_start_time} - ${doc.slot_end_time}</span>
            </div>
            <div class="pt-1 flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Days:</span>
              <div class="flex flex-wrap gap-1 justify-end">${daysBadges}</div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[#dbe2ef]/70">
          <button 
            onclick="viewDoctorBio('${doc.id}')" 
            class="px-3 py-2 rounded-xl text-xs font-semibold text-[#112d4e] bg-[#f9f7f7] hover:bg-[#dbe2ef]/70 border border-[#dbe2ef] transition-colors"
          >
            Profile Bio
          </button>
          <button 
            onclick="bookWithDoctor('${doc.id}')" 
            class="px-3 py-2 rounded-xl text-xs font-bold btn-primary flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <i class="fa-regular fa-calendar-check text-[11px]"></i>
            <span>Book Slot</span>
          </button>
        </div>

      </article>
    `;
  }).join('');
}

async function viewDoctorBio(doctorId) {
  try {
    const res = await api.getDoctorById(doctorId);
    const doc = res.data;

    const modalContent = document.getElementById('doctor-bio-modal-content');
    modalContent.innerHTML = `
      <div class="flex items-center space-x-4 pb-4 border-b border-[#dbe2ef]">
        <img src="${doc.avatar_url}" alt="${doc.name}" class="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-100" />
        <div>
          <span class="text-xs font-bold text-[#3f72af] uppercase tracking-wider">${doc.department_name}</span>
          <h3 class="text-xl font-bold text-[#112d4e]">${doc.name}</h3>
          <p class="text-xs text-slate-500 font-medium">${doc.qualification}</p>
          <div class="flex items-center space-x-2 mt-1">
            <span class="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
              <i class="fa-solid fa-star text-amber-500 text-[10px] mr-1"></i>${doc.rating}
            </span>
            <span class="text-xs text-slate-500">${doc.experience_years}+ Years Experience</span>
          </div>
        </div>
      </div>

      <div class="space-y-3 py-2 text-xs">
        <div>
          <h4 class="font-bold text-[#112d4e] mb-1">Clinical Biography</h4>
          <p class="leading-relaxed text-slate-600">${doc.bio}</p>
        </div>

        <div class="bg-[#f9f7f7] p-3.5 rounded-2xl border border-[#dbe2ef] space-y-1.5">
          <p><strong>Hospital Campus:</strong> ${doc.clinic_name || 'SRU Campus'} (${doc.clinic_city || 'Warangal'})</p>
          <p><strong>Campus Address:</strong> ${doc.clinic_address}</p>
          <p><strong>Consultation Fee:</strong> <span class="font-bold text-[#112d4e] text-sm">₹${doc.consultation_fee}</span></p>
          <p><strong>Consultation Duration:</strong> ${doc.slot_duration_minutes} minutes / patient</p>
          <p><strong>Consulting Days:</strong> ${doc.available_days.join(', ')}</p>
        </div>
      </div>

      <div class="pt-3 border-t border-[#dbe2ef]">
        <button onclick="closeDoctorBioModal(); bookWithDoctor('${doc.id}')" class="w-full py-3 btn-primary font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md">
          <i class="fa-regular fa-calendar-check"></i>
          <span>Schedule Visit with ${doc.name}</span>
        </button>
      </div>
    `;

    document.getElementById('modal-doctor-bio').classList.remove('hidden');
  } catch (err) {
    showToast('Failed to load doctor details: ' + err.message, 'error');
  }
}

function closeDoctorBioModal() {
  document.getElementById('modal-doctor-bio').classList.add('hidden');
}

function startBookingQuick() {
  switchTab('tab-booking');
}

function bookWithDoctor(doctorId) {
  switchTab('tab-booking');
  const select = document.getElementById('booking-doctor-select');
  if (select) {
    select.value = doctorId;
    if (typeof onBookingDoctorChanged === 'function') {
      onBookingDoctorChanged();
    }
  }
}

/* ==========================================================================
   DOCTOR AUTHENTICATION & PORTAL HANDLERS
   ========================================================================== */

function fillDemoDoctorCredentials(email, pass) {
  document.getElementById('doc-login-email').value = email;
  document.getElementById('doc-login-password').value = pass;
}

async function handleDoctorLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('doc-login-email').value.trim();
  const password = document.getElementById('doc-login-password').value.trim();

  if (!email || !password) {
    showToast('Please enter your hospital-issued email and password.', 'warning');
    return;
  }

  try {
    const res = await api.doctorLogin(email, password);
    state.doctorSession = res.doctor;
    sessionStorage.setItem('medipulse_doctor', JSON.stringify(res.doctor));
    showToast(`Welcome back, ${res.doctor.name}! Live OPD desk active.`, 'success');
    switchTab('tab-portal');
  } catch (err) {
    showToast(err.message || 'Doctor login failed. Check credentials.', 'error');
  }
}

function doctorLogout() {
  state.doctorSession = null;
  sessionStorage.removeItem('medipulse_doctor');
  showToast('Logged out of Doctor Workspace.', 'info');
  switchTab('tab-doctor-login');
}

/* ==========================================================================
   HOSPITAL ADMIN AUTHENTICATION & OPERATIONS HANDLERS
   ========================================================================== */

function fillDemoAdminCredentials(email, pass) {
  document.getElementById('admin-login-email').value = email;
  document.getElementById('admin-login-password').value = pass;
}

async function handleHospitalAdminLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('admin-login-email').value.trim();
  const password = document.getElementById('admin-login-password').value.trim();

  if (!email || !password) {
    showToast('Please enter hospital administration credentials.', 'warning');
    return;
  }

  try {
    const res = await api.hospitalAdminLogin(email, password);
    state.hospitalAdminSession = res.clinic;
    sessionStorage.setItem('medipulse_hospital_admin', JSON.stringify(res.clinic));
    showToast(`Authenticated as Operations Desk for ${res.clinic.name}`, 'success');
    switchTab('tab-admin');
  } catch (err) {
    showToast(err.message || 'Hospital Admin login failed.', 'error');
  }
}

function hospitalAdminLogout() {
  state.hospitalAdminSession = null;
  sessionStorage.removeItem('medipulse_hospital_admin');
  showToast('Logged out of Hospital Operations Desk.', 'info');
  switchTab('tab-admin-login');
}

/* ==========================================================================
   PLATFORM SUPERADMIN HANDLERS
   ========================================================================== */

function fillDemoSuperAdminCredentials(email, pass) {
  document.getElementById('superadmin-email').value = email;
  document.getElementById('superadmin-password').value = pass;
}

async function handleSuperAdminLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('superadmin-email').value.trim();
  const password = document.getElementById('superadmin-password').value.trim();

  try {
    const res = await api.platformAdminLogin(email, password);
    state.superAdminSession = res.admin;
    sessionStorage.setItem('medipulse_superadmin', JSON.stringify(res.admin));
    showToast('Platform SuperAdmin authenticated.', 'success');
    renderSuperAdminDashboard();
  } catch (err) {
    showToast(err.message || 'SuperAdmin login failed.', 'error');
  }
}

function superAdminLogout() {
  state.superAdminSession = null;
  sessionStorage.removeItem('medipulse_superadmin');
  showToast('Logged out of SuperAdmin Console.', 'info');
  renderSuperAdminDashboard();
}

async function handleCreateHospitalSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('create-hospital-name').value.trim();
  const city = document.getElementById('create-hospital-city').value.trim();
  const address = document.getElementById('create-hospital-address').value.trim();
  const phone = document.getElementById('create-hospital-phone').value.trim();
  const admin_email = document.getElementById('create-hospital-admin-email').value.trim();
  const admin_password = document.getElementById('create-hospital-admin-password').value.trim();
  const operating_hours = document.getElementById('create-hospital-hours').value.trim() || '08:00 - 20:00';
  const total_beds = document.getElementById('create-hospital-beds').value || 50;

  try {
    const res = await api.createHospital({
      name, city, address, phone, admin_email, admin_password, operating_hours, total_beds
    });
    showToast(`Hospital ${name} successfully onboarded into MediPulse network!`, 'success');
    document.getElementById('form-create-hospital').reset();
    await loadClinics();
    renderSuperAdminDashboard();
  } catch (err) {
    showToast('Hospital onboarding failed: ' + err.message, 'error');
  }
}

function renderSuperAdminDashboard() {
  const loginCard = document.getElementById('superadmin-login-card');
  const panel = document.getElementById('superadmin-workspace');
  if (!loginCard || !panel) return;

  if (state.superAdminSession) {
    loginCard.classList.add('hidden');
    panel.classList.remove('hidden');

    const list = document.getElementById('superadmin-hospitals-list');
    if (list) {
      list.innerHTML = state.clinics.map(c => `
        <tr class="border-b border-[#dbe2ef] text-xs">
          <td class="py-3 px-3 font-bold text-[#112d4e]">${c.name}</td>
          <td class="py-3 px-3 text-slate-600">${c.city}</td>
          <td class="py-3 px-3 font-mono text-[#3f72af]">${c.admin_email || 'admin@' + c.slug + '.edu.in'}</td>
          <td class="py-3 px-3">${c.operating_hours || '08:00 - 20:00'}</td>
          <td class="py-3 px-3 font-bold text-[#112d4e]">${c.total_beds || 50}</td>
          <td class="py-3 px-3 text-right">
            <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
              Active Tenant
            </span>
          </td>
        </tr>
      `).join('');
    }
  } else {
    loginCard.classList.remove('hidden');
    panel.classList.add('hidden');
  }
}

function initPlatformAdminView() {
  renderSuperAdminDashboard();
}

/* ==========================================================================
   TEAM ROSTER MODAL
   ========================================================================== */

function openTeamModal() {
  const modal = document.getElementById('modal-team');
  if (modal) modal.classList.remove('hidden');
}

function closeTeamModal() {
  const modal = document.getElementById('modal-team');
  if (modal) modal.classList.add('hidden');
}

/* ==========================================================================
   GLOBAL TELEMETRY & TOAST
   ========================================================================== */

async function refreshStats() {
  try {
    const res = await api.getStats();
    state.globalStats = res.data;

    const doctorsEl = document.getElementById('stat-doctors-count');
    const confirmedEl = document.getElementById('stat-confirmed-count');
    const patientsEl = document.getElementById('stat-patients-count');
    const completedEl = document.getElementById('stat-completed-count');

    if (doctorsEl) doctorsEl.textContent = res.data.totalDoctors || 0;
    if (confirmedEl) confirmedEl.textContent = res.data.confirmedAppointments || 0;
    if (patientsEl) patientsEl.textContent = res.data.uniquePatients || 0;
    if (completedEl) completedEl.textContent = res.data.completedAppointments || 0;
  } catch (err) {
    console.warn('Failed to refresh stats:', err.message);
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  let bgClass = 'bg-[#112d4e] text-white border border-[#3f72af]/40';
  let icon = '<i class="fa-solid fa-circle-info text-[#3f72af] mr-2"></i>';

  if (type === 'success') {
    bgClass = 'bg-[#112d4e] text-white border border-emerald-500/50';
    icon = '<i class="fa-solid fa-circle-check text-emerald-400 mr-2"></i>';
  } else if (type === 'error') {
    bgClass = 'bg-rose-950 text-white border border-rose-600/50';
    icon = '<i class="fa-solid fa-circle-xmark text-rose-400 mr-2"></i>';
  } else if (type === 'warning') {
    bgClass = 'bg-amber-950 text-white border border-amber-500/50';
    icon = '<i class="fa-solid fa-triangle-exclamation text-amber-400 mr-2"></i>';
  }

  toast.className = `toast px-4 py-3 rounded-2xl text-xs font-medium flex items-center space-x-2 shadow-xl ${bgClass}`;
  toast.innerHTML = `
    <div class="flex items-center">
      ${icon}
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, 4200);
}

// Global Exports
window.switchTab = switchTab;
window.filterByDepartment = filterByDepartment;
window.handleClinicFilterChange = handleClinicFilterChange;
window.selectHospitalAndBrowseDoctors = selectHospitalAndBrowseDoctors;
window.handleDoctorSearch = handleDoctorSearch;
window.handleSortChange = handleSortChange;
window.viewDoctorBio = viewDoctorBio;
window.closeDoctorBioModal = closeDoctorBioModal;
window.openTeamModal = openTeamModal;
window.closeTeamModal = closeTeamModal;
window.startBookingQuick = startBookingQuick;
window.bookWithDoctor = bookWithDoctor;
window.showToast = showToast;
window.refreshStats = refreshStats;

// Patient Auth Exports
window.openPatientAuthModal = openPatientAuthModal;
window.closePatientAuthModal = closePatientAuthModal;
window.handlePatientAuthSubmit = handlePatientAuthSubmit;
window.clearPatientAuth = clearPatientAuth;

// Doctor Auth Exports
window.fillDemoDoctorCredentials = fillDemoDoctorCredentials;
window.handleDoctorLoginSubmit = handleDoctorLoginSubmit;
window.doctorLogout = doctorLogout;

// Hospital Admin Auth Exports
window.fillDemoAdminCredentials = fillDemoAdminCredentials;
window.handleHospitalAdminLoginSubmit = handleHospitalAdminLoginSubmit;
window.hospitalAdminLogout = hospitalAdminLogout;

// Platform SuperAdmin Exports
window.fillDemoSuperAdminCredentials = fillDemoSuperAdminCredentials;
window.handleSuperAdminLoginSubmit = handleSuperAdminLoginSubmit;
window.superAdminLogout = superAdminLogout;
window.handleCreateHospitalSubmit = handleCreateHospitalSubmit;

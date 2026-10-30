/**
 * app.js - Core UI Controller & State Orchestrator
 * Handles Tab Navigation, Doctor Directory, Search/Filter, Modals, Toasts & API Explorer
 */

// Application State
const state = {
  currentTab: 'tab-doctors',
  doctors: [],
  departments: [],
  activeDepartment: 'all',
  searchQuery: '',
  sortBy: 'rating',
  globalStats: null
};

// Department Icon Map
const DEPT_ICONS = {
  'Cardiology': 'fa-solid fa-heart-pulse text-rose-500',
  'Dermatology': 'fa-solid fa-shield-virus text-amber-500',
  'Pediatrics': 'fa-solid fa-baby text-sky-500',
  'Orthopedics': 'fa-solid fa-bone text-emerald-500',
  'Neurology': 'fa-solid fa-brain text-purple-500',
  'General Medicine': 'fa-solid fa-stethoscope text-blue-500'
};

document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
});

/**
 * Initialize Application
 */
async function initializeApp() {
  try {
    await Promise.all([
      loadDepartments(),
      loadDoctors(),
      refreshStats()
    ]);
  } catch (err) {
    showToast('Failed to initialize application data: ' + err.message, 'error');
  }
}

/**
 * Tab Navigation Switcher
 */
function switchTab(tabId) {
  state.currentTab = tabId;

  // Toggle tab contents
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
  });
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.remove('hidden');
  }

  // Update nav buttons
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });

  document.querySelectorAll(`[onclick="switchTab('${tabId}')"]`).forEach(btn => {
    btn.classList.add('active');
  });

  // Trigger tab-specific refreshes
  if (tabId === 'tab-history') {
    if (typeof fetchAppointmentsHistory === 'function') fetchAppointmentsHistory();
  } else if (tabId === 'tab-portal') {
    if (typeof loadDoctorPortalData === 'function') loadDoctorPortalData();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Load Departments from REST API
 */
async function loadDepartments() {
  const res = await api.getDepartments();
  state.departments = res.data;
  renderDepartmentFilters();
}

/**
 * Render Department Pills
 */
function renderDepartmentFilters() {
  const container = document.getElementById('department-filters-container');
  if (!container) return;

  let html = `
    <button class="dept-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold ${state.activeDepartment === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}" data-dept="all" onclick="filterByDepartment('all')">
      All Specialties
    </button>
  `;

  state.departments.forEach(dept => {
    const isActive = state.activeDepartment === dept.id;
    html += `
      <button class="dept-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}" data-dept="${dept.id}" onclick="filterByDepartment('${dept.id}')">
        ${dept.name} (${dept.doctor_count})
      </button>
    `;
  });

  container.innerHTML = html;
}

/**
 * Filter by Department
 */
async function filterByDepartment(deptId) {
  state.activeDepartment = deptId;
  renderDepartmentFilters();
  await loadDoctors();
}

/**
 * Handle Search Input with Debounce
 */
let searchDebounceTimeout = null;
function handleDoctorSearch(event) {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(async () => {
    state.searchQuery = event.target.value.trim();
    await loadDoctors();
  }, 250);
}

/**
 * Handle Sort Dropdown Change
 */
async function handleSortChange() {
  const sortSelect = document.getElementById('doctor-sort-select');
  state.sortBy = sortSelect.value;
  await loadDoctors();
}

/**
 * Load Doctors from REST API
 */
async function loadDoctors() {
  const grid = document.getElementById('doctors-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-full py-12 text-center text-slate-400">
      <i class="fa-solid fa-spinner fa-spin text-3xl mb-3 text-blue-500"></i>
      <p class="text-sm">Fetching verified medical specialists...</p>
    </div>
  `;

  try {
    const params = {
      department: state.activeDepartment,
      search: state.searchQuery,
      sortBy: state.sortBy
    };

    const res = await api.getDoctors(params);
    state.doctors = res.data;
    renderDoctorsGrid(state.doctors);

    // Also populate doctor dropdowns in booking & history if present
    if (typeof populateBookingDoctors === 'function') {
      populateBookingDoctors(state.doctors);
    }
  } catch (err) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-red-500">
        <i class="fa-solid fa-circle-exclamation text-3xl mb-2"></i>
        <p class="text-sm font-semibold">Error loading doctor profiles.</p>
        <p class="text-xs text-slate-500 mt-1">${err.message}</p>
      </div>
    `;
  }
}

/**
 * Render Doctor Cards Grid
 */
function renderDoctorsGrid(doctors) {
  const grid = document.getElementById('doctors-grid');
  if (!grid) return;

  if (doctors.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 glass-panel rounded-3xl">
        <i class="fa-solid fa-user-doctor text-4xl mb-3 text-slate-300"></i>
        <h4 class="text-base font-bold text-slate-700">No doctors found</h4>
        <p class="text-xs text-slate-500 mt-1">Try adjusting your specialty filter or search term.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = doctors.map(doc => {
    const deptIconClass = DEPT_ICONS[doc.department_name] || 'fa-solid fa-user-doctor text-blue-500';
    const daysBadges = doc.available_days.map(d => 
      `<span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">${d.slice(0, 3)}</span>`
    ).join(' ');

    return `
      <article class="doctor-card bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        
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
                <span class="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
                  <i class="${deptIconClass} mr-1 text-[10px]"></i> ${doc.department_name}
                </span>
                <h3 class="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">${doc.name}</h3>
                <p class="text-xs text-slate-500 font-medium line-clamp-1">${doc.qualification}</p>
              </div>
            </div>

            <!-- Star Rating Badge -->
            <div class="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
              <i class="fa-solid fa-star text-amber-500 text-[11px]"></i>
              <span>${doc.rating.toFixed(1)}</span>
            </div>
          </div>

          <!-- Doctor Bio Snippet -->
          <p class="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">${doc.bio}</p>

          <!-- Clinic & Meta Stats -->
          <div class="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
            <div class="flex items-center justify-between">
              <span class="text-slate-400"><i class="fa-solid fa-briefcase mr-1 text-slate-400"></i> Experience:</span>
              <span class="font-semibold text-slate-800">${doc.experience_years}+ Years</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400"><i class="fa-solid fa-indian-rupee-sign mr-1 text-slate-400"></i> Consultation Fee:</span>
              <span class="font-bold text-emerald-600 text-sm">₹${doc.consultation_fee}</span>
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
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button 
            onclick="viewDoctorBio('${doc.id}')" 
            class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Profile Bio
          </button>
          <button 
            onclick="bookWithDoctor('${doc.id}')" 
            class="px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all flex items-center justify-center space-x-1"
          >
            <i class="fa-regular fa-calendar-check text-[11px]"></i>
            <span>Book Slot</span>
          </button>
        </div>

      </article>
    `;
  }).join('');
}

/**
 * Open Doctor Bio Details Modal
 */
async function viewDoctorBio(doctorId) {
  try {
    const res = await api.getDoctorById(doctorId);
    const doc = res.data;

    const modalContent = document.getElementById('doctor-bio-modal-content');
    modalContent.innerHTML = `
      <div class="flex items-center space-x-4 border-b border-slate-100 pb-4">
        <img src="${doc.avatar_url}" alt="${doc.name}" class="w-20 h-20 rounded-2xl object-cover border shadow">
        <div>
          <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">${doc.department_name}</span>
          <h3 class="text-xl font-bold text-slate-900">${doc.name}</h3>
          <p class="text-xs text-slate-500 font-medium">${doc.qualification}</p>
          <div class="flex items-center space-x-2 mt-1">
            <span class="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
              ★ ${doc.rating}
            </span>
            <span class="text-xs text-slate-400">• ${doc.experience_years} Years Experience</span>
          </div>
        </div>
      </div>

      <div class="space-y-3 text-xs text-slate-700">
        <div>
          <h4 class="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Doctor Biography</h4>
          <p class="leading-relaxed text-slate-600">${doc.bio}</p>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
          <p><strong>Clinic Location:</strong> ${doc.clinic_address}</p>
          <p><strong>Consultation Fee:</strong> <span class="font-bold text-emerald-600 text-sm">₹${doc.consultation_fee}</span></p>
          <p><strong>Consultation Duration:</strong> ${doc.slot_duration_minutes} minutes / patient</p>
          <p><strong>Working Days:</strong> ${doc.available_days.join(', ')}</p>
        </div>
      </div>

      <div class="pt-3">
        <button onclick="closeDoctorBioModal(); bookWithDoctor('${doc.id}')" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md">
          <i class="fa-regular fa-calendar-check"></i>
          <span>Proceed to Book Appointment</span>
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

/**
 * Quick Book CTA
 */
function startBookingQuick() {
  switchTab('tab-booking');
}

/**
 * Book with a specific Doctor
 */
function bookWithDoctor(doctorId) {
  switchTab('tab-booking');
  const docSelect = document.getElementById('booking-doctor-select');
  if (docSelect) {
    docSelect.value = doctorId;
    if (typeof onBookingDoctorChanged === 'function') {
      onBookingDoctorChanged();
    }
  }
}

/**
 * Refresh Dashboard Statistics Ribbon
 */
async function refreshStats() {
  try {
    const res = await api.getStats();
    state.globalStats = res.data;

    document.getElementById('stat-doctors-count').textContent = res.data.totalDoctors || '0';
    document.getElementById('stat-confirmed-count').textContent = res.data.confirmedAppointments || '0';
    document.getElementById('stat-patients-count').textContent = res.data.uniquePatients || '0';
    document.getElementById('stat-completed-count').textContent = res.data.completedAppointments || '0';
  } catch (err) {
    console.warn('Stats refresh error:', err);
  }
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  
  let bgClass = 'bg-slate-900 text-white border border-slate-700';
  let icon = '<i class="fa-solid fa-circle-info text-blue-400 mr-2"></i>';

  if (type === 'success') {
    bgClass = 'bg-emerald-950 text-white border border-emerald-700';
    icon = '<i class="fa-solid fa-circle-check text-emerald-400 mr-2"></i>';
  } else if (type === 'error') {
    bgClass = 'bg-rose-950 text-white border border-rose-700';
    icon = '<i class="fa-solid fa-circle-exclamation text-rose-400 mr-2"></i>';
  } else if (type === 'warning') {
    bgClass = 'bg-amber-950 text-white border border-amber-700';
    icon = '<i class="fa-solid fa-triangle-exclamation text-amber-400 mr-2"></i>';
  }

  toast.className = `toast px-4 py-3 rounded-2xl text-xs font-semibold flex items-center shadow-2xl ${bgClass}`;
  toast.innerHTML = `
    ${icon}
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-3 text-slate-400 hover:text-white">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4500);
}

/**
 * Interactive REST API Live Playground for Viva
 */
async function testApiEndpoint(method, endpoint) {
  const urlEl = document.getElementById('api-output-url');
  const statusEl = document.getElementById('api-output-status');
  const codeEl = document.getElementById('api-output-code');

  urlEl.textContent = `Request: ${method} ${endpoint}`;
  statusEl.textContent = 'Status: Sending...';
  codeEl.textContent = '// Dispatching HTTP request to backend...';

  const startTime = performance.now();
  try {
    const response = await fetch(endpoint, { method });
    const duration = Math.round(performance.now() - startTime);
    const data = await response.json();

    statusEl.innerHTML = `Status: <span class="${response.ok ? 'text-emerald-400' : 'text-rose-400'} font-bold">HTTP ${response.status} ${response.statusText} (${duration}ms)</span>`;
    codeEl.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    statusEl.innerHTML = `<span class="text-rose-400 font-bold">Error: ${err.message}</span>`;
    codeEl.textContent = `// Request failed: ${err.message}`;
  }
}

// Global expose
window.switchTab = switchTab;
window.filterByDepartment = filterByDepartment;
window.handleDoctorSearch = handleDoctorSearch;
window.handleSortChange = handleSortChange;
window.viewDoctorBio = viewDoctorBio;
window.closeDoctorBioModal = closeDoctorBioModal;
window.startBookingQuick = startBookingQuick;
window.bookWithDoctor = bookWithDoctor;
window.showToast = showToast;
window.testApiEndpoint = testApiEndpoint;
window.refreshStats = refreshStats;

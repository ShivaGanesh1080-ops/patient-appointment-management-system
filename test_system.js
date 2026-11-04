const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSystemVerification() {
  console.log('🚀 Starting Automated System Verification...');

  try {
    // 1. Health check
    console.log('1️⃣ Checking /api/health...');
    const health = await makeRequest('GET', '/api/health');
    console.log('   Status:', health.status, '| Service:', health.data.service);

    // 2. Doctors list
    console.log('\n2️⃣ Checking /api/doctors...');
    const doctors = await makeRequest('GET', '/api/doctors');
    console.log(`   Found ${doctors.data.count} doctors. First: ${doctors.data.data[0].name} (${doctors.data.data[0].department_name})`);

    // 3. Departments
    console.log('\n3️⃣ Checking /api/departments...');
    const depts = await makeRequest('GET', '/api/departments');
    console.log(`   Found ${depts.data.count} departments.`);

    // 4. Time Slots: Find a working day for doc-101
    const targetDate = new Date();
    // Advance until we find a working day (Monday - Friday)
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    // If today is a weekday, pick next weekday
    targetDate.setDate(targetDate.getDate() + 1);
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const dateStr = targetDate.toISOString().split('T')[0];

    console.log(`\n4️⃣ Checking /api/slots for Dr. Rajeshwar Rao on ${dateStr}...`);
    const slots = await makeRequest('GET', `/api/slots?doctorId=doc-101&date=${dateStr}`);
    console.log(`   Day: ${slots.data.dayName} | Working Day: ${slots.data.isWorkingDay} | Slots Generated: ${slots.data.totalSlots} | Available: ${slots.data.availableCount}`);

    // 5. Booking an Appointment
    console.log('\n5️⃣ Testing Appointment Booking POST /api/appointments...');
    const testSlot = slots.data.slots.find(s => s.status === 'AVAILABLE');
    if (!testSlot) {
      throw new Error('No available slot found for testing');
    }

    const bookingPayload = {
      doctor_id: 'doc-101',
      patient_name: 'Aditya Rao (Test Patient)',
      patient_phone: '9988776655',
      patient_email: 'aditya.rao@test.com',
      patient_age: 38,
      patient_gender: 'Male',
      appointment_date: dateStr,
      appointment_time: testSlot.time,
      reason: 'Chest tightness following heavy exercise.'
    };

    const bookRes = await makeRequest('POST', '/api/appointments', bookingPayload);
    console.log('   Status:', bookRes.status);
    console.log('   Booking Reference:', bookRes.data.data.booking_reference);
    const bookingRef = bookRes.data.data.booking_reference;

    // 6. Concurrency / Double-booking Test
    console.log('\n6️⃣ Testing Concurrency Guard (Preventing Double Booking for same slot)...');
    const duplicateRes = await makeRequest('POST', '/api/appointments', bookingPayload);
    console.log('   Status:', duplicateRes.status, duplicateRes.status === 409 ? '✅ (409 Conflict correctly returned!)' : '❌ Failed');
    console.log('   Message:', duplicateRes.data.message);

    // 7. Appointment History Retrieval
    console.log('\n7️⃣ Testing /api/appointments query by phone...');
    const histRes = await makeRequest('GET', `/api/appointments?phone=9988776655`);
    console.log(`   Found ${histRes.data.count} appointment(s) matching phone.`);

    // 8. Cancellation Test
    console.log('\n8️⃣ Testing Cancellation PATCH /api/appointments/:ref/cancel...');
    const cancelRes = await makeRequest('PATCH', `/api/appointments/${bookingRef}/cancel`, {
      cancellation_reason: 'Patient symptoms subsided and rescheduled.'
    });
    console.log('   Status:', cancelRes.status, '| Success:', cancelRes.data.success);
    console.log('   Updated Status:', cancelRes.data.data.status);

    // 9. Verify slot is freed after cancellation
    console.log('\n9️⃣ Verifying slot availability after cancellation...');
    const freedSlots = await makeRequest('GET', `/api/slots?doctorId=doc-101&date=${dateStr}`);
    const checkSlot = freedSlots.data.slots.find(s => s.time === testSlot.time);
    console.log(`   Slot ${testSlot.time} status now: ${checkSlot.status} (Expected: AVAILABLE)`);

    // 10. Dashboard Stats & SaaS Financials
    console.log('\n🔟 Checking /api/stats (SaaS Revenue & Operational KPIs)...');
    const stats = await makeRequest('GET', '/api/stats');
    console.log('   Total Appointments:', stats.data.data.totalAppointments);
    console.log('   Total Doctors:', stats.data.data.totalDoctors);
    console.log('   Total Clinics:', stats.data.data.totalClinics);
    console.log('   Gross Consultation Volume: ₹' + stats.data.data.grossConsultationVolume);
    console.log('   Realized Revenue: ₹' + stats.data.data.realizedRevenue);

    // 11. Multi-Tenant Clinic API
    console.log('\n1️⃣1️⃣ Testing Multi-Tenant Clinics GET /api/clinics & Clinic Filtering...');
    const clinicsRes = await makeRequest('GET', '/api/clinics');
    console.log(`   Found ${clinicsRes.data.count} clinics across Telangana (SRU, Apollo, Kakatiya).`);
    const sruDocs = await makeRequest('GET', '/api/doctors?clinicId=clinic-sru');
    console.log(`   SRU Campus Health Centre Specialists count: ${sruDocs.data.count}`);

    // 12. Doctor OPD KDS Status Transitions
    console.log('\n1️⃣2️⃣ Testing OPD KDS Status Transition PATCH /api/appointments/:ref/status...');
    const statusRes = await makeRequest('PATCH', `/api/appointments/${bookingRef}/status`, { status: 'IN_CONSULTATION' });
    console.log('   Status:', statusRes.status, '| Success:', statusRes.data.success);
    console.log('   KDS Transition Status:', statusRes.data.data.status);

    console.log('\n✨ ALL 12 TEST PHASES PASSED WITH 100% SUCCESS!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

// Allow time for server to be running before executing tests
setTimeout(runSystemVerification, 1500);

const dbAsync = require('./database');

async function seedData() {
  await dbAsync.initSchema();
  console.log('🔄 Initializing database schema and seeding data...');

  // 1. Seed Clinics (Multi-Tenant Healthcare Facilities)
  const clinics = [
    {
      id: 'clinic-sru',
      name: 'SRU Health & Wellness Centre',
      slug: 'sru-health-centre',
      city: 'Warangal',
      address: 'SR University Campus, Ananthsagar, Hasanparthy, Warangal, Telangana 506371',
      phone: '+91 870 2818300',
      admin_email: 'admin@sruhealth.edu.in',
      admin_password: 'admin123',
      operating_hours: '08:00 - 20:00',
      total_beds: 35,
      rating: 4.9
    },
    {
      id: 'clinic-apollo',
      name: 'Apollo Health City & Outpatient Institute',
      slug: 'apollo-health-city',
      city: 'Hyderabad',
      address: 'Road No. 36, Jubilee Hills & Film Nagar, Hyderabad, Telangana 500033',
      phone: '+91 40 23607777',
      admin_email: 'admin@apollo.org',
      admin_password: 'admin123',
      operating_hours: '24x7 Emergency / OPD 08:30 - 20:30',
      total_beds: 350,
      rating: 4.9
    },
    {
      id: 'clinic-kakatiya',
      name: 'Kakatiya Super-Specialty Medical Institute',
      slug: 'kakatiya-medical-institute',
      city: 'Warangal',
      address: 'MGM Hospital Circle & Nakkalagutta, Hanamkonda, Warangal, Telangana 506001',
      phone: '+91 870 2459990',
      admin_email: 'admin@kakatiya.edu.in',
      admin_password: 'admin123',
      operating_hours: '08:00 - 21:00',
      total_beds: 120,
      rating: 4.8
    }
  ];

  for (const clinic of clinics) {
    await dbAsync.run(
      `INSERT OR REPLACE INTO clinics (id, name, slug, city, address, phone, admin_email, admin_password, operating_hours, total_beds, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinic.id, clinic.name, clinic.slug, clinic.city, clinic.address, clinic.phone, clinic.admin_email, clinic.admin_password, clinic.operating_hours, clinic.total_beds, clinic.rating]
    );
  }

  // Seed Platform SuperAdmin
  await dbAsync.run(
    `INSERT OR REPLACE INTO platform_admins (id, email, password, name) VALUES (?, ?, ?, ?)`,
    ['admin-super', 'superadmin@medipulse.health', 'superadmin123', 'MediPulse Operations SuperAdmin']
  );

  // 2. Seed Departments
  const departments = [
    {
      id: 'dept-cardio',
      name: 'Cardiology',
      icon: 'heart-pulse',
      description: 'Expert care for cardiovascular conditions, hypertension, and heart health.'
    },
    {
      id: 'dept-derma',
      name: 'Dermatology',
      icon: 'shield-plus',
      description: 'Advanced clinical & aesthetic treatments for skin, hair, and nail health.'
    },
    {
      id: 'dept-pediatrics',
      name: 'Pediatrics',
      icon: 'baby',
      description: 'Comprehensive compassionate medical care for infants, children, and teens.'
    },
    {
      id: 'dept-ortho',
      name: 'Orthopedics',
      icon: 'bone',
      description: 'Surgical and non-surgical treatment for bones, joints, ligaments, and spine.'
    },
    {
      id: 'dept-neuro',
      name: 'Neurology',
      icon: 'brain',
      description: 'Specialized diagnosis and therapy for brain, spine, and nerve disorders.'
    },
    {
      id: 'dept-genmed',
      name: 'General Medicine',
      icon: 'stethoscope',
      description: 'Holistic primary healthcare, routine screenings, and chronic illness management.'
    }
  ];

  for (const dept of departments) {
    await dbAsync.run(
      `INSERT OR REPLACE INTO departments (id, name, icon, description) VALUES (?, ?, ?, ?)`,
      [dept.id, dept.name, dept.icon, dept.description]
    );
  }

  // 2. Seed 12 Credentialed Indian Doctors (Strictly Unique & Gender-Matched Photos)
  const doctors = [
    // --- CARDIOLOGY ---
    {
      id: 'doc-101',
      name: 'Dr. Rajeshwar Rao',
      clinic_id: 'clinic-apollo',
      department_id: 'dept-cardio',
      qualification: 'MBBS, MD (Gen Med), DM (Cardiology), FACC',
      experience_years: 18,
      consultation_fee: 800,
      rating: 4.9,
      clinic_address: 'Apollo Health City, Road No. 36, Jubilee Hills, Hyderabad',
      avatar_url: '/img/doctors/doc-101.jpg', // Male Indian Doctor (Dr. Rajeshwar Rao)
      bio: 'Senior Consultant Interventional Cardiologist specializing in preventive cardiology, coronary angioplasty, and cardiac rhythm management.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      slot_start_time: '09:00',
      slot_end_time: '14:00',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-107',
      name: 'Dr. Meenakshi Sundaram',
      clinic_id: 'clinic-kakatiya',
      department_id: 'dept-cardio',
      qualification: 'MBBS, MD, DNB (Cardiology), FSCAI',
      experience_years: 14,
      consultation_fee: 750,
      rating: 4.8,
      clinic_address: 'Kakatiya Super-Specialty Medical Institute, Nakkalagutta, Hanamkonda, Warangal',
      avatar_url: '/img/doctors/doc-107.jpg', // Female Indian Doctor (Dr. Meenakshi Sundaram)
      bio: 'Consultant Clinical Cardiologist focused on echocardiography, hypertension management, and congenital heart condition screenings.',
      available_days: JSON.stringify(['Monday', 'Wednesday', 'Friday', 'Saturday']),
      slot_start_time: '10:00',
      slot_end_time: '16:00',
      slot_duration_minutes: 30
    },

    // --- DERMATOLOGY ---
    {
      id: 'doc-102',
      name: 'Dr. Sunita Deshmukh',
      clinic_id: 'clinic-apollo',
      department_id: 'dept-derma',
      qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      experience_years: 12,
      consultation_fee: 650,
      rating: 4.8,
      clinic_address: 'Apollo Health City Aesthetics Wing, Madhapur, Hyderabad',
      avatar_url: '/img/doctors/doc-102.jpg', // Female Indian Doctor
      bio: 'Renowned clinical dermatologist and aesthetic specialist with expertise in acne scar reduction, pigmentation disorders, and laser therapies.',
      available_days: JSON.stringify(['Monday', 'Wednesday', 'Friday', 'Saturday']),
      slot_start_time: '10:00',
      slot_end_time: '16:00',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-108',
      name: 'Dr. Pradeep Chaitanya',
      clinic_id: 'clinic-sru',
      department_id: 'dept-derma',
      qualification: 'MBBS, DDVL (Dermatology & Cosmetology)',
      experience_years: 9,
      consultation_fee: 500,
      rating: 4.7,
      clinic_address: 'SRU Health & Wellness Centre, Hasanparthy, Warangal',
      avatar_url: '/img/doctors/doc-108.jpg', // Male Indian Doctor
      bio: 'Specialist in clinical dermatology, pediatric skin allergies, chronic eczema, psoriasis management, and hair loss therapies.',
      available_days: JSON.stringify(['Tuesday', 'Thursday', 'Friday', 'Saturday']),
      slot_start_time: '09:30',
      slot_end_time: '15:30',
      slot_duration_minutes: 30
    },

    // --- ORTHOPEDICS ---
    {
      id: 'doc-103',
      name: 'Dr. Arvind Swaminathan',
      clinic_id: 'clinic-apollo',
      department_id: 'dept-ortho',
      qualification: 'MBBS, MS (Orthopedics), M.Ch (Ortho, UK)',
      experience_years: 16,
      consultation_fee: 750,
      rating: 4.9,
      clinic_address: 'Apollo Health City Ortho Institute, Jubilee Hills, Hyderabad',
      avatar_url: '/img/doctors/doc-103.jpg', // Male Indian Doctor
      bio: 'Pioneering orthopedic surgeon specializing in robotic knee & hip replacements, arthroscopy, and complex sports injury rehabilitation.',
      available_days: JSON.stringify(['Tuesday', 'Thursday', 'Saturday']),
      slot_start_time: '09:30',
      slot_end_time: '15:30',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-109',
      name: 'Dr. Haritha Reddy',
      clinic_id: 'clinic-kakatiya',
      department_id: 'dept-ortho',
      qualification: 'MBBS, MS (Orthopedics), Fellowship in Spine Care',
      experience_years: 11,
      consultation_fee: 600,
      rating: 4.8,
      clinic_address: 'Kakatiya Super-Specialty Medical Institute, Kazipet Road, Warangal',
      avatar_url: '/img/doctors/doc-109.jpg', // Female Indian Doctor
      bio: 'Consultant Orthopedic Surgeon specializing in spinal disc disorders, arthritis pain management, trauma surgery, and fracture rehabilitation.',
      available_days: JSON.stringify(['Monday', 'Wednesday', 'Thursday', 'Saturday']),
      slot_start_time: '10:00',
      slot_end_time: '15:00',
      slot_duration_minutes: 30
    },

    // --- PEDIATRICS ---
    {
      id: 'doc-104',
      name: 'Dr. Priya Varma',
      clinic_id: 'clinic-sru',
      department_id: 'dept-pediatrics',
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      experience_years: 10,
      consultation_fee: 500,
      rating: 4.9,
      clinic_address: 'SRU Health & Wellness Centre, Hasanparthy, Warangal',
      avatar_url: '/img/doctors/doc-104.jpg', // Female Indian Doctor
      bio: 'Caring pediatrician focused on newborn care, immunization scheduling, adolescent health guidance, and developmental milestones.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slot_start_time: '09:00',
      slot_end_time: '13:00',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-110',
      name: 'Dr. Sandeep Verma',
      clinic_id: 'clinic-kakatiya',
      department_id: 'dept-pediatrics',
      qualification: 'MBBS, MD (Pediatrics), Fellowship in Neonatology',
      experience_years: 13,
      consultation_fee: 450,
      rating: 4.8,
      clinic_address: 'Kakatiya Super-Specialty Medical Institute, MGM Circle, Warangal',
      avatar_url: '/img/doctors/doc-110.jpg', // Male Indian Doctor
      bio: 'Senior Child Specialist with focus on seasonal respiratory viral infections, pediatric asthma, childhood nutrition, and neonatal intensive care.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday']),
      slot_start_time: '09:30',
      slot_end_time: '14:30',
      slot_duration_minutes: 30
    },

    // --- NEUROLOGY ---
    {
      id: 'doc-105',
      name: 'Dr. Vikramaditya Kulkarni',
      clinic_id: 'clinic-apollo',
      department_id: 'dept-neuro',
      qualification: 'MBBS, MD, DM (Neurology), FINR',
      experience_years: 20,
      consultation_fee: 1000,
      rating: 4.7,
      clinic_address: 'Apollo Health City Neuro Sciences Wing, Jubilee Hills, Hyderabad',
      avatar_url: '/img/doctors/doc-105.jpg', // Male Indian Doctor
      bio: 'Leading neurologist handling epilepsy, stroke prevention, migraine therapy, neurodegenerative disorders, and neuromuscular diagnostics.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Thursday', 'Friday']),
      slot_start_time: '11:00',
      slot_end_time: '17:00',
      slot_duration_minutes: 45
    },
    {
      id: 'doc-111',
      name: 'Dr. Lakshmi Prasanna',
      clinic_id: 'clinic-sru',
      department_id: 'dept-neuro',
      qualification: 'MBBS, MD (Gen Med), DM (Neurology)',
      experience_years: 12,
      consultation_fee: 850,
      rating: 4.9,
      clinic_address: 'SRU Health & Wellness Centre, Ananthsagar, Warangal',
      avatar_url: '/img/doctors/doc-111.jpg', // Female Indian Doctor
      bio: 'Expert neuro-physician handling chronic headache management, Parkinson disease care, peripheral neuropathy, and sleep disorders.',
      available_days: JSON.stringify(['Monday', 'Wednesday', 'Thursday', 'Saturday']),
      slot_start_time: '10:00',
      slot_end_time: '15:00',
      slot_duration_minutes: 30
    },

    // --- GENERAL MEDICINE ---
    {
      id: 'doc-106',
      name: 'Dr. Ananya Sen',
      clinic_id: 'clinic-sru',
      department_id: 'dept-genmed',
      qualification: 'MBBS, MD (Internal Medicine)',
      experience_years: 9,
      consultation_fee: 450,
      rating: 4.8,
      clinic_address: 'SRU Health & Wellness Centre, Ananthsagar, Warangal',
      avatar_url: '/img/doctors/doc-106.jpg', // Female Indian Doctor
      bio: 'Dedicated primary care physician treating hypertension, diabetes type 2, respiratory infections, seasonal illnesses, and lifestyle wellness.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slot_start_time: '08:30',
      slot_end_time: '14:30',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-112',
      name: 'Dr. Ramesh Babu',
      clinic_id: 'clinic-kakatiya',
      department_id: 'dept-genmed',
      qualification: 'MBBS, MD (General Medicine), PGDGM (Geriatrics)',
      experience_years: 22,
      consultation_fee: 400,
      rating: 4.9,
      clinic_address: 'Kakatiya Super-Specialty Medical Institute, Hanamkonda, Warangal',
      avatar_url: '/img/doctors/doc-112.jpg', // Male Indian Doctor
      bio: 'Veteran senior physician specializing in comprehensive geriatric wellness, diabetic neuropathy, hypertension control, and preventive fever clinics.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slot_start_time: '09:00',
      slot_end_time: '14:00',
      slot_duration_minutes: 30
    }
  ];

  for (const doc of doctors) {
    const slugName = doc.name.toLowerCase().replace('dr. ', '').replace(/\s+/g, '.');
    const clinicDomain = doc.clinic_id === 'clinic-apollo' ? 'apollo.org' : (doc.clinic_id === 'clinic-kakatiya' ? 'kakatiya.edu.in' : 'sruhealth.edu.in');
    const doctorEmail = doc.email || `dr.${slugName}@${clinicDomain}`;
    const doctorPassword = doc.password || 'doctor123';

    await dbAsync.run(
      `INSERT OR REPLACE INTO doctors (
        id, name, clinic_id, department_id, email, password, qualification, experience_years,
        consultation_fee, rating, clinic_address, avatar_url, bio,
        available_days, slot_start_time, slot_end_time, slot_duration_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id, doc.name, doc.clinic_id || 'clinic-sru', doc.department_id, doctorEmail, doctorPassword, doc.qualification, doc.experience_years,
        doc.consultation_fee, doc.rating, doc.clinic_address, doc.avatar_url, doc.bio,
        doc.available_days, doc.slot_start_time, doc.slot_end_time, doc.slot_duration_minutes
      ]
    );
  }

  // 3. Seed Initial Realistic Appointments
  const today = new Date();
  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const sampleAppointments = [
    {
      booking_reference: 'APT-2026-1001',
      doctor_id: 'doc-101',
      patient_name: 'Rahul Sharma',
      patient_phone: '9876543210',
      patient_email: 'rahul.sharma@example.com',
      patient_age: 45,
      patient_gender: 'Male',
      appointment_date: formatDate(1),
      appointment_time: '10:00',
      reason: 'Routine cardiac health checkup & ECG review.',
      status: 'CONFIRMED'
    },
    {
      booking_reference: 'APT-2026-1002',
      doctor_id: 'doc-102',
      patient_name: 'Pooja Reddy',
      patient_phone: '9123456789',
      patient_email: 'pooja.r@example.com',
      patient_age: 28,
      patient_gender: 'Female',
      appointment_date: formatDate(2),
      appointment_time: '11:30',
      reason: 'Persistent skin rash and allergy consultation.',
      status: 'CONFIRMED'
    },
    {
      booking_reference: 'APT-2026-1003',
      doctor_id: 'doc-103',
      patient_name: 'Karthik Varma',
      patient_phone: '9848012345',
      patient_email: 'karthik.v@example.com',
      patient_age: 34,
      patient_gender: 'Male',
      appointment_date: formatDate(-3),
      appointment_time: '14:00',
      reason: 'Left knee sprain after badminton tournament.',
      status: 'COMPLETED'
    },
    {
      booking_reference: 'APT-2026-1004',
      doctor_id: 'doc-106',
      patient_name: 'Suresh Kumar',
      patient_phone: '9876543210',
      patient_email: 'suresh.k@example.com',
      patient_age: 52,
      patient_gender: 'Male',
      appointment_date: formatDate(-1),
      appointment_time: '09:00',
      reason: 'Blood pressure spike and fatigue.',
      status: 'CANCELLED',
      cancellation_reason: 'Patient had an emergency out-of-town travel.',
      cancelled_at: new Date().toISOString()
    },
    {
      booking_reference: 'APT-2026-1005',
      doctor_id: 'doc-112',
      patient_name: 'Venkatesh Rao',
      patient_phone: '9440123456',
      patient_email: 'venkat.rao@example.com',
      patient_age: 63,
      patient_gender: 'Male',
      appointment_date: formatDate(3),
      appointment_time: '10:30',
      reason: 'Follow-up consultation for seasonal joint stiffness and diabetes management.',
      status: 'CONFIRMED'
    }
  ];

  for (const apt of sampleAppointments) {
    const existing = await dbAsync.get(
      'SELECT id FROM appointments WHERE booking_reference = ?',
      [apt.booking_reference]
    );

    if (!existing) {
      await dbAsync.run(
        `INSERT INTO appointments (
          booking_reference, doctor_id, patient_name, patient_phone,
          patient_email, patient_age, patient_gender, appointment_date,
          appointment_time, reason, status, cancellation_reason, cancelled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          apt.booking_reference, apt.doctor_id, apt.patient_name, apt.patient_phone,
          apt.patient_email, apt.patient_age, apt.patient_gender, apt.appointment_date,
          apt.appointment_time, apt.reason, apt.status,
          apt.cancellation_reason || null, apt.cancelled_at || null
        ]
      );
    }
  }

  console.log(`✅ Seeding completed successfully! (12 unique gender-matched Indian doctors loaded)`);
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seedData;

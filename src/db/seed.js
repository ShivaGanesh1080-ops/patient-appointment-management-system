const dbAsync = require('./database');

async function seedData() {
  await dbAsync.initSchema();
  console.log('🔄 Initializing database schema and seeding data...');

  // 1. Seed Departments
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

  // 2. Seed 12 Credentialed Indian Doctors (2 per department)
  const doctors = [
    // --- CARDIOLOGY ---
    {
      id: 'doc-101',
      name: 'Dr. Rajeshwar Rao',
      department_id: 'dept-cardio',
      qualification: 'MBBS, MD (Gen Med), DM (Cardiology), FACC',
      experience_years: 18,
      consultation_fee: 800,
      rating: 4.9,
      clinic_address: 'Apollo Specialty Clinic, Road No. 36, Jubilee Hills, Hyderabad',
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
      bio: 'Senior Consultant Interventional Cardiologist specializing in preventive cardiology, coronary angioplasty, and cardiac rhythm management.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      slot_start_time: '09:00',
      slot_end_time: '14:00',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-107',
      name: 'Dr. Meenakshi Sundaram',
      department_id: 'dept-cardio',
      qualification: 'MBBS, MD, DNB (Cardiology), FSCAI',
      experience_years: 14,
      consultation_fee: 750,
      rating: 4.8,
      clinic_address: 'St. Ann Heart Care Center, Nakkalagutta, Hanamkonda, Warangal',
      avatar_url: 'https://images.unsplash.com/photo-1594824813589-20b12cfdf7ec?w=300&auto=format&fit=crop&q=80',
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
      department_id: 'dept-derma',
      qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      experience_years: 12,
      consultation_fee: 650,
      rating: 4.8,
      clinic_address: 'DermaCare Advanced Aesthetics, Madhapur, Hyderabad',
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
      bio: 'Renowned clinical dermatologist and aesthetic specialist with expertise in acne scar reduction, pigmentation disorders, and laser therapies.',
      available_days: JSON.stringify(['Monday', 'Wednesday', 'Friday', 'Saturday']),
      slot_start_time: '10:00',
      slot_end_time: '16:00',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-108',
      name: 'Dr. Pradeep Chaitanya',
      department_id: 'dept-derma',
      qualification: 'MBBS, DDVL (Dermatology & Cosmetology)',
      experience_years: 9,
      consultation_fee: 500,
      rating: 4.7,
      clinic_address: 'Skin & Laser Wellness Clinic, Subedari, Hanamkonda, Warangal',
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
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
      department_id: 'dept-ortho',
      qualification: 'MBBS, MS (Orthopedics), M.Ch (Ortho, UK)',
      experience_years: 16,
      consultation_fee: 750,
      rating: 4.9,
      clinic_address: 'OrthoSpine Joint Replacement Center, Road No. 12, Banjara Hills, Hyderabad',
      avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
      bio: 'Pioneering orthopedic surgeon specializing in robotic knee & hip replacements, arthroscopy, and complex sports injury rehabilitation.',
      available_days: JSON.stringify(['Tuesday', 'Thursday', 'Saturday']),
      slot_start_time: '09:30',
      slot_end_time: '15:30',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-109',
      name: 'Dr. Haritha Reddy',
      department_id: 'dept-ortho',
      qualification: 'MBBS, MS (Orthopedics), Fellowship in Spine Care',
      experience_years: 11,
      consultation_fee: 600,
      rating: 4.8,
      clinic_address: 'Kakatiya Bone & Joint Clinic, Main Road, Kazipet, Warangal',
      avatar_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&auto=format&fit=crop&q=80',
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
      department_id: 'dept-pediatrics',
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      experience_years: 10,
      consultation_fee: 500,
      rating: 4.9,
      clinic_address: 'Rainbow Children Health Clinic, Kondapur, Hyderabad',
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
      bio: 'Caring pediatrician focused on newborn care, immunization scheduling, adolescent health guidance, and developmental milestones.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slot_start_time: '09:00',
      slot_end_time: '13:00',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-110',
      name: 'Dr. Sandeep Verma',
      department_id: 'dept-pediatrics',
      qualification: 'MBBS, MD (Pediatrics), Fellowship in Neonatology',
      experience_years: 13,
      consultation_fee: 450,
      rating: 4.8,
      clinic_address: 'Balaji Children Hospital, MGM Road, Warangal',
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
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
      department_id: 'dept-neuro',
      qualification: 'MBBS, MD, DM (Neurology), FINR',
      experience_years: 20,
      consultation_fee: 1000,
      rating: 4.7,
      clinic_address: 'Brain & Spine Institute, Gachibowli, Hyderabad',
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
      bio: 'Leading neurologist handling epilepsy, stroke prevention, migraine therapy, neurodegenerative disorders, and neuromuscular diagnostics.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Thursday', 'Friday']),
      slot_start_time: '11:00',
      slot_end_time: '17:00',
      slot_duration_minutes: 45
    },
    {
      id: 'doc-111',
      name: 'Dr. Lakshmi Prasanna',
      department_id: 'dept-neuro',
      qualification: 'MBBS, MD (Gen Med), DM (Neurology)',
      experience_years: 12,
      consultation_fee: 850,
      rating: 4.9,
      clinic_address: 'NeuroCare Consultation Clinic, Ramnagar, Hanamkonda, Warangal',
      avatar_url: 'https://images.unsplash.com/photo-1594824813589-20b12cfdf7ec?w=300&auto=format&fit=crop&q=80',
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
      department_id: 'dept-genmed',
      qualification: 'MBBS, MD (Internal Medicine)',
      experience_years: 9,
      consultation_fee: 450,
      rating: 4.8,
      clinic_address: 'Apex Family Wellness Clinic, Hitec City, Hyderabad',
      avatar_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&auto=format&fit=crop&q=80',
      bio: 'Dedicated primary care physician treating hypertension, diabetes type 2, respiratory infections, seasonal illnesses, and lifestyle wellness.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slot_start_time: '08:30',
      slot_end_time: '14:30',
      slot_duration_minutes: 30
    },
    {
      id: 'doc-112',
      name: 'Dr. Ramesh Babu',
      department_id: 'dept-genmed',
      qualification: 'MBBS, MD (General Medicine), PGDGM (Geriatrics)',
      experience_years: 22,
      consultation_fee: 400,
      rating: 4.9,
      clinic_address: 'Lifeline Multi-Specialty Clinic, Chowrastha, Hanamkonda, Warangal',
      avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
      bio: 'Veteran senior physician specializing in comprehensive geriatric wellness, diabetic neuropathy, hypertension control, and preventive fever clinics.',
      available_days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      slot_start_time: '09:00',
      slot_end_time: '14:00',
      slot_duration_minutes: 30
    }
  ];

  for (const doc of doctors) {
    await dbAsync.run(
      `INSERT OR REPLACE INTO doctors (
        id, name, department_id, qualification, experience_years,
        consultation_fee, rating, clinic_address, avatar_url, bio,
        available_days, slot_start_time, slot_end_time, slot_duration_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id, doc.name, doc.department_id, doc.qualification, doc.experience_years,
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

  console.log(`✅ Seeding completed successfully! (${doctors.length} Indian doctors loaded)`);
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

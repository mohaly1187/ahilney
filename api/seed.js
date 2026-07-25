/**
 * Seed script — populate dev database with prototype data.
 * Usage: node api/seed.js
 * Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database…');

    const PASS = await bcrypt.hash('password', 10);
    const ADMIN_PASS = await bcrypt.hash('admin123', 10);

    // ── Users ──────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO users (id, phone, email, password_hash, role) VALUES
        (1,  '+201211098465', 'ahmed.wael@gmail.com',      NULL,       'patient'),
        (2,  '+201222446688', 'mariam.nour@gmail.com',     NULL,       'patient'),
        (3,  '+201199335522', 'youssef.ibrahim@gmail.com', NULL,       'patient'),
        (4,  '+201588663322', 'hanaa.mansour@gmail.com',   NULL,       'patient'),
        (5,  NULL, 'sarah.j@ahilney.com',    $1,  'provider'),
        (6,  NULL, 'marcus.v@ahilney.com',   $1,  'provider'),
        (7,  NULL, 'amira.k@ahilney.com',    $1,  'provider'),
        (8,  NULL, 'karim.a@ahilney.com',    $1,  'provider'),
        (9,  NULL, 'hassan.s@ahilney.com',   $1,  'provider'),
        (10, NULL, 'sherif@ahilney.com',     $2,  'admin'),
        (11, NULL, 'yasmin@ahilney.com',     $2,  'admin'),
        (12, NULL, 'tarek@ahilney.com',      $2,  'admin')
      ON CONFLICT (id) DO NOTHING
    `, [PASS, ADMIN_PASS]);

    // Reset sequence past seeded IDs
    await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);

    // ── Patients ────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO patients (id, user_id, name, age, phone, email, address, medical_history, wallet_balance, completed_sessions_count) VALUES
        ('P-001', 1, 'Ahmed Ali Wael',   '28 years', '+201211098465', 'ahmed.wael@gmail.com',      'Egypt - New Cairo, Subregion Al-Raml',    'ACL reconstruction surgery on left knee (4 weeks post-op). Mild swelling, limited extension range.', 450,  3),
        ('P-002', 2, 'Mariam Nour',      '34 years', '+201222446688', 'mariam.nour@gmail.com',     'Egypt - Heliopolis',                       'Rotator cuff tendonitis in right shoulder. Pain during abduction beyond 90 degrees.',               1200, 1),
        ('P-003', 3, 'Youssef Ibrahim',  '42 years', '+201199335522', 'youssef.ibrahim@gmail.com', 'Egypt - Maadi',                            'Lower back pain (L4-L5 disc protrusion). Occasional radiating pain to the right calf.',             0,    5),
        ('P-004', 4, 'Hanaa Mansour',    '57 years', '+201588663322', 'hanaa.mansour@gmail.com',   'Egypt - New Cairo, Rehab City',            'Total hip replacement (left side), 6 weeks post-surgery. Improving weight-bearing capability.',     1500, 0)
      ON CONFLICT (id) DO NOTHING
    `);

    // ── Prescriptions ───────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO patient_prescriptions (patient_id, text, doctor_name) VALUES
        ('P-001', 'Prescribed 10 physical therapy sessions focusing on: (1) Active range-of-motion extension exercises, (2) Quad/Hamstring isometric contractions, (3) Proprioceptive balance training.', 'Dr. Sarah Jenkins'),
        ('P-002', 'Manual therapy mobilization combined with scapular stabilization exercises. Limit lifting heavier than 2kg for the next 3 weeks.', 'Dr. Sarah Jenkins'),
        ('P-003', 'Core stabilization program, McKenzie progression exercises, and posture correction education. Avoid lumbar flexion under load.', 'Dr. Sarah Jenkins'),
        ('P-004', 'Gait retraining, progressive hip abduction strengthening, and functional balance exercises. Strictly observe hip precautions (no flexion > 90 deg).', 'Dr. Sarah Jenkins')
      ON CONFLICT DO NOTHING
    `);

    // ── Treatment Plans ─────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO patient_treatment_plans (patient_id, doctor_name, diagnosis, text, date, status) VALUES
        ('P-001', 'Dr. Sarah Jenkins', 'Post-ACL stiffness and weak hamstring response.', 'Active range-of-motion extension exercises, Quad/Hamstring isometric contractions, Proprioceptive balance training.', '2026-06-25', 'Logged'),
        ('P-002', 'Dr. Sarah Jenkins', 'Rotator cuff tendonitis in right shoulder.', 'Manual therapy mobilization combined with scapular stabilization exercises. Limit lifting heavier than 2kg for the next 3 weeks.', '2026-06-26', 'Logged'),
        ('P-003', 'Dr. Sarah Jenkins', 'Lower back pain (L4-L5 disc protrusion).', 'Core stabilization program, McKenzie progression exercises, and posture correction education. Avoid lumbar flexion under load.', '2026-06-27', 'Logged'),
        ('P-004', 'Dr. Sarah Jenkins', 'Total hip replacement (left side)', 'Gait retraining, progressive hip abduction strengthening, and functional balance exercises. Strictly observe hip precautions (no flexion > 90 deg).', '2026-06-28', 'Logged')
      ON CONFLICT DO NOTHING
    `);

    // ── Providers ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO providers (id, user_id, name, type, specialty, email, phone, price, session_duration, status, payout_details, rating, review_count, lat, lng, wallet_balance, interview_date, contract_signed, onboarding_stage) VALUES
        ('PROV-001', 5, 'Dr. Sarah Jenkins', 'Doctor', 'Orthopedic Physician',              'sarah.j@ahilney.com',  '+201011223344', 450, 45, 'active', 'Instapay: sarah.j@instapay',          4.8, 15, 30.0276, 31.4913, 0,   '2026-06-25', TRUE, 'active'),
        ('PROV-002', 6, 'Dr. Marcus Vance',  'Doctor', 'Orthopedic Surgeon',               'marcus.v@ahilney.com', '+201099887766', 500, 30, 'active', 'Bank: HSBC EG789012345',               4.7, 10, 30.0889, 31.3153, 0,   '2026-07-02', TRUE, 'active'),
        ('PROV-003', 7, 'Amira Kanaan',      'RS',     'Physical Therapy (PT)',             'amira.k@ahilney.com',  '+201055667788', 350, 60, 'active', 'Instapay: amira.k@instapay',           4.9, 20, 30.0150, 31.4800, 0,   '2026-06-20', TRUE, 'active'),
        ('PROV-004', 8, 'Karim Abdel-Hadi', 'RS',     'Post-Injury Rehabilitation',        'karim.a@ahilney.com',  '+201022334455', 400, 50, 'active', 'Wallet: Vodafone Cash 01222334455',    4.8, 18, 30.0350, 31.4600, 0,   '2026-06-28', TRUE, 'active'),
        ('PROV-005', 9, 'Hassan Al-Saeed',  'RS',     'Pediatric Rehabilitation',          'hassan.s@ahilney.com', '+201077889900', 300, 45, 'active', 'Bank: CIB EG44556677',                 4.6,  8, 30.0900, 31.3200, 0,   NULL,         TRUE, 'active')
      ON CONFLICT (id) DO NOTHING
    `);

    // ── Provider Documents ──────────────────────────────────────────────────
    await client.query(`
      INSERT INTO provider_documents (provider_id, name, status) VALUES
        ('PROV-001', 'National_ID.pdf', 'Approved'), ('PROV-001', 'Medical_License.pdf', 'Approved'), ('PROV-001', 'Sports_Medicine_Specialization.pdf', 'Approved'),
        ('PROV-002', 'National_ID.pdf', 'Approved'), ('PROV-002', 'Orthopedic_Board_Certificate.pdf', 'Approved'),
        ('PROV-003', 'National_ID.pdf', 'Approved'), ('PROV-003', 'PT_Bachelor_Degree.pdf', 'Approved'),
        ('PROV-004', 'National_ID.pdf', 'Approved'), ('PROV-004', 'Rehab_Science_Master.pdf', 'Approved'), ('PROV-004', 'Clinic_Permit.pdf', 'Approved')
      ON CONFLICT DO NOTHING
    `);

    // ── Provider Regions ────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO provider_regions (provider_id, region_name) VALUES
        ('PROV-001', 'New Cairo'), ('PROV-001', 'Heliopolis'),
        ('PROV-002', 'Maadi'), ('PROV-002', 'Dokki'),
        ('PROV-003', 'New Cairo'), ('PROV-003', 'Maadi'),
        ('PROV-004', 'New Cairo'), ('PROV-004', 'Al-Raml'), ('PROV-004', 'Maadi'), ('PROV-004', 'Nasr City'),
        ('PROV-005', 'Heliopolis'), ('PROV-005', 'Dokki'), ('PROV-005', 'Nasr City')
      ON CONFLICT DO NOTHING
    `);

    // ── Shifts ──────────────────────────────────────────────────────────────
    const days = ['Mon','Tue','Wed','Thu'];
    for (const pid of ['PROV-001','PROV-002','PROV-003','PROV-004','PROV-005']) {
      for (const day of days) {
        await client.query(
          `INSERT INTO shifts (provider_id, day_of_week, start_time, end_time) VALUES ($1,$2,'09:00 AM','11:00 AM'),($1,$2,'09:00 PM','11:00 PM') ON CONFLICT DO NOTHING`,
          [pid, day]
        );
      }
    }

    // ── Admins ──────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO admins (id, user_id, name, email, admin_role) VALUES
        ('ADM-001', 10, 'Sherif Amer',   'sherif@ahilney.com', 'Super Admin'),
        ('ADM-002', 11, 'Yasmin Refaat', 'yasmin@ahilney.com', 'Operations Lead'),
        ('ADM-003', 12, 'Tarek Nour',    'tarek@ahilney.com',  'Document Reviewer')
      ON CONFLICT (id) DO NOTHING
    `);

    // ── Appointments ────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO appointments (id, patient_id, provider_id, scheduled_time, scheduled_date, type, status, price, total_charged, service_name, package_size, sessions_remaining, completed_sessions, rating, feedback) VALUES
        ('APT-101', 'P-001', 'PROV-001', '02:00 PM Today', CURRENT_DATE, 'Online Consultation', 'Finished',              450, 450, NULL,                       1, 0, 1, 5, 'Great session with Dr. Sarah! Very thorough explanation and clear treatment steps.'),
        ('APT-102', 'P-002', 'PROV-001', '04:30 PM Today', CURRENT_DATE, 'Online Consultation', 'Confirmed',             450, 450, NULL,                       1, 1, 0, NULL, NULL),
        ('APT-201', 'P-003', 'PROV-004', '10:00 AM Today', CURRENT_DATE, 'Home Visit',          'Pending RS Acceptance', 400, 400, 'Post-Injury Rehabilitation',1, 1, 0, NULL, NULL),
        ('APT-202', 'P-001', 'PROV-004', '01:00 PM Today', CURRENT_DATE, 'Home Visit',          'Confirmed',             400, 400, 'Physical Therapy (PT)',      1, 1, 0, NULL, NULL),
        ('APT-203', 'P-004', 'PROV-004', '03:30 PM Today', CURRENT_DATE, 'Home Visit',          'Confirmed',             400, 400, 'Elderly Rehabilitation',     1, 1, 0, NULL, NULL)
      ON CONFLICT (id) DO NOTHING
    `);

    // ── Summaries ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO summaries (id, appointment_id, provider_id, patient_id, date, complaint, diagnosis, treatment_plan, status) VALUES
        ('SUM-001', 'APT-101', 'PROV-001', 'P-001', '2026-06-25',
         'Knee pain during extension exercises.',
         'Post-ACL stiffness and weak hamstring response.',
         'Hamstring curls 3x10, patellar mobilization daily.',
         'Approved')
      ON CONFLICT (id) DO NOTHING
    `);

    // ── Transactions ────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO transactions (id, type, entity_name, provider_id, amount, status, method, date) VALUES
        ('TXN-001', 'Payout',     'Dr. Sarah Jenkins',             'PROV-001', 450, 'Completed', 'Online',  '2026-06-25'),
        ('TXN-002', 'Commission', 'Ahilney Commission (Hassan)',   'PROV-005',  50, 'Completed', 'Offline', '2026-06-28')
      ON CONFLICT (id) DO NOTHING
    `);

    // ── Promo Codes ─────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO promo_codes (code, discount_percent, max_uses, uses, expiry_date, status) VALUES
        ('AHILNEY50',  50, 200,  45, '2026-12-31', 'active'),
        ('SPORTSREHAB', 20, 500, 128, '2026-09-30', 'active')
      ON CONFLICT (code) DO NOTHING
    `);

    // ── Regions ─────────────────────────────────────────────────────────────
    const { rows: [egypt] } = await client.query(`
      INSERT INTO regions (name, name_ar, icon, currency) VALUES ('Egypt', 'مصر', '🇪🇬', 'EGP')
      ON CONFLICT DO NOTHING RETURNING id
    `);
    const regionId = egypt ? egypt.id : (await client.query(`SELECT id FROM regions WHERE name = 'Egypt'`)).rows[0].id;

    await client.query(`
      INSERT INTO subregions (region_id, name, name_ar) VALUES
        ($1, 'New Cairo',    'القاهرة الجديدة'),
        ($1, 'Al-Raml',      'الرمل'),
        ($1, 'Heliopolis',   'مصر الجديدة'),
        ($1, 'Maadi',        'المعادي'),
        ($1, 'Dokki',        'الدقي'),
        ($1, '6th of October','السادس من أكتوبر'),
        ($1, 'Sheikh Zayed', 'الشيخ زايد'),
        ($1, 'Nasr City',    'مدينة نصر'),
        ($1, 'Alexandria',   'الإسكندرية')
      ON CONFLICT DO NOTHING
    `, [regionId]);

    // ── Wallet credit from approved summary ─────────────────────────────────
    await client.query(`UPDATE providers SET wallet_balance = 382.50 WHERE id = 'PROV-001'`);

    console.log('✅ Seed complete.');
    console.log('\n📋 Login credentials:');
    console.log('   Admin:    sherif@ahilney.com / admin123');
    console.log('   Provider: sarah.j@ahilney.com / password');
    console.log('   Patient:  OTP to +201211098465 (see console log)\n');
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

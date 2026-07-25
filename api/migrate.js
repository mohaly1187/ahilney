/**
 * Database migration — run once to set up the schema.
 * Usage: node api/migrate.js
 * Safe to re-run: uses CREATE TABLE IF NOT EXISTS.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const SQL = `
-- ═══════════════════════════════════════════════════════
--  AHILNEY — DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════

-- Users (all roles share this table)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  phone         VARCHAR(20) UNIQUE,
  email         VARCHAR(120) UNIQUE,
  password_hash TEXT,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('patient','provider','admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- OTP requests
CREATE TABLE IF NOT EXISTS otp_requests (
  id         SERIAL PRIMARY KEY,
  phone      VARCHAR(20) NOT NULL,
  code_hash  TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_requests(phone);

-- Patient ID sequence (must exist before table)
CREATE SEQUENCE IF NOT EXISTS patient_seq START 100;

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id                       VARCHAR(20) PRIMARY KEY DEFAULT ('P-' || LPAD(nextval('patient_seq')::TEXT, 3, '0')),
  user_id                  INT REFERENCES users(id) ON DELETE SET NULL,
  name                     VARCHAR(120) NOT NULL,
  age                      VARCHAR(20),
  phone                    VARCHAR(20),
  email                    VARCHAR(120),
  address                  TEXT,
  medical_history          TEXT,
  wallet_balance           NUMERIC(10,2) DEFAULT 0,
  completed_sessions_count INT DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);

-- Patient prescriptions
CREATE TABLE IF NOT EXISTS patient_prescriptions (
  id          SERIAL PRIMARY KEY,
  patient_id  VARCHAR(20) REFERENCES patients(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  doctor_name VARCHAR(120),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Patient treatment plans
CREATE TABLE IF NOT EXISTS patient_treatment_plans (
  id          SERIAL PRIMARY KEY,
  patient_id  VARCHAR(20) REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name VARCHAR(120),
  diagnosis   TEXT,
  text        TEXT NOT NULL,
  date        DATE DEFAULT CURRENT_DATE,
  status      VARCHAR(30) DEFAULT 'Active',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
  id                  VARCHAR(20) PRIMARY KEY,
  user_id             INT REFERENCES users(id) ON DELETE SET NULL,
  name                VARCHAR(120) NOT NULL,
  type                VARCHAR(20) NOT NULL CHECK (type IN ('Doctor','RS')),
  specialty           VARCHAR(120),
  email               VARCHAR(120),
  phone               VARCHAR(20),
  price               NUMERIC(10,2) DEFAULT 0,
  session_duration    INT DEFAULT 45,
  status              VARCHAR(30) DEFAULT 'pending',
  payout_details      TEXT,
  rating              NUMERIC(3,1) DEFAULT 4.8,
  review_count        INT DEFAULT 0,
  lat                 NUMERIC(10,6),
  lng                 NUMERIC(10,6),
  wallet_balance      NUMERIC(10,2) DEFAULT 0,
  interview_date      DATE,
  contract_signed     BOOLEAN DEFAULT FALSE,
  onboarding_stage    VARCHAR(30) DEFAULT 'review',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);

-- Provider documents
CREATE TABLE IF NOT EXISTS provider_documents (
  id          SERIAL PRIMARY KEY,
  provider_id VARCHAR(20) REFERENCES providers(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  status      VARCHAR(20) DEFAULT 'Pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Provider regions
CREATE TABLE IF NOT EXISTS provider_regions (
  id          SERIAL PRIMARY KEY,
  provider_id VARCHAR(20) REFERENCES providers(id) ON DELETE CASCADE,
  region_name VARCHAR(80) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_provider_regions ON provider_regions(provider_id);

-- Weekly shifts
CREATE TABLE IF NOT EXISTS shifts (
  id          SERIAL PRIMARY KEY,
  provider_id VARCHAR(20) REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL,
  start_time  VARCHAR(12) NOT NULL,
  end_time    VARCHAR(12) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shifts_provider ON shifts(provider_id);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id         VARCHAR(20) PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE SET NULL,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(120),
  admin_role VARCHAR(50) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id                  VARCHAR(20) PRIMARY KEY,
  patient_id          VARCHAR(20) REFERENCES patients(id),
  provider_id         VARCHAR(20) REFERENCES providers(id),
  scheduled_time      TEXT NOT NULL,
  scheduled_date      DATE,
  type                VARCHAR(30) NOT NULL,
  status              VARCHAR(40) NOT NULL DEFAULT 'Pending RS Acceptance',
  price               NUMERIC(10,2) DEFAULT 0,
  total_charged       NUMERIC(10,2) DEFAULT 0,
  service_name        VARCHAR(120),
  package_size        INT DEFAULT 1,
  sessions_remaining  INT DEFAULT 1,
  completed_sessions  INT DEFAULT 0,
  rating              INT,
  feedback            TEXT,
  rejection_reason    TEXT,
  session_started_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_apts_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_apts_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_apts_status ON appointments(status);

-- Post-session summaries
CREATE TABLE IF NOT EXISTS summaries (
  id                VARCHAR(20) PRIMARY KEY,
  appointment_id    VARCHAR(20) REFERENCES appointments(id),
  provider_id       VARCHAR(20) REFERENCES providers(id),
  patient_id        VARCHAR(20) REFERENCES patients(id),
  date              DATE DEFAULT CURRENT_DATE,
  complaint         TEXT NOT NULL,
  diagnosis         TEXT NOT NULL,
  treatment_plan    TEXT NOT NULL,
  home_exercise     TEXT,
  next_session_rec  TEXT,
  follow_up_date    DATE,
  session_notes     TEXT,
  status            VARCHAR(20) DEFAULT 'Pending',
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_summaries_status ON summaries(status);
CREATE INDEX IF NOT EXISTS idx_summaries_provider ON summaries(provider_id);

-- Financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id          VARCHAR(25) PRIMARY KEY,
  type        VARCHAR(40) NOT NULL,
  entity_name VARCHAR(180),
  provider_id VARCHAR(20) REFERENCES providers(id) ON DELETE SET NULL,
  patient_id  VARCHAR(20) REFERENCES patients(id) ON DELETE SET NULL,
  amount      NUMERIC(10,2) NOT NULL,
  status      VARCHAR(20) DEFAULT 'Completed',
  method      VARCHAR(40),
  date        DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_txn_provider ON transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_txn_patient ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(30) UNIQUE NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL,
  max_uses         INT DEFAULT 100,
  uses             INT DEFAULT 0,
  expiry_date      DATE NOT NULL,
  status           VARCHAR(20) DEFAULT 'active',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Regions
CREATE TABLE IF NOT EXISTS regions (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(80) NOT NULL,
  name_ar  VARCHAR(80),
  icon     VARCHAR(10),
  currency VARCHAR(10) DEFAULT 'EGP'
);

-- Subregions
CREATE TABLE IF NOT EXISTS subregions (
  id        SERIAL PRIMARY KEY,
  region_id INT REFERENCES regions(id) ON DELETE CASCADE,
  name      VARCHAR(80) NOT NULL,
  name_ar   VARCHAR(80)
);
CREATE INDEX IF NOT EXISTS idx_subregions_region ON subregions(region_id);
`;

// Column additions for schema evolution (safe to run repeatedly)
const ALTERATIONS = `
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_charged NUMERIC(10,2) DEFAULT 0;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations…');
    await client.query(SQL);
    await client.query(ALTERATIONS);
    console.log('✅ Migrations complete.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { signToken } = require('../middleware/auth');
const { sendOtp } = require('../sms');

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /auth/send-otp
router.post('/send-otp', [
  body('phone').notEmpty().withMessage('Phone is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone } = req.body;
  const code = randomOtp();
  const hash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.query(
    `INSERT INTO otp_requests (phone, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [phone, hash, expiresAt]
  );

  await sendOtp(phone, code);
  res.json({ success: true, message: 'OTP sent' });
});

// POST /auth/verify-otp
router.post('/verify-otp', [
  body('phone').notEmpty(),
  body('code').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, code } = req.body;

  const { rows } = await db.query(
    `SELECT * FROM otp_requests WHERE phone = $1 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );
  if (!rows.length) return res.status(401).json({ error: 'No valid OTP found. Request a new one.' });

  const otp = rows[0];
  const valid = await bcrypt.compare(code, otp.code_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect code' });

  await db.query(`UPDATE otp_requests SET used = true WHERE id = $1`, [otp.id]);

  // Find or create patient user by phone
  let user = (await db.query(`SELECT * FROM users WHERE phone = $1 AND role = 'patient'`, [phone])).rows[0];
  if (!user) {
    const { rows: [created] } = await db.query(
      `INSERT INTO users (phone, role) VALUES ($1, 'patient') RETURNING *`,
      [phone]
    );
    user = created;
    // Create bare patient record
    await db.query(
      `INSERT INTO patients (user_id, name, wallet_balance) VALUES ($1, $2, 0)`,
      [user.id, phone]
    );
  }

  const patient = (await db.query(`SELECT * FROM patients WHERE user_id = $1`, [user.id])).rows[0];
  const token = signToken({ sub: user.id, patientId: patient.id, role: 'patient', phone });
  res.json({ token, patientId: patient.id, name: patient.name });
});

// POST /auth/provider/login — email + password
router.post('/provider/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = (await db.query(`SELECT * FROM users WHERE email = $1 AND role = 'provider'`, [email])).rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const provider = (await db.query(`SELECT * FROM providers WHERE user_id = $1`, [user.id])).rows[0];
  const token = signToken({ sub: user.id, providerId: provider.id, role: 'provider', email });
  res.json({ token, providerId: provider.id, name: provider.name, type: provider.type });
});

// POST /auth/admin/login — email + password
router.post('/admin/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = (await db.query(`SELECT * FROM users WHERE email = $1 AND role = 'admin'`, [email])).rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const admin = (await db.query(`SELECT * FROM admins WHERE user_id = $1`, [user.id])).rows[0];
  const token = signToken({ sub: user.id, adminId: admin.id, role: 'admin', email });
  res.json({ token, adminId: admin.id, name: admin.name, adminRole: admin.admin_role });
});

module.exports = router;

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { query: dbQuery, pool } = require('../db');
const db = { query: dbQuery };
const { requirePatient } = require('../middleware/auth');

// GET /patient/profile
router.get('/profile', requirePatient, async (req, res) => {
  const { rows } = await db.query(`
    SELECT p.*,
      json_agg(DISTINCT pp.*) FILTER (WHERE pp.id IS NOT NULL) AS prescriptions,
      json_agg(DISTINCT pt.*) FILTER (WHERE pt.id IS NOT NULL) AS treatment_plans
    FROM patients p
    LEFT JOIN patient_prescriptions pp ON pp.patient_id = p.id
    LEFT JOIN patient_treatment_plans pt ON pt.patient_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
  `, [req.user.patientId]);
  if (!rows.length) return res.status(404).json({ error: 'Patient not found' });
  res.json(rows[0]);
});

// PUT /patient/profile
router.put('/profile', requirePatient, async (req, res) => {
  const { name, age, address, medical_history } = req.body;
  const { rows } = await db.query(
    `UPDATE patients SET name = COALESCE($1, name), age = COALESCE($2, age),
     address = COALESCE($3, address), medical_history = COALESCE($4, medical_history)
     WHERE id = $5 RETURNING *`,
    [name, age, address, medical_history, req.user.patientId]
  );
  res.json(rows[0]);
});

// GET /patient/appointments
router.get('/appointments', requirePatient, async (req, res) => {
  const { status } = req.query;
  let q = `
    SELECT a.*, p.name AS provider_name, p.type AS provider_type, p.specialty AS provider_specialty
    FROM appointments a
    JOIN providers p ON p.id = a.provider_id
    WHERE a.patient_id = $1
  `;
  const params = [req.user.patientId];
  if (status) { params.push(status); q += ` AND a.status = $${params.length}`; }
  q += ` ORDER BY a.created_at DESC`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// POST /patient/appointments — book a new appointment
router.post('/appointments', requirePatient, [
  body('provider_id').notEmpty(),
  body('type').isIn(['Home Visit', 'Online Consultation']),
  body('scheduled_time').notEmpty(),
  body('package_size').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { provider_id, type, scheduled_time, package_size, price, service_name, promo_code } = req.body;

  // Check patient wallet
  const patient = (await db.query(`SELECT * FROM patients WHERE id = $1`, [req.user.patientId])).rows[0];
  const totalCost = price * package_size;
  if (patient.wallet_balance < totalCost) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }

  // Apply promo if given
  let finalCost = totalCost;
  if (promo_code) {
    const promo = (await db.query(
      `SELECT * FROM promo_codes WHERE code = $1 AND status = 'active' AND expiry_date >= CURRENT_DATE AND uses < max_uses`,
      [promo_code.toUpperCase()]
    )).rows[0];
    if (promo) {
      finalCost = totalCost * (1 - promo.discount_percent / 100);
      await db.query(`UPDATE promo_codes SET uses = uses + 1 WHERE id = $1`, [promo.id]);
    }
  }

  // Generate IDs before transaction
  const aptId = 'APT-' + Date.now().toString().slice(-6);
  const txnId = 'TXN-' + Date.now().toString().slice(-6);
  const scheduledDate = req.body.scheduled_date || null;

  // Atomically: create appointment + deduct wallet + log transaction
  const client = await pool.connect();
  let apt;
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`
      INSERT INTO appointments (id, patient_id, provider_id, scheduled_time, scheduled_date, type, status, price, total_charged, service_name, package_size, sessions_remaining)
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending RS Acceptance', $7, $8, $9, $10, $10) RETURNING *
    `, [aptId, req.user.patientId, provider_id, scheduled_time, scheduledDate, type, price, finalCost, service_name || null, package_size]);
    apt = rows[0];

    await client.query(
      `UPDATE patients SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
      [finalCost, req.user.patientId]
    );

    await client.query(`
      INSERT INTO transactions (id, type, entity_name, patient_id, amount, status, method, date)
      VALUES ($1, 'Payment', $2, $3, $4, 'Completed', 'Wallet', CURRENT_DATE)
    `, [txnId, `Booking ${aptId}`, req.user.patientId, finalCost]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Notify provider (outside transaction — non-critical)
  const provUser = (await db.query(`SELECT u.id FROM users u JOIN providers p ON p.user_id = u.id WHERE p.id = $1`, [provider_id])).rows[0];
  if (provUser) {
    await db.query(`INSERT INTO notifications (user_id, text) VALUES ($1, $2)`,
      [provUser.id, `New booking from ${patient.name} — ${type} on ${scheduled_time}`]);
  }

  res.status(201).json(apt);
});

// GET /patient/appointments/:id
router.get('/appointments/:id', requirePatient, async (req, res) => {
  const { rows } = await db.query(`
    SELECT a.*, p.name AS provider_name, p.type AS provider_type, p.specialty, p.phone AS provider_phone
    FROM appointments a JOIN providers p ON p.id = a.provider_id
    WHERE a.id = $1 AND a.patient_id = $2
  `, [req.params.id, req.user.patientId]);
  if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
  res.json(rows[0]);
});

// POST /patient/appointments/:id/rate
router.post('/appointments/:id/rate', requirePatient, [
  body('rating').isInt({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { rating, feedback } = req.body;
  const apt = (await db.query(`SELECT * FROM appointments WHERE id = $1 AND patient_id = $2 AND status = 'Finished'`,
    [req.params.id, req.user.patientId])).rows[0];
  if (!apt) return res.status(404).json({ error: 'Finished appointment not found' });

  await db.query(`UPDATE appointments SET rating = $1, feedback = $2 WHERE id = $3`, [rating, feedback || null, apt.id]);

  // Update provider rating
  const { rows: [prov] } = await db.query(`SELECT * FROM providers WHERE id = $1`, [apt.provider_id]);
  if (prov) {
    const newCount = (prov.review_count || 0) + 1;
    const newRating = Math.min(5.0, (((prov.rating || 0) * (newCount - 1)) + rating) / newCount);
    await db.query(`UPDATE providers SET rating = $1, review_count = $2 WHERE id = $3`,
      [Math.round(newRating * 10) / 10, newCount, prov.id]);
  }

  res.json({ success: true });
});

// GET /patient/wallet
router.get('/wallet', requirePatient, async (req, res) => {
  const patient = (await db.query(`SELECT wallet_balance FROM patients WHERE id = $1`, [req.user.patientId])).rows[0];
  const txns = (await db.query(
    `SELECT * FROM transactions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.patientId]
  )).rows;
  res.json({ balance: patient.wallet_balance, transactions: txns });
});

// POST /patient/wallet/topup — mock top-up
router.post('/wallet/topup', requirePatient, [body('amount').isFloat({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { amount } = req.body;
  await db.query(`UPDATE patients SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [amount, req.user.patientId]);
  const txnId = 'TXN-TOP-' + Date.now().toString().slice(-5);
  await db.query(`INSERT INTO transactions (id, type, entity_name, patient_id, amount, status, method, date) VALUES ($1, 'Top-Up', 'Wallet Top-Up', $2, $3, 'Completed', 'Mock Payment', CURRENT_DATE)`,
    [txnId, req.user.patientId, amount]);

  const { rows: [p] } = await db.query(`SELECT wallet_balance FROM patients WHERE id = $1`, [req.user.patientId]);
  res.json({ success: true, new_balance: p.wallet_balance });
});

// GET /patient/notifications
router.get('/notifications', requirePatient, async (req, res) => {
  const user = (await db.query(`SELECT user_id FROM patients WHERE id = $1`, [req.user.patientId])).rows[0];
  const { rows } = await db.query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [user.user_id]);
  res.json(rows);
});

// POST /patient/notifications/:id/read
router.post('/notifications/:id/read', requirePatient, async (req, res) => {
  const user = (await db.query(`SELECT user_id FROM patients WHERE id = $1`, [req.user.patientId])).rows[0];
  await db.query(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [req.params.id, user.user_id]);
  res.json({ success: true });
});

module.exports = router;

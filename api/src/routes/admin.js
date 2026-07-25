const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { query: dbQuery, pool } = require('../db');
const db = { query: dbQuery };
const { requireAdmin } = require('../middleware/auth');

const COMMISSION_RATE = 0.15; // 15% platform commission

// GET /admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  const [patients, providers, pendingAudits, homeVisitsToday, revenue, sessions] = await Promise.all([
    db.query(`SELECT COUNT(*) AS count FROM patients`),
    db.query(`SELECT COUNT(*) AS count FROM providers`),
    db.query(`SELECT COUNT(*) AS count FROM summaries WHERE status = 'Pending'`),
    db.query(`SELECT COUNT(*) AS count FROM appointments WHERE type = 'Home Visit' AND scheduled_date = CURRENT_DATE`),
    db.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'Payment'`),
    db.query(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'Finished'`),
  ]);

  const recentApts = (await db.query(`
    SELECT a.*, pt.name AS patient_name, p.name AS provider_name
    FROM appointments a JOIN patients pt ON pt.id = a.patient_id JOIN providers p ON p.id = a.provider_id
    ORDER BY a.created_at DESC LIMIT 6
  `)).rows;

  const recentTxns = (await db.query(`
    SELECT * FROM transactions ORDER BY created_at DESC LIMIT 6
  `)).rows;

  res.json({
    patients: parseInt(patients.rows[0].count),
    providers: parseInt(providers.rows[0].count),
    pending_audits: parseInt(pendingAudits.rows[0].count),
    home_visits_today: parseInt(homeVisitsToday.rows[0].count),
    total_revenue: parseFloat(revenue.rows[0].total),
    sessions_completed: parseInt(sessions.rows[0].count),
    recent_appointments: recentApts,
    recent_transactions: recentTxns,
  });
});

// GET /admin/appointments
router.get('/appointments', requireAdmin, async (req, res) => {
  const { status, type, search } = req.query;
  let q = `
    SELECT a.*, pt.name AS patient_name, p.name AS provider_name, p.type AS provider_type
    FROM appointments a
    JOIN patients pt ON pt.id = a.patient_id
    JOIN providers p ON p.id = a.provider_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { params.push(status); q += ` AND a.status = $${params.length}`; }
  if (type) { params.push(type); q += ` AND a.type = $${params.length}`; }
  if (search) { params.push(`%${search}%`); q += ` AND (pt.name ILIKE $${params.length} OR p.name ILIKE $${params.length})`; }
  q += ` ORDER BY a.created_at DESC`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// PUT /admin/appointments/:id/status
router.put('/appointments/:id/status', requireAdmin, [
  body('status').notEmpty(),
], async (req, res) => {
  const { status } = req.body;
  const { rows } = await db.query(
    `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
  res.json(rows[0]);
});

// GET /admin/summaries
router.get('/summaries', requireAdmin, async (req, res) => {
  const { status } = req.query;
  let q = `
    SELECT s.*, pt.name AS patient_name, p.name AS provider_name, p.type AS provider_type,
           a.type AS appointment_type, a.price AS appointment_price, a.scheduled_time
    FROM summaries s
    JOIN patients pt ON pt.id = s.patient_id
    JOIN providers p ON p.id = s.provider_id
    JOIN appointments a ON a.id = s.appointment_id
  `;
  const params = [];
  if (status) { params.push(status); q += ` WHERE s.status = $${params.length}`; }
  q += ` ORDER BY s.created_at DESC`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// POST /admin/summaries/:id/approve — approve + trigger payout
router.post('/summaries/:id/approve', requireAdmin, async (req, res) => {
  const summary = (await db.query(`SELECT * FROM summaries WHERE id = $1 AND status = 'Pending'`, [req.params.id])).rows[0];
  if (!summary) return res.status(404).json({ error: 'Pending summary not found' });

  const apt = (await db.query(`SELECT * FROM appointments WHERE id = $1`, [summary.appointment_id])).rows[0];
  const provider = (await db.query(`SELECT p.*, u.id AS user_id FROM providers p JOIN users u ON u.id = p.user_id WHERE p.id = $1`, [summary.provider_id])).rows[0];

  const payout = Math.round(apt.price * (1 - COMMISSION_RATE) * 100) / 100;
  const commission = Math.round(apt.price * COMMISSION_RATE * 100) / 100;
  const payoutId = 'TXN-PAY-' + Date.now().toString().slice(-6);
  const commId   = 'TXN-COM-' + (Date.now() + 1).toString().slice(-6);

  // Atomically: approve summary + increment sessions + credit wallet + log both transactions
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`UPDATE summaries SET status = 'Approved' WHERE id = $1`, [summary.id]);

    await client.query(
      `UPDATE appointments SET completed_sessions = COALESCE(completed_sessions, 0) + 1 WHERE id = $1`,
      [apt.id]
    );

    await client.query(
      `UPDATE providers SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [payout, provider.id]
    );

    await client.query(`
      INSERT INTO transactions (id, type, entity_name, provider_id, amount, status, method, date)
      VALUES ($1, 'Payout', $2, $3, $4, 'Completed', 'Wallet Credit', CURRENT_DATE)
    `, [payoutId, provider.name, provider.id, payout]);

    await client.query(`
      INSERT INTO transactions (id, type, entity_name, provider_id, amount, status, method, date)
      VALUES ($1, 'Commission', $2, $3, $4, 'Completed', 'Platform', CURRENT_DATE)
    `, [commId, `Ahilney Commission (${provider.name})`, provider.id, commission]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Notify provider (outside transaction — non-critical)
  await db.query(`INSERT INTO notifications (user_id, text) VALUES ($1, $2)`,
    [provider.user_id, `✅ Session summary approved! ${payout} EGP has been credited to your wallet.`]);

  res.json({ success: true, payout, commission });
});

// POST /admin/summaries/:id/reject
router.post('/summaries/:id/reject', requireAdmin, [
  body('reason').notEmpty().withMessage('Rejection reason is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { reason } = req.body;
  const summary = (await db.query(`SELECT * FROM summaries WHERE id = $1 AND status = 'Pending'`, [req.params.id])).rows[0];
  if (!summary) return res.status(404).json({ error: 'Pending summary not found' });

  await db.query(`UPDATE summaries SET status = 'Rejected', rejection_reason = $1 WHERE id = $2`, [reason, summary.id]);

  const provider = (await db.query(`SELECT p.*, u.id AS user_id FROM providers p JOIN users u ON u.id = p.user_id WHERE p.id = $1`, [summary.provider_id])).rows[0];
  if (provider) {
    await db.query(`INSERT INTO notifications (user_id, text) VALUES ($1, $2)`,
      [provider.user_id, `❌ Session summary rejected. Reason: ${reason}`]);
  }

  res.json({ success: true });
});

// GET /admin/providers
router.get('/providers', requireAdmin, async (req, res) => {
  const { search, type, status } = req.query;
  let q = `
    SELECT p.*,
      array_agg(DISTINCT pr.region_name) FILTER (WHERE pr.id IS NOT NULL) AS regions_covered,
      json_agg(DISTINCT jsonb_build_object('id', pd.id, 'name', pd.name, 'status', pd.status)) FILTER (WHERE pd.id IS NOT NULL) AS documents
    FROM providers p
    LEFT JOIN provider_regions pr ON pr.provider_id = p.id
    LEFT JOIN provider_documents pd ON pd.provider_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (search) { params.push(`%${search}%`); q += ` AND p.name ILIKE $${params.length}`; }
  if (type) { params.push(type); q += ` AND p.type = $${params.length}`; }
  if (status) { params.push(status); q += ` AND p.status = $${params.length}`; }
  q += ` GROUP BY p.id ORDER BY p.name`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// GET /admin/providers/:id
router.get('/providers/:id', requireAdmin, async (req, res) => {
  const { rows } = await db.query(`
    SELECT p.*,
      array_agg(DISTINCT pr.region_name) FILTER (WHERE pr.id IS NOT NULL) AS regions_covered,
      json_agg(DISTINCT jsonb_build_object('id', pd.id, 'name', pd.name, 'status', pd.status)) FILTER (WHERE pd.id IS NOT NULL) AS documents,
      json_agg(DISTINCT jsonb_build_object('day', s.day_of_week, 'start', s.start_time, 'end', s.end_time)) FILTER (WHERE s.id IS NOT NULL) AS shifts
    FROM providers p
    LEFT JOIN provider_regions pr ON pr.provider_id = p.id
    LEFT JOIN provider_documents pd ON pd.provider_id = p.id
    LEFT JOIN shifts s ON s.provider_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Provider not found' });
  res.json(rows[0]);
});

// PUT /admin/providers/:id/status
router.put('/providers/:id/status', requireAdmin, [body('status').notEmpty()], async (req, res) => {
  const { status } = req.body;
  const { rows } = await db.query(`UPDATE providers SET status = $1 WHERE id = $2 RETURNING *`, [status, req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Provider not found' });
  res.json(rows[0]);
});

// PUT /admin/providers/:id/documents/:docId
router.put('/providers/:id/documents/:docId', requireAdmin, [body('status').isIn(['Approved', 'Rejected'])], async (req, res) => {
  const { status } = req.body;
  const { rows } = await db.query(
    `UPDATE provider_documents SET status = $1 WHERE id = $2 AND provider_id = $3 RETURNING *`,
    [status, req.params.docId, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Document not found' });
  res.json(rows[0]);
});

// GET /admin/patients
router.get('/patients', requireAdmin, async (req, res) => {
  const { search } = req.query;
  let q = `SELECT pt.*, COUNT(DISTINCT a.id) AS total_appointments FROM patients pt LEFT JOIN appointments a ON a.patient_id = pt.id WHERE 1=1`;
  const params = [];
  if (search) { params.push(`%${search}%`); q += ` AND pt.name ILIKE $${params.length}`; }
  q += ` GROUP BY pt.id ORDER BY pt.name`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// GET /admin/patients/:id
router.get('/patients/:id', requireAdmin, async (req, res) => {
  const { rows } = await db.query(`
    SELECT pt.*,
      json_agg(DISTINCT jsonb_build_object('id', pp.id, 'text', pp.text, 'doctor', pp.doctor_name)) FILTER (WHERE pp.id IS NOT NULL) AS prescriptions,
      json_agg(DISTINCT jsonb_build_object('id', ptp.id, 'diagnosis', ptp.diagnosis, 'text', ptp.text, 'date', ptp.date, 'status', ptp.status)) FILTER (WHERE ptp.id IS NOT NULL) AS treatment_plans
    FROM patients pt
    LEFT JOIN patient_prescriptions pp ON pp.patient_id = pt.id
    LEFT JOIN patient_treatment_plans ptp ON ptp.patient_id = pt.id
    WHERE pt.id = $1
    GROUP BY pt.id
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Patient not found' });

  const appointments = (await db.query(
    `SELECT a.*, p.name AS provider_name FROM appointments a JOIN providers p ON p.id = a.provider_id WHERE a.patient_id = $1 ORDER BY a.created_at DESC`,
    [req.params.id]
  )).rows;

  res.json({ ...rows[0], appointments });
});

// POST /admin/patients/:id/refund
router.post('/patients/:id/refund', requireAdmin, [
  body('amount').isFloat({ min: 0.01 }),
  body('reason').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { amount, reason } = req.body;
  const patient = (await db.query(`SELECT * FROM patients WHERE id = $1`, [req.params.id])).rows[0];
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  await db.query(`UPDATE patients SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [amount, patient.id]);

  const txnId = 'TXN-REF-' + Date.now().toString().slice(-6);
  await db.query(`
    INSERT INTO transactions (id, type, entity_name, patient_id, amount, status, method, date)
    VALUES ($1, 'Refund Issued', $2, $3, $4, 'Completed', 'Wallet Credit', CURRENT_DATE)
  `, [txnId, `Refund for ${patient.name} (${reason})`, patient.id, amount]);

  const { rows: [updated] } = await db.query(`SELECT wallet_balance FROM patients WHERE id = $1`, [patient.id]);
  res.json({ success: true, new_balance: updated.wallet_balance });
});

// GET /admin/transactions
router.get('/transactions', requireAdmin, async (req, res) => {
  const { type } = req.query;
  let q = `SELECT t.*, p.name AS provider_name, pt.name AS patient_name FROM transactions t LEFT JOIN providers p ON p.id = t.provider_id LEFT JOIN patients pt ON pt.id = t.patient_id WHERE 1=1`;
  const params = [];
  if (type && type !== 'all') { params.push(type); q += ` AND t.type = $${params.length}`; }
  q += ` ORDER BY t.created_at DESC`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// GET /admin/promos
router.get('/promos', requireAdmin, async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM promo_codes ORDER BY created_at DESC`);
  res.json(rows);
});

// POST /admin/promos
router.post('/promos', requireAdmin, [
  body('code').notEmpty(),
  body('discount_percent').isFloat({ min: 1, max: 100 }),
  body('max_uses').isInt({ min: 1 }),
  body('expiry_date').isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { code, discount_percent, max_uses, expiry_date, status } = req.body;
  const { rows } = await db.query(`
    INSERT INTO promo_codes (code, discount_percent, max_uses, uses, expiry_date, status)
    VALUES ($1, $2, $3, 0, $4, $5) RETURNING *
  `, [code.toUpperCase(), discount_percent, max_uses, expiry_date, status || 'active']);
  res.status(201).json(rows[0]);
});

// PUT /admin/promos/:id
router.put('/promos/:id', requireAdmin, async (req, res) => {
  const { status, max_uses, expiry_date } = req.body;
  const { rows } = await db.query(`
    UPDATE promo_codes SET
      status = COALESCE($1, status),
      max_uses = COALESCE($2, max_uses),
      expiry_date = COALESCE($3, expiry_date)
    WHERE id = $4 RETURNING *
  `, [status, max_uses, expiry_date, req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Promo not found' });
  res.json(rows[0]);
});

// GET /admin/regions
router.get('/regions', requireAdmin, async (req, res) => {
  const regions = (await db.query(`SELECT * FROM regions ORDER BY name`)).rows;
  const subs = (await db.query(`SELECT * FROM subregions ORDER BY name`)).rows;
  res.json(regions.map(r => ({ ...r, subregions: subs.filter(s => s.region_id === r.id) })));
});

// POST /admin/regions/:id/subregions
router.post('/regions/:id/subregions', requireAdmin, [body('name').notEmpty()], async (req, res) => {
  const { name, name_ar } = req.body;
  const { rows } = await db.query(
    `INSERT INTO subregions (region_id, name, name_ar) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, name, name_ar || null]
  );
  res.status(201).json(rows[0]);
});

// DELETE /admin/regions/:id/subregions/:subId
router.delete('/regions/:id/subregions/:subId', requireAdmin, async (req, res) => {
  await db.query(`DELETE FROM subregions WHERE id = $1 AND region_id = $2`, [req.params.subId, req.params.id]);
  res.json({ success: true });
});

module.exports = router;

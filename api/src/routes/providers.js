const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { query: dbQuery, pool } = require('../db');
const db = { query: dbQuery };
const { requireProvider } = require('../middleware/auth');

// GET /provider/profile
router.get('/profile', requireProvider, async (req, res) => {
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
  `, [req.user.providerId]);
  if (!rows.length) return res.status(404).json({ error: 'Provider not found' });
  res.json(rows[0]);
});

// GET /provider/appointments
router.get('/appointments', requireProvider, async (req, res) => {
  const { status } = req.query;
  let q = `
    SELECT a.*, pt.name AS patient_name, pt.age AS patient_age, pt.medical_history,
           pp.text AS prescription_text, pp.doctor_name AS prescription_doctor
    FROM appointments a
    JOIN patients pt ON pt.id = a.patient_id
    LEFT JOIN patient_prescriptions pp ON pp.patient_id = pt.id
    WHERE a.provider_id = $1
  `;
  const params = [req.user.providerId];
  if (status) { params.push(status); q += ` AND a.status = $${params.length}`; }
  q += ` ORDER BY a.created_at DESC`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// POST /provider/appointments/:id/accept
router.post('/appointments/:id/accept', requireProvider, async (req, res) => {
  const apt = (await db.query(
    `SELECT * FROM appointments WHERE id = $1 AND provider_id = $2 AND status = 'Pending RS Acceptance'`,
    [req.params.id, req.user.providerId]
  )).rows[0];
  if (!apt) return res.status(404).json({ error: 'Appointment not found or not in pending state' });

  await db.query(`UPDATE appointments SET status = 'Confirmed' WHERE id = $1`, [apt.id]);

  // Notify patient
  const patient = (await db.query(`SELECT pt.*, u.id AS user_id FROM patients pt JOIN users u ON u.id = pt.user_id WHERE pt.id = $1`, [apt.patient_id])).rows[0];
  const provider = (await db.query(`SELECT name FROM providers WHERE id = $1`, [req.user.providerId])).rows[0];
  if (patient) {
    await db.query(`INSERT INTO notifications (user_id, text) VALUES ($1, $2)`,
      [patient.user_id, `✅ Your booking with ${provider.name} has been confirmed!`]);
  }

  res.json({ success: true, status: 'Confirmed' });
});

// POST /provider/appointments/:id/reject
router.post('/appointments/:id/reject', requireProvider, [
  body('reason').notEmpty().withMessage('Rejection reason is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { reason } = req.body;
  const apt = (await db.query(
    `SELECT * FROM appointments WHERE id = $1 AND provider_id = $2 AND status = 'Pending RS Acceptance'`,
    [req.params.id, req.user.providerId]
  )).rows[0];
  if (!apt) return res.status(404).json({ error: 'Appointment not found or not in pending state' });

  const refundAmt = apt.total_charged > 0 ? apt.total_charged : apt.price;
  const txnId = 'TXN-REF-' + Date.now().toString().slice(-5);

  // Atomically: reject appointment + refund wallet + log transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE appointments SET status = 'Rejected', rejection_reason = $1 WHERE id = $2`,
      [reason, apt.id]
    );

    await client.query(
      `UPDATE patients SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [refundAmt, apt.patient_id]
    );

    await client.query(
      `INSERT INTO transactions (id, type, entity_name, patient_id, amount, status, method, date) VALUES ($1, 'Refund', $2, $3, $4, 'Completed', 'Wallet Credit', CURRENT_DATE)`,
      [txnId, `Refund for rejected booking ${apt.id}`, apt.patient_id, refundAmt]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Notify patient (outside transaction — non-critical)
  const patient = (await db.query(`SELECT pt.*, u.id AS user_id FROM patients pt JOIN users u ON u.id = pt.user_id WHERE pt.id = $1`, [apt.patient_id])).rows[0];
  const provider = (await db.query(`SELECT name FROM providers WHERE id = $1`, [req.user.providerId])).rows[0];
  if (patient) {
    await db.query(`INSERT INTO notifications (user_id, text) VALUES ($1, $2)`,
      [patient.user_id, `❌ Booking with ${provider.name} was rejected. Reason: ${reason}. Your wallet has been refunded.`]);
  }

  res.json({ success: true, status: 'Rejected' });
});

// POST /provider/appointments/:id/start — start session
router.post('/appointments/:id/start', requireProvider, async (req, res) => {
  const apt = (await db.query(
    `SELECT * FROM appointments WHERE id = $1 AND provider_id = $2 AND status = 'Confirmed'`,
    [req.params.id, req.user.providerId]
  )).rows[0];
  if (!apt) return res.status(404).json({ error: 'Confirmed appointment not found' });

  await db.query(
    `UPDATE appointments SET session_started_at = NOW(), status = 'Need Summary' WHERE id = $1`,
    [apt.id]
  );
  res.json({ success: true, session_started_at: new Date() });
});

// POST /provider/appointments/:id/summary — end session + submit summary
router.post('/appointments/:id/summary', requireProvider, [
  body('complaint').notEmpty().withMessage('Chief complaint is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis/findings are required'),
  body('treatment_plan').notEmpty().withMessage('Treatment plan is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const apt = (await db.query(
    `SELECT * FROM appointments WHERE id = $1 AND provider_id = $2`,
    [req.params.id, req.user.providerId]
  )).rows[0];
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  // Idempotency check first: a duplicate is always a 409 regardless of current status
  const existing = (await db.query(`SELECT id FROM summaries WHERE appointment_id = $1`, [apt.id])).rows;
  if (existing.length) {
    return res.status(409).json({ error: 'A summary has already been submitted for this appointment', summaryId: existing[0].id });
  }

  // State gate: only allowed from Need Summary (session was started) or Confirmed
  if (!['Need Summary', 'Confirmed'].includes(apt.status)) {
    return res.status(400).json({ error: `Cannot submit summary for appointment in status: ${apt.status}` });
  }

  const { complaint, diagnosis, treatment_plan, home_exercise, next_session_rec, follow_up_date, session_notes } = req.body;
  const sumId = 'SUM-' + Date.now().toString().slice(-6);

  await db.query(`
    INSERT INTO summaries (id, appointment_id, provider_id, patient_id, date, complaint, diagnosis, treatment_plan, home_exercise, next_session_rec, follow_up_date, session_notes, status)
    VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, $10, $11, 'Pending')
  `, [sumId, apt.id, req.user.providerId, apt.patient_id, complaint, diagnosis, treatment_plan, home_exercise || null, next_session_rec || null, follow_up_date || null, session_notes || null]);

  await db.query(`UPDATE appointments SET status = 'Finished' WHERE id = $1`, [apt.id]);

  // Add to patient treatment plans
  await db.query(`
    INSERT INTO patient_treatment_plans (patient_id, doctor_name, diagnosis, text, date, status)
    SELECT $1, p.name, $2, $3, CURRENT_DATE, 'Active'
    FROM providers p WHERE p.id = $4
  `, [apt.patient_id, diagnosis, treatment_plan, req.user.providerId]);

  res.status(201).json({ success: true, summaryId: sumId });
});

// GET /provider/shifts
router.get('/shifts', requireProvider, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM shifts WHERE provider_id = $1 ORDER BY CASE day_of_week WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3 WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6 ELSE 7 END, start_time`,
    [req.user.providerId]
  );
  res.json(rows);
});

// PUT /provider/shifts — replace all shifts
router.put('/shifts', requireProvider, async (req, res) => {
  const { shifts } = req.body; // [{day_of_week, start_time, end_time}]
  if (!Array.isArray(shifts)) return res.status(400).json({ error: 'shifts must be an array' });

  await db.query(`DELETE FROM shifts WHERE provider_id = $1`, [req.user.providerId]);
  for (const s of shifts) {
    if (s.day_of_week && s.start_time && s.end_time) {
      await db.query(
        `INSERT INTO shifts (provider_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)`,
        [req.user.providerId, s.day_of_week, s.start_time, s.end_time]
      );
    }
  }
  res.json({ success: true });
});

// GET /provider/patients — unique patients from appointments
router.get('/patients', requireProvider, async (req, res) => {
  const { rows } = await db.query(`
    SELECT DISTINCT pt.*,
      json_agg(DISTINCT jsonb_build_object('id', pp.id, 'text', pp.text, 'doctor', pp.doctor_name)) FILTER (WHERE pp.id IS NOT NULL) AS prescriptions,
      json_agg(DISTINCT jsonb_build_object('id', ptp.id, 'diagnosis', ptp.diagnosis, 'text', ptp.text, 'date', ptp.date, 'status', ptp.status)) FILTER (WHERE ptp.id IS NOT NULL) AS treatment_plans,
      (SELECT COUNT(*) FROM appointments a2 WHERE a2.patient_id = pt.id AND a2.provider_id = $1 AND a2.status = 'Finished') AS sessions_with_provider
    FROM appointments a
    JOIN patients pt ON pt.id = a.patient_id
    LEFT JOIN patient_prescriptions pp ON pp.patient_id = pt.id
    LEFT JOIN patient_treatment_plans ptp ON ptp.patient_id = pt.id
    WHERE a.provider_id = $1
    GROUP BY pt.id
    ORDER BY pt.name
  `, [req.user.providerId]);
  res.json(rows);
});

// GET /provider/wallet
router.get('/wallet', requireProvider, async (req, res) => {
  const provider = (await db.query(`SELECT wallet_balance FROM providers WHERE id = $1`, [req.user.providerId])).rows[0];
  const txns = (await db.query(
    `SELECT * FROM transactions WHERE provider_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.providerId]
  )).rows;
  res.json({ balance: provider.wallet_balance, transactions: txns });
});

// GET /provider/notifications
router.get('/notifications', requireProvider, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.sub]
  );
  res.json(rows);
});

// POST /provider/notifications/:id/read
router.post('/notifications/:id/read', requireProvider, async (req, res) => {
  // Scope update to the authenticated provider's user_id to prevent IDOR
  await db.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.sub]
  );
  res.json({ success: true });
});

module.exports = router;

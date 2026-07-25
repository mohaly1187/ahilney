const router = require('express').Router();
const db = require('../db');

// GET /regions
router.get('/regions', async (req, res) => {
  const regions = (await db.query(`SELECT * FROM regions ORDER BY name`)).rows;
  const subs = (await db.query(`SELECT * FROM subregions ORDER BY name`)).rows;
  const result = regions.map(r => ({
    ...r,
    subregions: subs.filter(s => s.region_id === r.id),
  }));
  res.json(result);
});

// GET /services
router.get('/services', (req, res) => {
  res.json([
    { id: 'SRV-01', name: 'Physical Therapy (PT)', supportsHome: true, supportsCenter: true, icon: '🧘‍♂️', category: 'Therapy' },
    { id: 'SRV-02', name: 'Post-Injury Rehabilitation', supportsHome: true, supportsCenter: true, icon: '🩹', category: 'Rehab' },
    { id: 'SRV-03', name: 'Elderly Rehabilitation', supportsHome: true, supportsCenter: true, icon: '👵', category: 'Geriatric' },
    { id: 'SRV-04', name: 'Special Needs Rehabilitation', supportsHome: true, supportsCenter: true, icon: '♿', category: 'Specialized' },
    { id: 'SRV-05', name: 'Pediatric Rehabilitation', supportsHome: true, supportsCenter: true, icon: '👶', category: 'Pediatrics' },
    { id: 'SRV-06', name: 'Nutritional Rehabilitation', supportsHome: true, supportsCenter: true, icon: '🥗', category: 'Wellness' },
    { id: 'SRV-07', name: 'Manual Therapy (Chiropractic / Osteopathy)', supportsHome: true, supportsCenter: true, icon: '👐', category: 'Therapy' },
    { id: 'SRV-08', name: 'Basic Recovery & Wellness Services', supportsHome: true, supportsCenter: true, icon: '⚡', category: 'Wellness' },
    { id: 'SRV-09', name: 'Hydrotherapy', supportsHome: false, supportsCenter: true, icon: '🏊‍♂️', category: 'Center Exclusive', note: 'Rehab Center Only' },
  ]);
});

// GET /providers — public list for patient booking (RS type, filtered by region)
router.get('/providers', async (req, res) => {
  const { region, type } = req.query;
  let q = `
    SELECT p.*, array_agg(DISTINCT pr.region_name) AS regions_covered,
           array_agg(DISTINCT pd.name || '::' || pd.status) FILTER (WHERE pd.id IS NOT NULL) AS documents
    FROM providers p
    LEFT JOIN provider_regions pr ON pr.provider_id = p.id
    LEFT JOIN provider_documents pd ON pd.provider_id = p.id
    WHERE p.status = 'active'
  `;
  const params = [];
  if (type) { params.push(type); q += ` AND p.type = $${params.length}`; }
  if (region) { params.push(region); q += ` AND EXISTS (SELECT 1 FROM provider_regions r2 WHERE r2.provider_id = p.id AND r2.region_name = $${params.length})`; }
  q += ` GROUP BY p.id ORDER BY p.rating DESC`;
  const { rows } = await db.query(q, params);
  res.json(rows);
});

// GET /providers/:id
router.get('/providers/:id', async (req, res) => {
  const { rows } = await db.query(`
    SELECT p.*, array_agg(DISTINCT pr.region_name) AS regions_covered,
           json_agg(DISTINCT jsonb_build_object('day', s.day_of_week, 'start', s.start_time, 'end', s.end_time)) FILTER (WHERE s.id IS NOT NULL) AS shifts
    FROM providers p
    LEFT JOIN provider_regions pr ON pr.provider_id = p.id
    LEFT JOIN shifts s ON s.provider_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Provider not found' });
  res.json(rows[0]);
});

// POST /promos/validate
router.post('/promos/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  const { rows } = await db.query(
    `SELECT * FROM promo_codes WHERE code = $1 AND status = 'active' AND expiry_date >= CURRENT_DATE AND uses < max_uses`,
    [code.toUpperCase()]
  );
  if (!rows.length) return res.status(404).json({ error: 'Invalid or expired promo code' });
  res.json({ valid: true, discount: rows[0].discount_percent, code: rows[0].code });
});

module.exports = router;

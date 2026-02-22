/**
 * GuauAI — Rutas de administración (solo superadmin)
 * Acceso con ADMIN_SECRET en header X-Admin-Key
 */
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'No autorizado' });
  next();
}

/** GET /api/admin/stats — Métricas globales */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [users, dogs, analyses, topEmotions, topBreeds, dailyActive] = await Promise.all([
      pool.query('SELECT COUNT(*) as n, COUNT(CASE WHEN created_at > NOW()-INTERVAL\'7 days\' THEN 1 END) as new_7d FROM users'),
      pool.query('SELECT COUNT(*) as n FROM dogs'),
      pool.query(`SELECT COUNT(*) as total,
        COUNT(CASE WHEN created_at > NOW()-INTERVAL'24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at > NOW()-INTERVAL'7 days'  THEN 1 END) as last_7d,
        AVG(confianza) as avg_confidence
        FROM analyses`),
      pool.query(`SELECT estado_emocional, COUNT(*) as n FROM analyses
        WHERE created_at > NOW()-INTERVAL'30 days'
        GROUP BY estado_emocional ORDER BY n DESC LIMIT 8`),
      pool.query(`SELECT d.breed, COUNT(a.id) as n FROM analyses a
        JOIN dogs d ON d.id = a.dog_id WHERE d.breed IS NOT NULL
        AND a.created_at > NOW()-INTERVAL'30 days'
        GROUP BY d.breed ORDER BY n DESC LIMIT 10`),
      pool.query(`SELECT DATE_TRUNC('day', created_at) as day, COUNT(DISTINCT user_id) as dau
        FROM analyses WHERE created_at > NOW()-INTERVAL'30 days'
        GROUP BY day ORDER BY day`),
    ]);
    res.json({
      users: users.rows[0],
      dogs: dogs.rows[0],
      analyses: analyses.rows[0],
      top_emotions: topEmotions.rows,
      top_breeds: topBreeds.rows,
      daily_active: dailyActive.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/** GET /api/admin/users — Lista de usuarios */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.email, u.name, u.created_at,
        COUNT(DISTINCT d.id) as dogs, COUNT(DISTINCT a.id) as analyses,
        MAX(a.created_at) as last_active
       FROM users u
       LEFT JOIN dogs d ON d.user_id = u.id
       LEFT JOIN analyses a ON a.user_id = u.id
       GROUP BY u.id ORDER BY u.created_at DESC LIMIT 100`
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

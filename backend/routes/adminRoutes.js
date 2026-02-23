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
    const [users, dogs, analyses, analysesToday, analyses7d, dauToday, topEmotions, topBreeds, dailyActivity] = await Promise.all([
      pool.query('SELECT COUNT(*) as n FROM users'),
      pool.query('SELECT COUNT(*) as n FROM dogs'),
      pool.query('SELECT COUNT(*) as n FROM analyses'),
      pool.query("SELECT COUNT(*) as n FROM analyses WHERE created_at > NOW() - INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(*) as n FROM analyses WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query("SELECT COUNT(DISTINCT user_id) as n FROM analyses WHERE created_at > NOW() - INTERVAL '24 hours'"),
      pool.query(`SELECT estado_emocional, COUNT(*) as n FROM analyses
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY estado_emocional ORDER BY n DESC LIMIT 8`),
      pool.query(`SELECT COALESCE(d.breed, 'Sin raza') as breed, COUNT(a.id) as n
        FROM analyses a JOIN dogs d ON d.id = a.dog_id
        WHERE a.created_at > NOW() - INTERVAL '30 days'
        GROUP BY d.breed ORDER BY n DESC LIMIT 8`),
      pool.query(`SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as n
        FROM analyses WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day`),
    ]);

    res.json({
      users: parseInt(users.rows[0].n),
      dogs: parseInt(dogs.rows[0].n),
      analyses: parseInt(analyses.rows[0].n),
      analyses_today: parseInt(analysesToday.rows[0].n),
      analyses_7d: parseInt(analyses7d.rows[0].n),
      dau: parseInt(dauToday.rows[0].n),
      top_emotions: topEmotions.rows,
      top_breeds: topBreeds.rows,
      daily_activity: dailyActivity.rows,
    });
  } catch (e) {
    console.error('GET /api/admin/stats error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/admin/users — Lista de usuarios */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.email, u.name, u.created_at,
        COUNT(DISTINCT d.id) as dog_count,
        COUNT(DISTINCT a.id) as analysis_count,
        MAX(a.created_at) as last_active
       FROM users u
       LEFT JOIN dogs d ON d.user_id = u.id
       LEFT JOIN analyses a ON a.user_id = u.id
       GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /api/admin/users error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

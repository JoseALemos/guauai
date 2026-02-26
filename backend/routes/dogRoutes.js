const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

/** GET /api/dogs — Mis perros */
router.get('/', verifyToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.*, s.total_analyses, s.analyses_30d, s.emotion_more_common, s.avg_confidence, s.last_analysis
       FROM dogs d LEFT JOIN dog_stats s ON s.dog_id = d.id
       WHERE d.user_id=$1 ORDER BY d.created_at DESC`,
      [req.user.userId]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /api/dogs error:', e.message);
    res.status(500).json({ error: 'Error al obtener perros' });
  }
});

/** POST /api/dogs — Crear perro */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, breed, birth_date, weight_kg, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const r = await pool.query(
      'INSERT INTO dogs (user_id, name, breed, birth_date, weight_kg, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.userId, name, breed || null, birth_date || null, weight_kg ? parseFloat(weight_kg) : null, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('POST /api/dogs error:', e.message);
    res.status(500).json({ error: 'Error al crear perro' });
  }
});

/** PATCH /api/dogs/:id — Actualizar */
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { name, breed, birth_date, weight_kg, notes, photo_url } = req.body;
    // Validar tamaño de foto (max 300KB en base64)
    if (photo_url && photo_url.length > 400000) {
      return res.status(400).json({ error: 'Foto demasiado grande (máx 300KB)' });
    }
    const r = await pool.query(
      `UPDATE dogs SET name=COALESCE($1,name), breed=COALESCE($2,breed),
       birth_date=COALESCE($3,birth_date), weight_kg=COALESCE($4,weight_kg),
       notes=COALESCE($5,notes), photo_url=COALESCE($6,photo_url), updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, breed, birth_date, weight_kg ? parseFloat(weight_kg) : null, notes, photo_url || null, req.params.id, req.user.userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Perro no encontrado' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('PATCH /api/dogs/:id error:', e.message);
    res.status(500).json({ error: 'Error al actualizar perro' });
  }
});

/** DELETE /api/dogs/:id */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM dogs WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Perro no encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/dogs/:id error:', e.message);
    res.status(500).json({ error: 'Error al eliminar perro' });
  }
});

/** GET /api/dogs/:id/history — Historial de análisis */
router.get('/:id/history', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const r = await pool.query(
      `SELECT * FROM analyses WHERE dog_id=$1 AND user_id=$2
       ORDER BY created_at DESC LIMIT $3`,
      [req.params.id, req.user.userId, limit]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /api/dogs/:id/history error:', e.message);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

/** GET /api/dogs/:id/stats — Estadísticas */
router.get('/:id/stats', verifyToken, async (req, res) => {
  try {
    const [statsR, emotionR, timeR] = await Promise.all([
      pool.query('SELECT * FROM dog_stats WHERE dog_id=$1 AND user_id=$2', [req.params.id, req.user.userId]),
      pool.query(
        `SELECT estado_emocional, COUNT(*) as n
         FROM analyses WHERE dog_id=$1 AND user_id=$2 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY estado_emocional ORDER BY n DESC`,
        [req.params.id, req.user.userId]
      ),
      pool.query(
        `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as n
         FROM analyses WHERE dog_id=$1 AND user_id=$2 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY day ORDER BY day`,
        [req.params.id, req.user.userId]
      )
    ]);
    res.json({
      summary: statsR.rows[0] || {},
      emotions: emotionR.rows,
      timeline: timeR.rows
    });
  } catch (e) {
    console.error('GET /api/dogs/:id/stats error:', e.message);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

/** GET /api/dogs/analyses — Todos los análisis del usuario (con nombre de perro) */
router.get('/analyses', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const dogId = req.query.dog_id || null;
    const params = [req.user.userId, limit];
    const dogFilter = dogId ? 'AND a.dog_id = $3' : '';
    if (dogId) params.push(dogId);
    const r = await pool.query(
      `SELECT a.*, d.name AS dog_name
       FROM analyses a
       LEFT JOIN dogs d ON d.id = a.dog_id
       WHERE a.user_id = $1 ${dogFilter}
       ORDER BY a.created_at DESC LIMIT $2`,
      params
    );
    res.json(r.rows);
  } catch (e) {
    console.error('GET /api/dogs/analyses error:', e.message);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

module.exports = router;

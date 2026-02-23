/**
 * GuauAI — Rutas de dashboard veterinario/entrenador
 * Token determinista: HMAC-SHA256(userId, JWT_SECRET) → no requiere columna extra en DB
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

function makeVetToken(userId) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'guauai_secret')
    .update(String(userId))
    .digest('hex')
    .slice(0, 32);
}

/** GET /api/vet/my-token — Devuelve el token del usuario autenticado */
router.get('/my-token', verifyToken, (req, res) => {
  const token = makeVetToken(req.user.userId);
  const url = `${process.env.APP_URL || ''}/vet/${token}`;
  res.json({ token, url });
});

/** GET /api/vet/:token — Vista pública para vet/entrenador (sin datos privados) */
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar el usuario cuyo token HMAC coincida
    // Iteramos en lotes pequeños (usuarios totales bajos en fase inicial)
    const usersR = await pool.query('SELECT id, name FROM users ORDER BY created_at DESC LIMIT 500');
    const owner = usersR.rows.find(u => makeVetToken(u.id) === token);
    if (!owner) return res.status(404).json({ error: 'Enlace inválido o expirado' });

    // Perros del usuario (sin datos sensibles)
    const dogsR = await pool.query(
      `SELECT d.id, d.name, d.breed, d.birth_date, d.weight_kg, d.photo_url,
              s.total_analyses, s.analyses_30d, s.emotion_more_common, s.avg_confidence, s.last_analysis
       FROM dogs d LEFT JOIN dog_stats s ON s.dog_id = d.id
       WHERE d.user_id = $1 ORDER BY d.created_at DESC`,
      [owner.id]
    );

    // Últimos 50 análisis del usuario (sin datos privados del dueño)
    const analysesR = await pool.query(
      `SELECT a.id, a.dog_id, a.estado_emocional, a.necesidad, a.intensidad,
              a.confianza, a.mensaje_interpretado, a.recomendacion, a.tipo_vocalizacion,
              a.notas_tecnicas, a.created_at, d.name as dog_name, d.breed as dog_breed
       FROM analyses a JOIN dogs d ON d.id = a.dog_id
       WHERE a.user_id = $1 ORDER BY a.created_at DESC LIMIT 100`,
      [owner.id]
    );

    // Resumen emocional últimos 30 días
    const emotionR = await pool.query(
      `SELECT estado_emocional, COUNT(*) as n
       FROM analyses WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY estado_emocional ORDER BY n DESC`,
      [owner.id]
    );

    res.json({
      owner_name: owner.name || 'Dueño',
      dogs: dogsR.rows,
      analyses: analysesR.rows,
      emotions_30d: emotionR.rows,
    });
  } catch (e) {
    console.error('GET /api/vet/:token error:', e.message);
    res.status(500).json({ error: 'Error al cargar datos' });
  }
});

module.exports = router;
module.exports.makeVetToken = makeVetToken;

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/** GET /api/share/:id — Análisis público compartible */
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT a.*, d.name as dog_name, d.breed as dog_breed
       FROM analyses a LEFT JOIN dogs d ON d.id = a.dog_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Análisis no encontrado' });
    // No devolver user_id por privacidad
    const { user_id, ...safe } = r.rows[0];
    res.json(safe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

/** POST /api/auth/register */
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  if (password.length < 6) return res.status(400).json({ error: 'Password mínimo 6 caracteres' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1,$2,$3) RETURNING id, email, name, created_at',
      [email.toLowerCase().trim(), hash, name || null]
    );
    const user = r.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

  try {
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/auth/me */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, email, name, created_at FROM users WHERE id=$1', [req.user.userId]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

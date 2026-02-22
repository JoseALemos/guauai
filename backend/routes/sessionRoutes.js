const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Historial en memoria por ahora (fase 1 — sin DB)
const sessions = new Map();

router.post('/new', (req, res) => {
  const { dog_name, dog_breed } = req.body;
  const id = uuidv4();
  sessions.set(id, {
    id,
    dog_name: dog_name || 'Mi perro',
    dog_breed: dog_breed || null,
    created_at: new Date().toISOString(),
    analyses: []
  });
  res.json({ session_id: id, dog_name, dog_breed });
});

router.get('/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json(session);
});

router.post('/:id/log', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
  session.analyses.push({ ...req.body, logged_at: new Date().toISOString() });
  res.json({ ok: true, total: session.analyses.length });
});

module.exports = router;

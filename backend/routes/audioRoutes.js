const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { analyzeDogAudio } = require('../services/dogAnalyzer');
const { optionalToken } = require('../middleware/auth');

// Guardar análisis en DB si hay usuario autenticado
async function saveAnalysis(userId, dogId, data) {
  if (!userId) return;
  try {
    const pool = require('../db/pool');
    const a = data.analysis;
    await pool.query(
      `INSERT INTO analyses (user_id, dog_id, estado_emocional, necesidad, intensidad, confianza,
       mensaje_interpretado, recomendacion, tipo_vocalizacion, notas_tecnicas, duration_ms, model_used, tokens_used, device)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [userId, dogId || null, a.estado_emocional, a.necesidad, a.intensidad, a.confianza,
       a.mensaje_interpretado, a.recomendacion_dueno, a.tipo_vocalizacion, a.notas_tecnicas,
       data.duration_ms, data.model, data.tokens_used, 'web']
    );
  } catch (e) {
    console.error('[DB] Error guardando análisis:', e.message);
  }
}

// Storage temporal para audios
const upload = multer({
  dest: path.join(__dirname, '../../tmp/'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máx
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Solo se aceptan archivos de audio'));
  }
});

/**
 * POST /api/audio/analyze
 * Sube y analiza un audio de perro
 * Body: multipart/form-data con campo "audio"
 * Opcional: { dog_name, dog_breed, session_id }
 */
router.post('/analyze', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Audio requerido' });

  const startTime = Date.now();

  try {
    const mimeType = req.file.mimetype || 'audio/webm';
    const result = await analyzeDogAudio(req.file.path, mimeType);

    const response = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      dog_name: req.body.dog_name || null,
      dog_breed: req.body.dog_breed || null,
      session_id: req.body.session_id || null,
      file_size_kb: Math.round(req.file.size / 1024),
      ...result
    };

    res.json(response);
  } catch (err) {
    console.error('[DogAnalyzer] Error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Limpiar archivo temporal
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

/**
 * POST /api/audio/analyze-base64
 * Analiza audio enviado como base64 (para web/mobile sin multipart)
 * Body: { audio_base64, mime_type, dog_name?, dog_breed? }
 */
router.post('/analyze-base64', express.json({ limit: '15mb' }), optionalToken, async (req, res) => {
  const { audio_base64, mime_type = 'audio/webm', dog_name, dog_breed, dog_id, lang = 'es' } = req.body;
  if (!audio_base64) return res.status(400).json({ error: 'audio_base64 requerido' });

  const tmpPath = path.join(__dirname, '../../tmp/', `${uuidv4()}.audio`);
  const startTime = Date.now();

  try {
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, Buffer.from(audio_base64, 'base64'));

    const result = await analyzeDogAudio(tmpPath, mime_type, lang, dog_breed || null);
    const response = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      dog_name: dog_name || null,
      dog_breed: dog_breed || null,
      ...result
    };

    // Guardar en DB + detectar alertas si hay sesión autenticada
    let alert = null;
    if (req.user?.userId) {
      await saveAnalysis(req.user.userId, dog_id || null, response);
      try {
        const { checkForAlerts } = require('../services/alertService');
        alert = await checkForAlerts(req.user.userId, dog_id || null, result.analysis || {});

        // Email si alerta crítica
        if (alert?.level === 'high') {
          const pool = require('../db/pool');
          const userRow = await pool.query('SELECT email FROM users WHERE id=$1', [req.user.userId]);
          const { sendBehaviorAlert } = require('../services/emailAlertService');
          sendBehaviorAlert({
            toEmail: userRow.rows[0]?.email,
            dogName: dog_name || 'Tu perro',
            emotion: result.analysis?.estado_emocional,
            message: result.analysis?.mensaje_interpretado,
            recommendation: result.analysis?.recomendacion_dueno,
            shareUrl: `${process.env.APP_URL || 'https://guauai.ainertia.io'}/share/${response.id}`,
          }).catch(() => {});
        }
      } catch {}
    }

    res.json({ ...response, alert });
  } catch (err) {
    console.error('[DogAnalyzer] Error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;

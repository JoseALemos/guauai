const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { analyzeDogAudio } = require('../services/dogAnalyzer');

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
router.post('/analyze-base64', express.json({ limit: '15mb' }), async (req, res) => {
  const { audio_base64, mime_type = 'audio/webm', dog_name, dog_breed } = req.body;
  if (!audio_base64) return res.status(400).json({ error: 'audio_base64 requerido' });

  const tmpPath = path.join(__dirname, '../../tmp/', `${uuidv4()}.audio`);
  const startTime = Date.now();

  try {
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, Buffer.from(audio_base64, 'base64'));

    const result = await analyzeDogAudio(tmpPath, mime_type);

    res.json({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      dog_name: dog_name || null,
      dog_breed: dog_breed || null,
      ...result
    });
  } catch (err) {
    console.error('[DogAnalyzer] Error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;

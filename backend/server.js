require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { error: 'Demasiadas peticiones. Intenta en 15 minutos.' } });
const audioLimiter = rateLimit({ windowMs: 60 * 1000, max: 6, message: { error: 'Máximo 6 análisis por minuto.' } });
app.use('/api/', apiLimiter);
app.use('/api/audio/', audioLimiter);

// Servir frontend estático (en Docker: /app/frontend/, en dev: ../frontend/)
const frontendPath = path.join(__dirname, 'frontend');
const frontendFallback = path.join(__dirname, '../frontend');
const fs = require('fs');
const staticDir = fs.existsSync(frontendPath) ? frontendPath : frontendFallback;
app.use(express.static(staticDir));

// API routes
app.use('/api/audio', require('./routes/audioRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dogs', require('./routes/dogRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/vet', require('./routes/vetRoutes'));

// Ruta de alertas inline
app.get('/api/alerts', require('./middleware/auth').verifyToken, async (req, res) => {
  try {
    const { getRecentAlerts } = require('./services/alertService');
    res.json(await getRecentAlerts(req.user.userId));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Health check
app.get('/api', (req, res) => res.json({ status: 'GuauAI API online', version: '1.0.0' }));

// Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(staticDir, 'dashboard.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(staticDir, 'admin.html'));
});

// Share — análisis públicos
app.get('/share/:id', (req, res) => {
  res.sendFile(path.join(staticDir, 'share.html'));
});

// Vet dashboard — informe veterinario/entrenador
app.get('/vet/:token', (req, res) => {
  res.sendFile(path.join(staticDir, 'vet.html'));
});

// Fallback al frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐾 DogSpeak API corriendo en http://localhost:${PORT}`);
});

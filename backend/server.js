require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// Health check
app.get('/api', (req, res) => res.json({ status: 'DogSpeak API online', version: '0.1.0' }));

// Fallback al frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐾 DogSpeak API corriendo en http://localhost:${PORT}`);
});

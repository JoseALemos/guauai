-- GuauAI — Schema PostgreSQL
-- Ejecutar una sola vez en la instancia de Railway

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- bcrypt hash
  name        VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Perfiles de perro
CREATE TABLE IF NOT EXISTS dogs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  breed       VARCHAR(100),
  birth_date  DATE,
  weight_kg   DECIMAL(5,2),
  photo_url   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Análisis de vocalizaciones
CREATE TABLE IF NOT EXISTS analyses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id              UUID REFERENCES dogs(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Resultado del análisis
  estado_emocional    VARCHAR(50),
  necesidad           VARCHAR(50),
  intensidad          VARCHAR(20),
  confianza           DECIMAL(4,3),
  mensaje_interpretado TEXT,
  recomendacion       TEXT,
  tipo_vocalizacion   VARCHAR(50),
  notas_tecnicas      TEXT,
  -- Metadatos
  duration_ms         INTEGER,
  model_used          VARCHAR(100),
  tokens_used         INTEGER,
  device              VARCHAR(50) DEFAULT 'web', -- web | collar | mobile
  -- Acelerómetro (si viene del collar)
  activity_level      DECIMAL(4,3),
  -- Timestamp
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_analyses_dog_id    ON analyses(dog_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id   ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created   ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_emotion   ON analyses(estado_emocional);
CREATE INDEX IF NOT EXISTS idx_dogs_user_id       ON dogs(user_id);

-- Vista: estadísticas por perro (últimos 30 días)
CREATE OR REPLACE VIEW dog_stats AS
SELECT
  d.id AS dog_id,
  d.name AS dog_name,
  d.user_id,
  COUNT(a.id) AS total_analyses,
  COUNT(a.id) FILTER (WHERE a.created_at > NOW() - INTERVAL '30 days') AS analyses_30d,
  MODE() WITHIN GROUP (ORDER BY a.estado_emocional) AS emotion_more_common,
  AVG(a.confianza) AS avg_confidence,
  MAX(a.created_at) AS last_analysis
FROM dogs d
LEFT JOIN analyses a ON a.dog_id = d.id
GROUP BY d.id, d.name, d.user_id;

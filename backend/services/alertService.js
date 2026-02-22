/**
 * GuauAI — Sistema de detección de alertas de comportamiento
 * Analiza patrones en el historial y detecta anomalías
 */

const pool = require('../db/pool');

// Emociones que requieren atención
const ALERT_EMOTIONS = ['dolorido', 'asustado', 'agresivo', 'painful', 'scared', 'aggressive'];
const CONCERN_EMOTIONS = ['ansioso', 'frustrado', 'anxious', 'frustrated'];

/**
 * Evalúa si un nuevo análisis debe generar una alerta
 * @returns {Object|null} Alerta si aplica, null si todo normal
 */
async function checkForAlerts(userId, dogId, analysis) {
  if (!userId || !dogId || !pool) return null;

  try {
    const emotion = analysis.estado_emocional?.toLowerCase();

    // Alerta inmediata: dolor o miedo intenso
    if (ALERT_EMOTIONS.includes(emotion) && analysis.intensidad === 'alta') {
      return {
        level: 'high',
        type: 'immediate_concern',
        message: `⚠️ ${analysis.estado_emocional?.toUpperCase()} con intensidad alta detectado`,
        recommendation: analysis.recomendacion_dueno
      };
    }

    // Alerta por patrón: >3 emociones negativas en 1 hora
    const r = await pool.query(
      `SELECT COUNT(*) as n FROM analyses
       WHERE dog_id=$1 AND user_id=$2
       AND estado_emocional = ANY($3)
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [dogId, userId, ALERT_EMOTIONS.concat(CONCERN_EMOTIONS)]
    );
    if (parseInt(r.rows[0].n) >= 3) {
      return {
        level: 'medium',
        type: 'repeated_stress',
        message: `😰 Tu perro ha mostrado señales de estrés repetidas en la última hora`,
        recommendation: 'Considera revisar el entorno. Busca fuentes de estrés como ruidos, cambios o malestar físico.'
      };
    }

    // Alerta por patrón: >5 análisis seguidos de ansiedad en 24h
    const r2 = await pool.query(
      `SELECT COUNT(*) as n FROM analyses
       WHERE dog_id=$1 AND user_id=$2
       AND estado_emocional ILIKE '%ansi%'
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [dogId, userId]
    );
    if (parseInt(r2.rows[0].n) >= 5) {
      return {
        level: 'medium',
        type: 'chronic_anxiety',
        message: `😟 Tu perro ha mostrado ansiedad 5+ veces en las últimas 24 horas`,
        recommendation: 'Patrón de ansiedad elevado. Consulta con un veterinario o etólogo canino.'
      };
    }

    return null;
  } catch (e) {
    console.error('[AlertService] Error:', e.message);
    return null;
  }
}

/**
 * Obtiene alertas recientes para un usuario
 */
async function getRecentAlerts(userId) {
  try {
    const r = await pool.query(
      `SELECT a.*, d.name as dog_name
       FROM analyses a JOIN dogs d ON d.id = a.dog_id
       WHERE a.user_id=$1
       AND a.estado_emocional = ANY($2)
       AND a.intensidad = 'alta'
       AND a.created_at > NOW() - INTERVAL '24 hours'
       ORDER BY a.created_at DESC LIMIT 10`,
      [userId, ALERT_EMOTIONS]
    );
    return r.rows;
  } catch { return []; }
}

module.exports = { checkForAlerts, getRecentAlerts };

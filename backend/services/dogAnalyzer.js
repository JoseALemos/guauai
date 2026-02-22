/**
 * dogAnalyzer.js
 * Analiza audio de perros usando GPT-4o con entrada de audio nativa.
 * Clasifica: estado emocional, necesidad, intensidad y mensaje interpretado.
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres un experto en etología canina y comunicación animal.
Tu misión es analizar audio de perros y proporcionar una interpretación científicamente fundamentada.

Cuando recibas un audio de un perro, analiza:
1. El tipo de vocalización (ladrido, gemido, gruñido, aullido, quejido, jadeo, silencio, etc.)
2. El patrón rítmico y la frecuencia (rápido/lento, agudo/grave, continuo/intermitente)
3. La intensidad y urgencia del sonido

Responde SIEMPRE con un JSON válido con esta estructura exacta:
{
  "estado_emocional": "ansioso|tranquilo|excitado|asustado|alerta|juguetón|dolorido|agresivo|frustrado|feliz",
  "necesidad": "atención|juego|comida|agua|paseo|alarma|dolor|miedo|territorial|sin_necesidad_clara",
  "intensidad": "alta|media|baja",
  "confianza": 0.0-1.0,
  "mensaje_interpretado": "Frase corta en primera persona como si hablaras por el perro (máx 20 palabras)",
  "recomendacion_dueno": "Qué debe hacer el dueño ahora mismo (máx 25 palabras)",
  "tipo_vocalizacion": "ladrido|gemido|gruñido|aullido|quejido|jadeo|silencio|mixto",
  "notas_tecnicas": "Observación técnica breve sobre el sonido analizado"
}

Si el audio NO contiene un perro, devuelve:
{
  "error": "no_dog_detected",
  "mensaje": "No se detectó audio de perro en la grabación"
}`;

/**
 * Analiza un archivo de audio de perro
 * @param {string} audioFilePath - Ruta al archivo de audio (webm/mp4/wav/ogg)
 * @param {string} mimeType - MIME type del audio
 * @returns {Object} Análisis completo
 */
async function analyzeDogAudio(audioFilePath, mimeType = 'audio/webm') {
  const audioBuffer = fs.readFileSync(audioFilePath);
  const base64Audio = audioBuffer.toString('base64');

  // Determinar formato para la API
  const formatMap = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'mp4',
    'audio/m4a': 'mp4',
  };
  const audioFormat = formatMap[mimeType] || 'webm';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-audio-preview',
    modalities: ['text'],
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analiza este audio de un perro y devuelve el JSON de análisis:'
          },
          {
            type: 'input_audio',
            input_audio: {
              data: base64Audio,
              format: audioFormat
            }
          }
        ]
      }
    ],
    max_tokens: 500
  });

  const content = response.choices[0].message.content.trim();

  // Extraer JSON de la respuesta (puede venir entre ```json)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Respuesta de IA no contiene JSON válido');

  return {
    analysis: JSON.parse(jsonMatch[0]),
    tokens_used: response.usage?.total_tokens || 0,
    model: response.model
  };
}

module.exports = { analyzeDogAudio };

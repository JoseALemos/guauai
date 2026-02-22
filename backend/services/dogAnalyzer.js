/**
 * dogAnalyzer.js
 * Analiza audio de perros usando GPT-4o con entrada de audio nativa.
 * Clasifica: estado emocional, necesidad, intensidad y mensaje interpretado.
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPTS = {
  es: `Eres un experto en etología canina. Analiza el audio y responde SOLO con JSON válido:
{
  "estado_emocional": "ansioso|tranquilo|excitado|asustado|alerta|juguetón|dolorido|agresivo|frustrado|feliz",
  "necesidad": "atención|juego|comida|agua|paseo|alarma|dolor|miedo|territorial|sin_necesidad_clara",
  "intensidad": "alta|media|baja",
  "confianza": 0.0-1.0,
  "mensaje_interpretado": "Frase en primera persona del perro (máx 20 palabras, en español)",
  "recomendacion_dueno": "Qué hacer ahora (máx 25 palabras, en español)",
  "tipo_vocalizacion": "ladrido|gemido|gruñido|aullido|quejido|jadeo|silencio|mixto",
  "notas_tecnicas": "Observación técnica breve"
}
Si no hay perro: {"error":"no_dog_detected","mensaje":"No se detectó audio de perro"}`,

  en: `You are an expert in canine ethology. Analyze the audio and respond ONLY with valid JSON:
{
  "estado_emocional": "anxious|calm|excited|scared|alert|playful|painful|aggressive|frustrated|happy",
  "necesidad": "attention|play|food|water|walk|alarm|pain|fear|territorial|unclear",
  "intensidad": "high|medium|low",
  "confianza": 0.0-1.0,
  "mensaje_interpretado": "First person message from the dog (max 20 words, in English)",
  "recomendacion_dueno": "What to do now (max 25 words, in English)",
  "tipo_vocalizacion": "bark|whine|growl|howl|yelp|panting|silence|mixed",
  "notas_tecnicas": "Brief technical observation"
}
If no dog: {"error":"no_dog_detected","mensaje":"No dog audio detected"}`,

  de: `Du bist ein Experte für Hundeverhalten. Analysiere das Audio und antworte NUR mit gültigem JSON:
{
  "estado_emocional": "ängstlich|ruhig|aufgeregt|verängstigt|wachsam|verspielt|schmerzend|aggressiv|frustriert|glücklich",
  "necesidad": "aufmerksamkeit|spielen|futter|wasser|spaziergang|alarm|schmerz|angst|territorial|unklar",
  "intensidad": "hoch|mittel|niedrig",
  "confianza": 0.0-1.0,
  "mensaje_interpretado": "Nachricht aus Sicht des Hundes (max 20 Wörter, auf Deutsch)",
  "recomendacion_dueno": "Was jetzt tun (max 25 Wörter, auf Deutsch)",
  "tipo_vocalizacion": "bellen|winseln|knurren|heulen|quieken|hecheln|stille|gemischt",
  "notas_tecnicas": "Kurze technische Beobachtung"
}
Falls kein Hund: {"error":"no_dog_detected","mensaje":"Kein Hundeaudio erkannt"}`
};

const SYSTEM_PROMPT = SYSTEM_PROMPTS.es; // default

/**
 * Convierte audio a MP3 si no es ya wav/mp3 (OpenAI solo acepta wav y mp3)
 */
async function convertToMp3(inputPath) {
  const outputPath = inputPath + '.mp3';
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-ar 16000', '-ac 1', '-b:a 64k'])
      .toFormat('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Analiza un archivo de audio de perro
 * @param {string} audioFilePath - Ruta al archivo de audio (webm/mp4/wav/ogg)
 * @param {string} mimeType - MIME type del audio
 * @returns {Object} Análisis completo
 */
async function analyzeDogAudio(audioFilePath, mimeType = 'audio/webm', lang = 'es') {
  const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.es;
  // GPT-4o-audio solo acepta wav y mp3 — convertir si es necesario
  const nativeFormats = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
  let filePath = audioFilePath;
  let convertedPath = null;

  if (!nativeFormats.includes(mimeType)) {
    convertedPath = await convertToMp3(audioFilePath);
    filePath = convertedPath;
  }

  const audioBuffer = fs.readFileSync(filePath);
  const base64Audio = audioBuffer.toString('base64');
  const audioFormat = mimeType === 'audio/wav' ? 'wav' : 'mp3';

  // Limpiar archivo convertido
  if (convertedPath) fs.unlink(convertedPath, () => {});

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_AUDIO_MODEL || 'gpt-audio',
    modalities: ['text'],
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analiza este audio de un perro y devuelve el JSON de análisis:' },
          { type: 'input_audio', input_audio: { data: base64Audio, format: audioFormat } }
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

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
// Contexto específico por raza para mejorar la precisión del análisis
const BREED_HINTS = {
  'pastor aleman':    'Vocalizaciones profundas y guturales; muy expresivos; alta capacidad de comunicación.',
  'labrador':         'Tono medio-grave; raramente amenazante; muy sociables, sus gemidos suelen ser de atención.',
  'golden retriever': 'Vocalmente moderados; gemidos suaves = búsqueda de atención; rara vez agresivos.',
  'beagle':           'Bay/aullido característico al rastrear; vocalizan mucho; separación les genera ansiedad vocal.',
  'chihuahua':        'Vocalizaciones agudas; muy reactivos a estímulos; ladridos frecuentes ante desconocidos.',
  'bulldog':          'Jadean mucho por estructura; vocalizaciones cortas pero intensas; gruñidos suelen ser suaves.',
  'husky':            'Aúllan como comunicación normal; no siempre indica distress; "conversan" con sus dueños.',
  'poodle':           'Muy vocales; ladridos repetitivos = necesidad de estimulación o aburrimiento.',
  'yorkshire':        'Ladridos agudos persistentes; territorial; frecuente vocalización de alerta.',
  'dachshund':        'Ladridos desproporcionados; muy reactivos; instinto de caza elevado.',
  'boxer':            'Ladridos graves intermitentes; expresivos con gruñidos de juego; muy energéticos.',
  'rottweiler':       'Ladridos profundos de advertencia; gruñidos de juego vs agresión claramente diferenciables.',
  'dobermann':        'Vocalizaciones precisas; ladrido único = alerta real; raramente ladran sin motivo.',
  'border collie':    'Alta expresividad vocal; whine frecuente cuando no tienen tarea; muy inteligentes.',
  'australian shepherd': 'Vocalizan al arrear; ansiedad vocal ante falta de ejercicio; ladridos de aviso.',
  'schnauzer':        'Muy territoriales; ladrido agudo de alerta frecuente; atención a extraños.',
  'shih tzu':         'Ladridos cortos agudos; vocalizan para pedir atención; separación genera gemidos.',
  'cocker spaniel':   'Sensibles; gemidos frecuentes; ladridos al olfatear o rastrear.',
  'chow chow':        'Vocalmente reservados; cuando ladran es relevante; gruñidos de advertencia tempranos.',
  'shiba inu':        'Scream/chillido característico ante frustración; vocal cuando se les toca sin querer.',
  'akita inu':        'Silenciosos pero expresivos; ladridos = situación seria; gruñidos de alerta.',
  'samoyedo':         'Muy vocales y "conversadores"; aúllan frecuentemente por socialización.',
  'maltés':           'Ladridos agudos frecuentes; ansiedad por separación muy vocal.',
  'bichon frise':     'Vocalmente activos; ladridos de atención; raramente agresivos.',
  'pomerania':        'Ladridos agudos de alta frecuencia; alertas ante cualquier ruido; territoriales.',
  'gran danes':       'Ladrido profundo imponente; poco frecuente; grave y resonante.',
  'san bernardo':     'Ladridos graves poco frecuentes; gruñidos de juego habituales.',
  'jack russell':     'Muy vocales; energía alta; ladrido cuando rastrean o juegan.',
  'galgo':            'Silenciosos en general; aúllan raramente; gemidos suaves de atención.',
  'vizsla':           'Muy afectuosos vocalmente; whine frecuente por necesidad de contacto.',
  'setter irandes':   'Vocalmente expresivos; ladridos de excitación frecuentes.',
};

// 30+ razas con contexto etológico específico

function getBreedHint(breed) {
  if (!breed) return '';
  const lower = breed.toLowerCase();
  for (const [key, hint] of Object.entries(BREED_HINTS)) {
    if (lower.includes(key)) return `\nContexto de raza (${breed}): ${hint}`;
  }
  return `\nRaza: ${breed}`;
}

async function analyzeDogAudio(audioFilePath, mimeType = 'audio/webm', lang = 'es', breed = null, age = null, weight = null) {
  const basePrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.es;
  let context = getBreedHint(breed);
  if (age)    context += `\nEdad aproximada: ${age}`;
  if (weight) context += `\nPeso: ${weight} kg`;
  const systemPrompt = basePrompt + context;
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

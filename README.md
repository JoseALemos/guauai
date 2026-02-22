# 🐾 GuauAI — Talk to Your Dog

> **Open-source AI engine that understands dog vocalizations.**  
> Record your dog. Get instant interpretation. Know what they need.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with GPT-4o](https://img.shields.io/badge/Powered%20by-GPT--4o%20Audio-412991)](https://openai.com)
[![Made by Ainertia](https://img.shields.io/badge/Made%20by-Ainertia%20Capital-00C896)](https://ainertia.ai)

---

## ¿Qué es GuauAI?

GuauAI es un motor de análisis de audio canino que usa IA para interpretar en tiempo real lo que intenta comunicar tu perro.

Graba cualquier vocalización (ladrido, gemido, gruñido, aullido) y GuauAI analiza:

- 🧠 **Estado emocional** — ansioso, feliz, alerta, asustado, juguetón...
- 🎯 **Necesidad** — comida, juego, paseo, atención, dolor...
- 📊 **Intensidad y confianza** del análisis
- 💬 **Mensaje en primera persona** — lo que tu perro "diría" en palabras
- 💡 **Recomendación** — qué hacer tú ahora mismo

---

## Demo

👉 **[guauai.ainertia.ai](https://dogspeak-production.up.railway.app)** ← pruébalo ahora

---

## Tech Stack

| Capa | Tecnología |
|---|---|
| Audio Analysis | OpenAI GPT-4o Audio Preview |
| Backend | Node.js + Express |
| Frontend | HTML5 + Web Audio API (sin frameworks) |
| Deploy | Railway / Docker |

---

## Instalación rápida

```bash
git clone https://github.com/JoseALemos/guauai.git
cd guauai/backend
npm install
echo "OPENAI_API_KEY=sk-..." > .env
node server.js
```

Abre `http://localhost:3001` en el navegador.

---

## API

### `POST /api/audio/analyze-base64`

```json
{
  "audio_base64": "<base64 del audio>",
  "mime_type": "audio/webm",
  "dog_name": "Rex",
  "dog_breed": "Pastor Alemán"
}
```

**Respuesta:**
```json
{
  "analysis": {
    "estado_emocional": "excitado",
    "necesidad": "juego",
    "intensidad": "alta",
    "confianza": 0.89,
    "mensaje_interpretado": "¡Quiero jugar! ¿Por qué no me haces caso?",
    "recomendacion_dueno": "Tu perro necesita actividad. Un paseo corto o 10 minutos de juego lo calmarán.",
    "tipo_vocalizacion": "ladrido",
    "notas_tecnicas": "Ladrido repetitivo con frecuencia media-alta, patrón rítmico regular"
  }
}
```

---

## Roadmap

### Fase 1 — Motor IA (este repo ✅)
- [x] Análisis de audio en tiempo real
- [x] 10 estados emocionales detectables
- [x] API REST + Web App
- [ ] App móvil nativa (iOS / Android)
- [ ] Soporte multiidioma (EN, DE, FR)
- [ ] Dataset público de ladridos etiquetados

### Fase 2 — Hardware (próximamente)
- [ ] Collar inteligente con ESP32 + micrófono MEMS
- [ ] Acelerómetro para detección de movimiento
- [ ] Firmware open-source
- [ ] Integración BLE con la app

### Fase 3 — SaaS (Ainertia)
- [ ] Historial de comportamiento por mascota
- [ ] Dashboard para veterinarias y adiestradoras
- [ ] API comercial con subscripción

---

## Contribuir

Pull requests bienvenidos. Para cambios grandes, abre un Issue primero.

```
fork → branch → commit → PR
```

---

## Licencia

El motor de análisis (este repositorio) es **MIT**.  
La app móvil, firmware del collar y plataforma SaaS son propietarios de **Ainertia Capital S.L.**

---

<div align="center">
  <strong>Hecho con 🐾 por <a href="https://ainertia.ai">Ainertia Capital</a> — Córdoba, España</strong>
</div>

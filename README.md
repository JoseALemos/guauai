# 🐾 GuauAI — Talk to Your Dog

> **Open-source AI engine that understands dog vocalizations.**  
> Record your dog. Get instant interpretation. Know what they need.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://dogspeak-production.up.railway.app)
[![Built with GPT-4o Audio](https://img.shields.io/badge/Powered%20by-gpt--audio-412991)](https://openai.com)
[![Made by Ainertia](https://img.shields.io/badge/Made%20by-Ainertia%20Capital-00C896)](https://ainertia.ai)
[![Stars](https://img.shields.io/github/stars/JoseALemos/guauai?style=social)](https://github.com/JoseALemos/guauai)

---

## ¿Qué es GuauAI?

GuauAI es el primer motor open-source de análisis de vocalizaciones caninas con IA.

Graba cualquier sonido de tu perro — ladrido, gemido, gruñido, aullido — y GuauAI analiza en tiempo real:

| Qué detecta | Descripción |
|---|---|
| 🧠 Estado emocional | ansioso, feliz, alerta, asustado, juguetón, dolorido... |
| 🎯 Necesidad | comida, juego, paseo, atención, dolor, alarma... |
| 📊 Confianza del análisis | score 0-100% del modelo |
| 💬 Mensaje en primera persona | lo que tu perro "diría" en palabras |
| 💡 Recomendación | qué hacer tú ahora mismo |
| 🔊 Tipo de vocalización | ladrido, gemido, gruñido, aullido, jadeo... |

---

## 🚀 Demo en vivo

👉 **[guauai.ainertia.ai](https://dogspeak-production.up.railway.app)**

---

## ⚡ Instalación rápida

```bash
git clone https://github.com/JoseALemos/guauai.git
cd guauai/backend
npm install
cp .env.example .env        # añade tu OPENAI_API_KEY
node server.js
# → http://localhost:3001
```

---

## 📡 API Reference

### Analizar audio (base64)

```http
POST /api/audio/analyze-base64
Content-Type: application/json
```

```json
{
  "audio_base64": "<base64>",
  "mime_type": "audio/webm",
  "dog_name": "Rex",
  "dog_breed": "Pastor Alemán"
}
```

**Respuesta:**
```json
{
  "id": "uuid",
  "timestamp": "2026-02-22T22:00:00Z",
  "analysis": {
    "estado_emocional": "excitado",
    "necesidad": "juego",
    "intensidad": "alta",
    "confianza": 0.89,
    "mensaje_interpretado": "¡Quiero jugar! ¿Por qué no me haces caso?",
    "recomendacion_dueno": "Tu perro necesita actividad. 10 minutos de juego lo calmarán.",
    "tipo_vocalizacion": "ladrido",
    "notas_tecnicas": "Ladrido repetitivo, frecuencia media-alta, patrón rítmico"
  }
}
```

### Analizar archivo de audio (multipart)

```http
POST /api/audio/analyze
Content-Type: multipart/form-data

audio: <archivo>
dog_name: Rex (opcional)
dog_breed: Labrador (opcional)
```

---

## 🗺️ Roadmap

### ✅ Fase 1 — Motor IA (MVP)
- [x] Análisis de audio en tiempo real
- [x] 10 estados emocionales
- [x] Web App mobile-first
- [x] API REST documentada
- [x] Conversión automática de formatos (webm/ogg → mp3)
- [x] Historial de sesión
- [ ] PWA (instalar en móvil)
- [ ] Dog profiles persistentes
- [ ] Soporte multiidioma (EN, DE, FR, PT)
- [ ] Dataset público de ladridos etiquetados

### 🔨 Fase 2 — Hardware (en desarrollo)
- [ ] Collar inteligente con ESP32-S3
- [ ] Micrófono MEMS I2S (INMP441)
- [ ] Acelerómetro MPU-6050 (estado físico)
- [ ] Firmware Arduino open-source
- [ ] Conectividad BLE → app móvil
- [ ] Batería LiPo + carga USB-C
- [ ] PCB diseño abierto (KiCad)

### 🏢 Fase 3 — Plataforma SaaS (Ainertia, propietario)
- [ ] App móvil nativa iOS/Android
- [ ] Historial de comportamiento por mascota
- [ ] Dashboard para veterinarias y adiestradoras
- [ ] Alertas de comportamiento inusual
- [ ] API comercial con subscripción
- [ ] Integración con historiales veterinarios

---

## 🔧 Hardware (Fase 2)

### Lista de componentes (~70€)

| Componente | Modelo | Precio aprox. |
|---|---|---|
| Microcontrolador | ESP32-S3 DevKit | 8€ |
| Micrófono MEMS | INMP441 I2S | 3€ |
| Acelerómetro | MPU-6050 | 2€ |
| Batería | LiPo 1000mAh 3.7V | 4€ |
| Cargador | TP4056 USB-C | 2€ |
| Carcasa | Impresión 3D / collar adaptado | ~10€ |
| PCB custom | JLCPCB (10 uds.) | ~8€ |

### Firmware

```bash
# Requiere Arduino IDE + ESP32 board package
# Abre hardware/firmware/guauai_collar/guauai_collar.ino
```

---

## 🤝 Contribuir

```bash
# 1. Fork del repositorio
# 2. Crea una rama
git checkout -b feature/mi-mejora

# 3. Commit
git commit -m "feat: descripción del cambio"

# 4. Push y Pull Request
git push origin feature/mi-mejora
```

**Áreas donde más se necesita ayuda:**
- 🧪 Dataset de ladridos etiquetados (necesitamos grabaciones reales)
- 🌍 Traducciones del sistema de análisis
- 🔧 Mejoras al firmware ESP32
- 📱 App móvil React Native

---

## 📄 Licencia

| Componente | Licencia |
|---|---|
| Motor de análisis (este repo) | MIT |
| App móvil | Propietario — Ainertia Capital S.L. |
| Firmware collar | MIT |
| Plataforma SaaS | Propietario — Ainertia Capital S.L. |

---

<div align="center">
  <strong>Hecho con 🐾 por <a href="https://ainertia.ai">Ainertia Capital</a> — Córdoba, España</strong><br/>
  <sub>Si te gusta el proyecto, dale una ⭐ en GitHub</sub>
</div>

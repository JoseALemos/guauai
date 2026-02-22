# 🐾 GuauAI — Talk to Your Dog

> **Open-source AI engine that understands dog vocalizations.**  
> Record your dog. Get instant interpretation. Know what they need.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://guauai.ainertia.io)
[![Dashboard](https://img.shields.io/badge/Dashboard-Live-blueviolet)](https://guauai.ainertia.io/dashboard)
[![Built with gpt-audio](https://img.shields.io/badge/Powered%20by-gpt--audio-412991)](https://openai.com)
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

| URL | Descripción |
|---|---|
| 👉 [Analizador](https://guauai.ainertia.io) | App web — graba y analiza al instante |
| 📊 [Dashboard](https://guauai.ainertia.io/dashboard) | Panel completo con perfiles, historial y gráficas |

---

## ⚡ Instalación rápida

```bash
git clone https://github.com/JoseALemos/guauai.git
cd guauai/backend
npm install
cp .env.example .env        # añade OPENAI_API_KEY y opcionalmente DATABASE_URL
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
  "dog_breed": "Pastor Alemán",
  "lang": "es"
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
  },
  "alert": null
}
```

### Autenticación

```http
POST /api/auth/register   → { token, user }
POST /api/auth/login      → { token, user }
GET  /api/auth/me         → { id, email, name }
```

### Perfiles de perro

```http
GET    /api/dogs              → Lista de perros (auth)
POST   /api/dogs              → Crear perro
PATCH  /api/dogs/:id          → Editar perro
DELETE /api/dogs/:id          → Eliminar perro
GET    /api/dogs/:id/history  → Historial de análisis
GET    /api/dogs/:id/stats    → Estadísticas (emociones, timeline 30d)
```

### Alertas y compartir

```http
GET /api/alerts               → Alertas activas (auth)
GET /api/share/:id            → Análisis público por ID
```

---

## 🗺️ Roadmap

### ✅ Fase 1 — Motor IA + Web + Dashboard
- [x] Análisis de audio en tiempo real con `gpt-audio`
- [x] 10 estados emocionales, 10 necesidades
- [x] Web App mobile-first + PWA instalable
- [x] Dashboard completo con login/registro, perfiles y gráficas
- [x] Historial persistente en PostgreSQL
- [x] Sistema de alertas de comportamiento
- [x] Análisis adaptado por raza (10 razas con contexto específico)
- [x] Soporte multiidioma (ES, EN, DE)
- [x] Conversión automática de formatos (webm/ogg → mp3)
- [x] Export CSV del historial
- [x] Links compartibles por análisis
- [ ] Dataset público de ladridos etiquetados

### 📱 Fase 1b — App Móvil (en desarrollo)
- [x] Expo + TypeScript con Expo Router
- [x] 5 pantallas: Analizar, Perros, Historial, Alertas, Perfil
- [x] Grabación nativa con expo-av
- [x] Autenticación con SecureStore
- [x] Compartir análisis nativo (iOS/Android share sheet)
- [ ] Notificaciones push para alertas
- [ ] Widget iOS/Android con última interpretación
- [ ] BLE para collar GuauAI

### 🔧 Fase 2 — Hardware (diseñado)
- [x] Firmware ESP32-S3 con INMP441 + MPU-6050
- [x] Conectividad WiFi + BLE + I2S
- [x] Guía de hardware (~35€ en componentes)
- [ ] PCB diseño KiCad
- [ ] Carcasa impresión 3D
- [ ] Beta hardware (20 unidades)

### 🏢 Fase 3 — Plataforma SaaS (Ainertia, propietario)
- [ ] Dashboard veterinario multi-tenant
- [ ] Alertas automáticas por email/WhatsApp
- [ ] API comercial con subscripción
- [ ] Integración con historiales veterinarios
- [ ] Soporte FR, PT, IT

---

## 🔧 Hardware (Fase 2)

### Lista de componentes (~35€)

| # | Componente | Modelo | Precio aprox. |
|---|---|---|---|
| 1 | Microcontrolador | ESP32-S3 DevKit N16R8 | 8€ |
| 2 | Micrófono MEMS I2S | INMP441 | 3€ |
| 3 | Acelerómetro | MPU-6050 | 2€ |
| 4 | Batería | LiPo 1000mAh 3.7V | 4€ |
| 5 | Cargador USB-C | TP4056 | 2€ |
| 6 | LED RGB | 5mm cátodo común | 1€ |
| 7 | PCB | JLCPCB (10 uds.) | ~8€ |
| **Total** | | | **~28-35€** |

→ [Guía completa de hardware](hardware/README.md)

---

## 📱 App Móvil (Expo)

```bash
cd mobile
npm install
npx expo start   # Expo Go en iOS/Android
```

→ [Documentación de la app](mobile/README.md)

---

## 🗄️ Base de datos

Si quieres historial persistente y perfiles de usuario, añade PostgreSQL:

```bash
# Aplicar schema
psql $DATABASE_URL < backend/db/schema.sql
```

Variables de entorno opcionales:
```
DATABASE_URL=postgres://...
JWT_SECRET=tu-secreto-seguro
```

Sin base de datos el análisis funciona igual — solo sin persistencia.

---

## 🤝 Contribuir

**Áreas donde más se necesita ayuda:**
- 🧪 **Dataset**: Grabaciones de perros etiquetadas por emoción
- 🌍 **Traducciones**: FR, PT, IT, NL
- 🔧 **Firmware**: Mejoras al ESP32 y diseño PCB
- 📱 **App**: Nuevas funciones para React Native

```bash
git checkout -b feature/mi-mejora
git commit -m "feat: descripción"
git push origin feature/mi-mejora
# → Pull Request
```

---

## 📄 Licencia

| Componente | Licencia |
|---|---|
| Motor de análisis + API (este repo) | **MIT** |
| Firmware collar ESP32 | **MIT** |
| App móvil iOS/Android | Propietario — Ainertia Capital |
| Plataforma SaaS veterinaria | Propietario — Ainertia Capital |

---

<div align="center">
  <strong>Hecho con 🐾 por <a href="https://ainertia.ai">Ainertia Capital</a> — Córdoba, España</strong><br/>
  <sub>Si te gusta el proyecto, dale una ⭐ — ayuda a que más personas hablen con sus perros</sub>
</div>

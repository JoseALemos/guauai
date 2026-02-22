# 📱 GuauAI Mobile — Expo App

App móvil nativa para iOS y Android. Construida con Expo + TypeScript.

## Instalación (desarrollo)

```bash
cd mobile
npm install
npx expo start
```

Escanea el QR con **Expo Go** (iOS/Android) o ejecuta en simulador.

## Build producción

```bash
# Instalar EAS CLI
npm install -g eas-cli
eas login

# Configurar proyecto
eas build:configure

# Build
eas build --platform android   # APK/AAB
eas build --platform ios       # IPA (requiere cuenta Apple Developer)
```

## Estructura

```
mobile/
├── app/
│   ├── (auth)/login.tsx     ← Login + registro
│   └── (tabs)/
│       ├── index.tsx        ← Análisis de audio
│       ├── dogs.tsx         ← Gestión de perros
│       ├── history.tsx      ← Historial de análisis
│       ├── alerts.tsx       ← Alertas de comportamiento
│       └── profile.tsx      ← Perfil de usuario
├── services/api.ts          ← Cliente API con SecureStore
└── constants/theme.ts       ← Colores y emojis
```

## Variables de entorno

```bash
# .env
EXPO_PUBLIC_API_URL=https://dogspeak-production.up.railway.app
```

## Permisos requeridos

- **Micrófono** — Para grabar vocalizaciones del perro
- **Bluetooth** — Para conectar con el collar GuauAI (Fase 2)
- **Notificaciones** — Para alertas de comportamiento

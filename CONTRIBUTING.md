# 🐾 Contributing to GuauAI

First off — thanks for wanting to help! GuauAI is open-source because we believe understanding dogs shouldn't be locked behind a paywall.

## Ways to Contribute

### 🧪 Dog Audio Dataset (most needed!)
We need real dog recordings labeled by emotion/need.  
→ [Open an issue](https://github.com/JoseALemos/guauai/issues/new?template=audio-contribution.md) with your recording.

**What we need:**
- Recordings in `.wav` or `.mp3` (>2 seconds, clear audio)
- Label: emotion + context (e.g. "excited, owner just arrived home")
- Dog breed and approximate age (if known)

### 🌍 Translations
The AI prompt currently supports **ES, EN, DE**. We need:
- French 🇫🇷
- Portuguese 🇧🇷
- Italian 🇮🇹
- Dutch 🇳🇱

→ Edit `backend/services/dogAnalyzer.js` — add your language to `SYSTEM_PROMPTS`.

### 🐛 Bug Reports
→ [Report a bug](https://github.com/JoseALemos/guauai/issues/new?template=bug-report.md)

### 💡 Feature Ideas
→ [Request a feature](https://github.com/JoseALemos/guauai/issues/new?template=feature-request.md)

### 🔧 Hardware / Firmware
- Improve the ESP32 firmware
- Design a PCB (KiCad preferred)
- Test with different microphone modules
- 3D print a collar casing

---

## Development Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env   # add OPENAI_API_KEY
node server.js

# Mobile
cd mobile
npm install
npx expo start
```

## Code Style

- **JavaScript/TypeScript**: no strict linting enforced, but keep it readable
- **Commits**: conventional commits preferred (`feat:`, `fix:`, `docs:`, `chore:`)
- **PRs**: describe what changed and why; link the issue if applicable

## Project Structure

```
guauai/
├── backend/           ← Node.js API (Express)
│   ├── routes/        ← API endpoints
│   ├── services/      ← AI analysis, alerts
│   └── db/            ← Schema + pool
├── frontend/          ← Web app (vanilla HTML/JS)
├── mobile/            ← Expo React Native app
└── hardware/          ← ESP32 firmware + docs
```

## Code of Conduct

Be kind. This is a project about dogs — good vibes only. 🐶

---

<div align="center">
  Made with ❤️ by <a href="https://ainertia.ai">Ainertia Capital</a> · Córdoba, España
</div>

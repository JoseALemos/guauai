const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía email de alerta crítica al dueño del perro
 */
async function sendBehaviorAlert({ toEmail, dogName, emotion, message, recommendation, shareUrl }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return; // silently skip if not configured

  const emotionEmoji = {
    dolorido:'😢', ansioso:'😰', agresivo:'⚠️', asustado:'😨',
    painful:'😢', anxious:'😰', aggressive:'⚠️', scared:'😨'
  }[emotion] || '⚠️';

  const html = `
  <!DOCTYPE html><html><body style="background:#0a0a0f;color:#f1f5f9;font-family:system-ui,sans-serif;padding:0;margin:0">
  <div style="max-width:520px;margin:0 auto;padding:2rem">
    <div style="text-align:center;margin-bottom:2rem">
      <h1 style="color:#a855f7;font-size:1.75rem;font-weight:900">🐾 GuauAI</h1>
    </div>
    <div style="background:#111118;border-radius:1rem;padding:1.5rem;border:1px solid #1e1e30;border-left:4px solid #ef4444">
      <h2 style="color:#ef4444;margin-bottom:.5rem">${emotionEmoji} Alerta de comportamiento</h2>
      <p style="color:#94a3b8;margin-bottom:1.5rem">Tu perro <strong style="color:#f1f5f9">${dogName}</strong> necesita atención.</p>
      <div style="background:#1a1a2e;border-radius:.75rem;padding:1rem;margin-bottom:1rem">
        <div style="color:#64748b;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">Estado detectado</div>
        <div style="font-size:1.25rem;font-weight:800;color:#ef4444">${emotionEmoji} ${emotion?.toUpperCase()}</div>
      </div>
      <div style="background:#1a1a2e;border-radius:.75rem;padding:1rem;margin-bottom:1rem">
        <div style="color:#64748b;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">Mensaje</div>
        <div style="font-style:italic">"${message}"</div>
      </div>
      ${recommendation ? `
      <div style="background:#1a1a2e;border-radius:.75rem;padding:1rem">
        <div style="color:#64748b;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">💡 Qué hacer</div>
        <div>${recommendation}</div>
      </div>` : ''}
    </div>
    ${shareUrl ? `<div style="text-align:center;margin-top:1.5rem"><a href="${shareUrl}" style="background:#7c3aed;color:white;padding:.75rem 1.5rem;border-radius:.875rem;text-decoration:none;font-weight:700">Ver análisis completo →</a></div>` : ''}
    <p style="text-align:center;color:#475569;font-size:.8rem;margin-top:2rem">GuauAI · Made by <a href="https://ainertia.ai" style="color:#7c3aed">Ainertia Capital</a></p>
  </div>
  </body></html>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `GuauAI <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `🚨 ${dogName} necesita tu atención — GuauAI`,
      html,
    });
  } catch (e) {
    console.error('[EmailAlert] Error:', e.message);
  }
}

module.exports = { sendBehaviorAlert };

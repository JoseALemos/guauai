const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'guauai-dev-secret-change-in-prod';

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' });

  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function optionalToken(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); } catch {}
  }
  next();
}

module.exports = { verifyToken, optionalToken, JWT_SECRET };

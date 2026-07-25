const jwt = require('jsonwebtoken');

// Fail fast at startup — no fallback secret to avoid token-forgery risk
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}
if (JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is too short (minimum 32 characters). Refusing to start.');
  process.exit(1);
}

function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    verifyAuth(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: insufficient role' });
      }
      next();
    });
  };
}

const requirePatient = requireRole('patient');
const requireProvider = requireRole('provider');
const requireAdmin = requireRole('admin');

module.exports = { signToken, verifyAuth, requireRole, requirePatient, requireProvider, requireAdmin };

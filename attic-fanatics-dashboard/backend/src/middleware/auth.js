const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// requireAuth: verifies Bearer JWT, attaches req.user
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    // Normalize: provide both .id and .userId for backward compat
    req.user = { ...decoded, id: decoded.userId || decoded.id };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// backward-compat alias
const authenticate = requireAuth;

// requireRole(...roles): checks req.user.role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// requireCustomer: verifies JWT has role 'customer'
function requireCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    if (decoded.role !== 'customer') return res.status(401).json({ error: 'Customer auth required' });
    req.customer = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, authenticate, requireRole, requireCustomer };

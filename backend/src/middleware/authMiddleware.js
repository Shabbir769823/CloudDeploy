import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clouddeploy_secret_key_12345';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Authorization header: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token.' });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

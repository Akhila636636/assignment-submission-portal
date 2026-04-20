/**
 * Role-gating middleware factory.
 * Usage: requireRole('admin') or requireRole(['lecturer', 'admin'])
 */
const requireRole = (roles) => {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowed.join(' or ')}.`,
      });
    }

    next();
  };
};

module.exports = requireRole;

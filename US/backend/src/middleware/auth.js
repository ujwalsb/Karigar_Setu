'use strict';

const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Verify JWT from httpOnly cookie and attach req.user
 */
async function authenticate(req, res, next) {
  try {
    let token = req.cookies && req.cookies['us_token'];

    // Also support Authorization header
    if (!token && req.headers['authorization']) {
      const parts = req.headers['authorization'].split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    const [rows] = await db.query(
      'SELECT id, name, email, role, is_active, phone FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based authorization middleware factory
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
    }
    next();
  };
}

/**
 * Activity logging helper
 */
async function logActivity(userId, action, entityType, entityId, details, ipAddress) {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

/**
 * Middleware factory that logs activity after route handler completes
 */
function logActivityMiddleware(action, entityType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (body && body.success && req.user) {
        const entityId = req.params.id || (body.data && (body.data.id || body.data.insertId)) || null;
        await logActivity(
          req.user.id,
          action,
          entityType,
          entityId,
          { method: req.method, path: req.path, body: req.body },
          req.ip
        );
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { authenticate, authorize, logActivity, logActivityMiddleware };

'use strict';

const db = require('../config/database');
const { logActivity } = require('../middleware/auth');

async function getActivityLogs(req, res, next) {
  try {
    const {
      page = 1,
      limit = 25,
      userId = '',
      action = '',
      entityType = '',
      search = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];

    if (userId) {
      conditions.push('al.user_id = ?');
      values.push(parseInt(userId));
    }
    if (action) {
      if (action === 'auth') {
        conditions.push("al.action IN ('LOGIN', 'LOGOUT', 'LOGIN_FAILED')");
      } else {
        conditions.push('al.action LIKE ?');
        values.push(`%${action}%`);
      }
    }
    if (entityType) {
      conditions.push('al.entity_type = ?');
      values.push(entityType);
    }
    if (search) {
      conditions.push(
        '(al.action LIKE ? OR al.entity_type LIKE ? OR al.ip_address LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (dateFrom) {
      conditions.push('DATE(al.created_at) >= ?');
      values.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(al.created_at) <= ?');
      values.push(dateTo);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id,
              al.details, al.ip_address, al.created_at,
              u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}`,
      values
    );

    return res.json({
      success: true,
      data: {
        rows,
        total: countRows[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countRows[0].total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getActivityStats(req, res, next) {
  try {
    const [[totalRow]] = await db.query('SELECT COUNT(*) as total FROM activity_logs');
    const [[todayRow]] = await db.query(
      "SELECT COUNT(*) as count FROM activity_logs WHERE DATE(created_at) = CURDATE()"
    );
    const [[loginTodayRow]] = await db.query(
      "SELECT COUNT(*) as count FROM activity_logs WHERE action = 'LOGIN' AND DATE(created_at) = CURDATE()"
    );
    const [[logoutTodayRow]] = await db.query(
      "SELECT COUNT(*) as count FROM activity_logs WHERE action = 'LOGOUT' AND DATE(created_at) = CURDATE()"
    );
    const [[activeUsersRow]] = await db.query(
      "SELECT COUNT(DISTINCT user_id) as count FROM activity_logs WHERE DATE(created_at) = CURDATE() AND user_id IS NOT NULL"
    );

    return res.json({
      success: true,
      data: {
        totalLogs: totalRow?.total || 0,
        todayActions: todayRow?.count || 0,
        todayLogins: loginTodayRow?.count || 0,
        todayLogouts: logoutTodayRow?.count || 0,
        activeUsersToday: activeUsersRow?.count || 0
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getUserActivities(req, res, next) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db.query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id, al.details, al.ip_address, al.created_at,
              u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = ?
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(id), parseInt(limit), offset]
    );

    const [countRows] = await db.query(
      'SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?',
      [parseInt(id)]
    );

    return res.json({
      success: true,
      data: {
        rows,
        total: countRows[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countRows[0].total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

async function clearOldLogs(req, res, next) {
  try {
    const { days = 30 } = req.body;
    let query = 'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
    let params = [parseInt(days)];

    if (days === 0 || days === 'all') {
      query = 'DELETE FROM activity_logs';
      params = [];
    }

    const [result] = await db.query(query, params);

    await logActivity(
      req.user.id,
      'CLEAR_LOGS',
      'system',
      null,
      { clearedRows: result.affectedRows, days },
      req.ip
    );

    return res.json({
      success: true,
      message: `Cleared ${result.affectedRows} log entries successfully.`,
      affectedRows: result.affectedRows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getActivityLogs,
  getActivityStats,
  getUserActivities,
  clearOldLogs
};

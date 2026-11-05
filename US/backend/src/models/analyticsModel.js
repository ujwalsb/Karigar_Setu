'use strict';

const db = require('../config/database');

async function getDashboardStats(role, userId) {
  const userFilter = role === 'support' && userId ? `AND support_user_id = ${parseInt(userId)}` : '';

  const [callStats] = await db.query(
    `SELECT
       COUNT(*) as total_calls,
       SUM(status = 'completed') as completed_calls,
       SUM(DATE(created_at) = CURDATE()) as today_calls,
       SUM(status = 'new_call') as new_calls,
       SUM(urgency = 'emergency') as emergency_calls
     FROM customer_calls WHERE 1=1 ${userFilter}`
  );

  const [srStats] = await db.query(
    `SELECT
       COUNT(*) as total_requests,
       SUM(status = 'completed') as completed_requests,
       SUM(status IN ('new_call','requirement_recorded','finding_technician',
                       'technician_assigned','technician_contacted',
                       'visit_scheduled','work_in_progress')) as active_requests
     FROM service_requests WHERE 1=1 ${userFilter}`
  );

  const [customerStats] = await db.query(
    'SELECT COUNT(*) as total_customers FROM customers WHERE deleted_at IS NULL'
  );

  const [technicianStats] = await db.query(
    `SELECT
       COUNT(*) as total_technicians,
       SUM(availability = 'available') as available_technicians,
       SUM(verification_status = 'pending') as pending_verification
     FROM technicians WHERE deleted_at IS NULL AND status = 'active'`
  );

  return {
    calls: callStats[0],
    service_requests: srStats[0],
    customers: customerStats[0],
    technicians: technicianStats[0]
  };
}

async function getCallsOverTime({ period = '7days', userId }) {
  let dateFilter = '';
  if (period === '7days') dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  else if (period === '30days') dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  else if (period === '90days') dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';

  const userFilter = userId ? `AND support_user_id = ${parseInt(userId)}` : '';

  const [rows] = await db.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM customer_calls
     WHERE 1=1 ${dateFilter} ${userFilter}
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  );
  return rows;
}

async function getServiceCategoryBreakdown() {
  const [rows] = await db.query(
    `SELECT sc.name, COUNT(cc.id) as count
     FROM service_categories sc
     LEFT JOIN customer_calls cc ON cc.service_category_id = sc.id
     GROUP BY sc.id, sc.name
     ORDER BY count DESC`
  );
  return rows;
}

async function getAreaWiseDemand() {
  const [rows] = await db.query(
    `SELECT c.area, c.city, COUNT(cc.id) as call_count
     FROM customers c
     JOIN customer_calls cc ON cc.customer_id = c.id
     WHERE c.area IS NOT NULL
     GROUP BY c.area, c.city
     ORDER BY call_count DESC
     LIMIT 20`
  );
  return rows;
}

async function getEmployeePerformance({ dateFrom, dateTo }) {
  const conditions = ['1=1'];
  const values = [];
  if (dateFrom) { conditions.push('DATE(cc.created_at) >= ?'); values.push(dateFrom); }
  if (dateTo) { conditions.push('DATE(cc.created_at) <= ?'); values.push(dateTo); }
  const where = conditions.join(' AND ');

  const [rows] = await db.query(
    `SELECT u.id, u.name,
            COUNT(cc.id) as total_calls,
            SUM(cc.status = 'completed') as completed_calls,
            SUM(cc.urgency = 'emergency') as emergency_handled,
            MIN(cc.created_at) as first_call,
            MAX(cc.created_at) as last_call
     FROM users u
     LEFT JOIN customer_calls cc ON cc.support_user_id = u.id AND ${where}
     WHERE u.role = 'support' AND u.deleted_at IS NULL
     GROUP BY u.id, u.name
     ORDER BY total_calls DESC`,
    values
  );
  return rows;
}

async function getTechnicianPerformance({ dateFrom, dateTo }) {
  const conditions = ['1=1'];
  const values = [];
  if (dateFrom) { conditions.push('DATE(sr.created_at) >= ?'); values.push(dateFrom); }
  if (dateTo) { conditions.push('DATE(sr.created_at) <= ?'); values.push(dateTo); }
  const where = conditions.join(' AND ');

  const [rows] = await db.query(
    `SELECT t.id, t.full_name, t.mobile,
            COUNT(sr.id) as total_assignments,
            SUM(sr.status = 'completed') as completed_jobs,
            t.verification_status, t.availability
     FROM technicians t
     LEFT JOIN service_requests sr ON sr.assigned_technician_id = t.id AND ${where}
     WHERE t.deleted_at IS NULL
     GROUP BY t.id, t.full_name, t.mobile, t.verification_status, t.availability
     ORDER BY total_assignments DESC`,
    values
  );
  return rows;
}

module.exports = {
  getDashboardStats,
  getCallsOverTime,
  getServiceCategoryBreakdown,
  getAreaWiseDemand,
  getEmployeePerformance,
  getTechnicianPerformance
};

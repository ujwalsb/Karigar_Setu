'use strict';

const db = require('../config/database');

async function createCustomer(data) {
  const {
    full_name, mobile, alt_mobile, alternate_mobile, email, address, area, city,
    state, pin_code, landmark, latitude, longitude, created_by
  } = data;
  const resolvedAltMobile = alternate_mobile || alt_mobile || null;
  const [result] = await db.query(
    `INSERT INTO customers
     (full_name, mobile, alternate_mobile, email, address, area, city, state,
      pin_code, landmark, latitude, longitude, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [full_name, mobile, resolvedAltMobile, email || null, address || null,
      area || null, city || 'Pune', state || 'Maharashtra',
      pin_code || null, landmark || null,
      latitude || null, longitude || null, created_by || null]
  );
  return result.insertId;
}

async function findByMobile(mobile) {
  const [rows] = await db.query(
    'SELECT * FROM customers WHERE mobile = ? AND deleted_at IS NULL',
    [mobile]
  );
  return rows[0] || null;
}

async function lookupByMobile(mobile) {
  const cleanMobile = String(mobile).replace(/[\s\-\(\)]/g, '').trim();
  const [rows] = await db.query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM customer_calls cc WHERE cc.customer_id = c.id) AS call_count,
            (SELECT COUNT(*) FROM service_requests sr WHERE sr.customer_id = c.id) AS request_count,
            (SELECT MAX(cc.created_at) FROM customer_calls cc WHERE cc.customer_id = c.id) AS last_call_date
     FROM customers c
     WHERE (c.mobile = ? OR c.alternate_mobile = ?) AND c.deleted_at IS NULL
     LIMIT 1`,
    [cleanMobile, cleanMobile]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM customer_calls cc WHERE cc.customer_id = c.id) AS call_count
     FROM customers c
     WHERE c.id = ? AND c.deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

async function searchCustomers({ query = '', page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const like = `%${query}%`;
  const [rows] = await db.query(
    `SELECT id, full_name, mobile, alternate_mobile, email, area, city, pin_code, created_at
     FROM customers
     WHERE deleted_at IS NULL AND (full_name LIKE ? OR mobile LIKE ? OR email LIKE ?)
     ORDER BY full_name ASC LIMIT ? OFFSET ?`,
    [like, like, like, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) as total FROM customers
     WHERE deleted_at IS NULL AND (full_name LIKE ? OR mobile LIKE ? OR email LIKE ?)`,
    [like, like, like]
  );
  return { rows, total: countRows[0].total };
}

async function getAllCustomers({ page = 1, limit = 20, search = '', area = '', city = '' }) {
  const offset = (page - 1) * limit;
  const conditions = ['deleted_at IS NULL'];
  const values = [];
  if (search) {
    conditions.push('(full_name LIKE ? OR mobile LIKE ? OR email LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (area) {
    conditions.push('area LIKE ?');
    values.push(`%${area}%`);
  }
  if (city) {
    conditions.push('city LIKE ?');
    values.push(`%${city}%`);
  }
  const where = conditions.join(' AND ');
  const [rows] = await db.query(
    `SELECT id, full_name, mobile, alternate_mobile, email, address, area, city,
            state, pin_code, landmark, latitude, longitude, created_at
     FROM customers WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) as total FROM customers WHERE ${where}`,
    values
  );
  return { rows, total: countRows[0].total };
}

async function updateCustomer(id, data) {
  if (data.alt_mobile && !data.alternate_mobile) {
    data.alternate_mobile = data.alt_mobile;
  }
  const allowed = [
    'full_name', 'mobile', 'alternate_mobile', 'email', 'address', 'area', 'city',
    'state', 'pin_code', 'landmark', 'latitude', 'longitude'
  ];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (!updates.length) return 0;
  values.push(id);
  const [result] = await db.query(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  return result.affectedRows;
}

async function deleteCustomer(id) {
  const [result] = await db.query(
    'UPDATE customers SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows;
}

async function getCustomerCallHistory(customerId) {
  const [rows] = await db.query(
    `SELECT cc.*, sc.name as service_category_name, u.name as support_user_name
     FROM customer_calls cc
     LEFT JOIN service_categories sc ON cc.service_category_id = sc.id
     LEFT JOIN users u ON cc.support_user_id = u.id
     WHERE cc.customer_id = ?
     ORDER BY cc.created_at DESC`,
    [customerId]
  );
  return rows;
}

async function getCustomerFullServiceHistory(customerId) {
  // 1. Customer profile
  const [custRows] = await db.query(
    'SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL',
    [customerId]
  );
  if (!custRows.length) return null;
  const customer = custRows[0];

  // 2. Service Requests with technician, categories, work done, and amount taken
  const [requests] = await db.query(
    `SELECT sr.id, sr.request_id, sr.customer_call_id, sr.service_category_id, sr.status,
            sr.scheduled_date, sr.scheduled_time, sr.created_at, sr.updated_at,
            sr.work_description, sr.parts_replaced, sr.labor_charge, sr.parts_charge,
            sr.final_amount, sr.payment_status, sr.payment_mode, sr.completed_at,
            sr.internal_notes, sr.machine_photo_url, sr.technician_remarks, sr.submission_token,
            sc.name AS service_category_name,
            t.id AS technician_id, t.full_name AS technician_name, t.mobile AS technician_mobile,
            t.photo_url AS technician_photo, t.rating AS technician_rating,
            cc.call_id, cc.urgency, cc.requirement, cc.problem_description,
            u.name AS support_user_name
     FROM service_requests sr
     LEFT JOIN service_categories sc ON sr.service_category_id = sc.id
     LEFT JOIN technicians t ON sr.assigned_technician_id = t.id
     LEFT JOIN customer_calls cc ON sr.customer_call_id = cc.id
     LEFT JOIN users u ON sr.support_user_id = u.id
     WHERE sr.customer_id = ?
     ORDER BY sr.created_at DESC`,
    [customerId]
  );

  // 3. Customer Calls
  const [calls] = await db.query(
    `SELECT cc.*, sc.name AS service_category_name, u.name AS support_user_name
     FROM customer_calls cc
     LEFT JOIN service_categories sc ON cc.service_category_id = sc.id
     LEFT JOIN users u ON cc.support_user_id = u.id
     WHERE cc.customer_id = ?
     ORDER BY cc.created_at DESC`,
    [customerId]
  );

  // 4. Lifetime Metrics
  let totalAmountTaken = 0;
  let completedCount = 0;
  for (const r of requests) {
    totalAmountTaken += parseFloat(r.final_amount || 0);
    if (r.status === 'completed') completedCount++;
  }

  return {
    customer,
    metrics: {
      total_requests: requests.length,
      completed_requests: completedCount,
      total_calls: calls.length,
      total_amount_taken: totalAmountTaken
    },
    requests,
    calls
  };
}

module.exports = {
  createCustomer,
  findByMobile,
  lookupByMobile,
  findById,
  searchCustomers,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  getCustomerCallHistory,
  getCustomerFullServiceHistory
};

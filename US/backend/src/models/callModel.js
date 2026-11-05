'use strict';

const db = require('../config/database');
const { generateCallId } = require('../utils/idGenerator');

async function createCall(data) {
  const {
    customer_id, service_category_id, requirement, problem_description,
    urgency, call_source, preferred_date, preferred_time,
    support_user_id, internal_notes
  } = data;
  const callId = await generateCallId();
  const [result] = await db.query(
    `INSERT INTO customer_calls
     (call_id, customer_id, service_category_id, requirement, problem_description,
      urgency, call_source, preferred_date, preferred_time, support_user_id, internal_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [callId, customer_id, service_category_id || null, requirement || null,
      problem_description || null, urgency || 'normal', call_source || 'phone',
      preferred_date || null, preferred_time || null, support_user_id, internal_notes || null]
  );
  return { insertId: result.insertId, callId };
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT cc.*,
            c.full_name AS customer_name, c.mobile AS customer_mobile,
            c.alternate_mobile AS customer_alternate_mobile,
            c.area AS customer_area, c.city AS customer_city, c.pin_code AS customer_pin_code,
            c.address AS customer_address, c.landmark AS customer_landmark,
            c.latitude AS customer_latitude, c.longitude AS customer_longitude,
            sc.name AS service_category_name,
            u.name AS support_user_name,
            sr.id AS service_request_id,
            sr.request_id AS service_request_number,
            sr.work_description,
            sr.parts_replaced,
            sr.labor_charge,
            sr.parts_charge,
            sr.final_amount,
            sr.payment_status,
            sr.payment_mode,
            sr.machine_photo_url,
            sr.technician_remarks,
            sr.completed_at AS service_completed_at,
            t.id AS technician_id, t.full_name AS technician_name, t.mobile AS technician_mobile
     FROM customer_calls cc
     LEFT JOIN customers c ON cc.customer_id = c.id
     LEFT JOIN service_categories sc ON cc.service_category_id = sc.id
     LEFT JOIN users u ON cc.support_user_id = u.id
     LEFT JOIN service_requests sr ON sr.customer_call_id = cc.id
     LEFT JOIN technicians t ON sr.assigned_technician_id = t.id
     WHERE cc.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getAllCalls({ page = 1, limit = 20, status = '', supportUserId = '', dateFrom = '', dateTo = '' }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  if (status) {
    conditions.push('cc.status = ?');
    values.push(status);
  }
  if (supportUserId) {
    conditions.push('cc.support_user_id = ?');
    values.push(supportUserId);
  }
  if (dateFrom) {
    conditions.push('DATE(cc.created_at) >= ?');
    values.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('DATE(cc.created_at) <= ?');
    values.push(dateTo);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT cc.id, cc.call_id, cc.customer_id, cc.service_category_id, cc.status, cc.urgency, cc.call_source,
            cc.requirement, cc.problem_description, cc.preferred_date, cc.preferred_time, cc.created_at,
            c.full_name AS customer_name, c.mobile AS customer_mobile, c.alternate_mobile AS customer_alternate_mobile,
            c.address AS customer_address, c.landmark AS customer_landmark,
            c.area AS customer_area, c.city AS customer_city, c.pin_code AS customer_pin_code,
            c.latitude AS customer_latitude, c.longitude AS customer_longitude,
            sc.name AS service_category_name,
            u.name AS support_user_name,
            sr.id AS service_request_id,
            sr.request_id AS service_request_number,
            sr.work_description,
            sr.parts_replaced,
            sr.labor_charge,
            sr.parts_charge,
            sr.final_amount,
            sr.payment_status,
            sr.payment_mode,
            sr.machine_photo_url,
            sr.technician_remarks,
            sr.completed_at AS service_completed_at,
            t.id AS technician_id, t.full_name AS technician_name, t.mobile AS technician_mobile
     FROM customer_calls cc
     LEFT JOIN customers c ON cc.customer_id = c.id
     LEFT JOIN service_categories sc ON cc.service_category_id = sc.id
     LEFT JOIN users u ON cc.support_user_id = u.id
     LEFT JOIN service_requests sr ON sr.customer_call_id = cc.id
     LEFT JOIN technicians t ON sr.assigned_technician_id = t.id
     ${where} ORDER BY cc.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) as total FROM customer_calls cc ${where}`,
    values
  );
  return { rows, total: countRows[0].total };
}

async function updateCallStatus(id, status, userId) {
  const [result] = await db.query(
    'UPDATE customer_calls SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows;
}

async function updateCall(id, data) {
  const allowed = [
    'service_category_id', 'requirement', 'problem_description', 'urgency',
    'call_source', 'preferred_date', 'preferred_time', 'internal_notes', 'status'
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
    `UPDATE customer_calls SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows;
}

async function getTodayCalls(userId) {
  const conditions = ["DATE(created_at) = CURDATE()"];
  const values = [];
  if (userId) {
    conditions.push('support_user_id = ?');
    values.push(userId);
  }
  const [rows] = await db.query(
    `SELECT COUNT(*) as count FROM customer_calls WHERE ${conditions.join(' AND ')}`,
    values
  );
  return rows[0].count;
}

async function getCallsByUser(userId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const [rows] = await db.query(
    `SELECT cc.id, cc.call_id, cc.status, cc.urgency, cc.requirement, cc.created_at,
            c.full_name AS customer_name, c.mobile AS customer_mobile,
            sc.name AS service_category_name
     FROM customer_calls cc
     LEFT JOIN customers c ON cc.customer_id = c.id
     LEFT JOIN service_categories sc ON cc.service_category_id = sc.id
     WHERE cc.support_user_id = ?
     ORDER BY cc.created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const [countRows] = await db.query(
    'SELECT COUNT(*) as total FROM customer_calls WHERE support_user_id = ?',
    [userId]
  );
  return { rows, total: countRows[0].total };
}

async function addCallNote(data) {
  const { customer_call_id, service_request_id, note, created_by } = data;
  const [result] = await db.query(
    `INSERT INTO call_notes (customer_call_id, service_request_id, note, created_by)
     VALUES (?, ?, ?, ?)`,
    [customer_call_id || null, service_request_id || null, note, created_by]
  );
  return result.insertId;
}

async function getCallNotes(callId) {
  const [rows] = await db.query(
    `SELECT cn.*, u.name AS created_by_name
     FROM call_notes cn
     LEFT JOIN users u ON cn.created_by = u.id
     WHERE cn.customer_call_id = ?
     ORDER BY cn.created_at ASC`,
    [callId]
  );
  return rows;
}

async function getRecentCallsByUser(userId, limit = 10) {
  const [rows] = await db.query(
    `SELECT cc.id, cc.call_id, cc.status, cc.urgency, cc.requirement, cc.created_at,
            c.full_name AS customer_name, c.mobile AS customer_mobile,
            sc.name AS service_category_name
     FROM customer_calls cc
     LEFT JOIN customers c ON cc.customer_id = c.id
     LEFT JOIN service_categories sc ON cc.service_category_id = sc.id
     WHERE cc.support_user_id = ?
     ORDER BY cc.created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

module.exports = {
  createCall,
  findById,
  getAllCalls,
  updateCallStatus,
  updateCall,
  getTodayCalls,
  getCallsByUser,
  addCallNote,
  getCallNotes,
  getRecentCallsByUser
};

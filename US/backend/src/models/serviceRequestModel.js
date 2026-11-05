'use strict';

const crypto = require('crypto');
const db = require('../config/database');
const { generateRequestId } = require('../utils/idGenerator');

async function createRequest(data) {
  const {
    customer_call_id, customer_id, assigned_technician_id,
    support_user_id, service_category_id, status,
    scheduled_date, scheduled_time, internal_notes
  } = data;
  const requestId = await generateRequestId();
  const submissionToken = crypto.randomBytes(16).toString('hex');
  const [result] = await db.query(
    `INSERT INTO service_requests
     (request_id, customer_call_id, customer_id, assigned_technician_id,
      support_user_id, service_category_id, status, scheduled_date, scheduled_time, internal_notes, submission_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [requestId, customer_call_id || null, customer_id, assigned_technician_id || null,
      support_user_id, service_category_id || null,
      status || 'new_call', scheduled_date || null, scheduled_time || null,
      internal_notes || null, submissionToken]
  );
  return { insertId: result.insertId, requestId, submissionToken };
}

async function findBySubmissionToken(token) {
  const [rows] = await db.query(
    `SELECT sr.*,
            c.full_name AS customer_name, c.mobile AS customer_mobile, c.alternate_mobile AS customer_alternate_mobile,
            c.area AS customer_area, c.city AS customer_city, c.pin_code AS customer_pin_code,
            c.address AS customer_address, c.landmark AS customer_landmark,
            t.full_name AS technician_name, t.mobile AS technician_mobile,
            sc.name AS service_category_name,
            cc.call_id, cc.urgency, cc.problem_description, cc.requirement
     FROM service_requests sr
     LEFT JOIN customers c ON sr.customer_id = c.id
     LEFT JOIN technicians t ON sr.assigned_technician_id = t.id
     LEFT JOIN service_categories sc ON sr.service_category_id = sc.id
     LEFT JOIN customer_calls cc ON sr.customer_call_id = cc.id
     WHERE sr.submission_token = ? OR sr.request_id = ?`,
    [token, token]
  );
  return rows[0] || null;
}

async function getOrGenerateSubmissionToken(id) {
  const [rows] = await db.query('SELECT id, submission_token FROM service_requests WHERE id = ?', [id]);
  if (!rows.length) return null;
  if (rows[0].submission_token) return rows[0].submission_token;
  const token = crypto.randomBytes(16).toString('hex');
  await db.query('UPDATE service_requests SET submission_token = ? WHERE id = ?', [token, id]);
  return token;
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT sr.*,
            c.full_name AS customer_name, c.mobile AS customer_mobile, c.alternate_mobile AS customer_alternate_mobile,
            c.area AS customer_area, c.city AS customer_city, c.pin_code AS customer_pin_code,
            c.address AS customer_address, c.landmark AS customer_landmark,
            c.latitude AS customer_latitude, c.longitude AS customer_longitude,
            t.full_name AS technician_name, t.mobile AS technician_mobile,
            t.availability AS technician_availability,
            u.name AS support_user_name,
            sc.name AS service_category_name,
            cc.call_id, cc.urgency, cc.problem_description, cc.requirement,
            cc.preferred_date, cc.preferred_time
     FROM service_requests sr
     LEFT JOIN customers c ON sr.customer_id = c.id
     LEFT JOIN technicians t ON sr.assigned_technician_id = t.id
     LEFT JOIN users u ON sr.support_user_id = u.id
     LEFT JOIN service_categories sc ON sr.service_category_id = sc.id
     LEFT JOIN customer_calls cc ON sr.customer_call_id = cc.id
     WHERE sr.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByCustomerCallId(callId) {
  const [rows] = await db.query(
    `SELECT sr.*,
            c.full_name AS customer_name, c.mobile AS customer_mobile, c.alternate_mobile AS customer_alternate_mobile,
            c.area AS customer_area, c.city AS customer_city, c.pin_code AS customer_pin_code,
            c.address AS customer_address, c.landmark AS customer_landmark,
            c.latitude AS customer_latitude, c.longitude AS customer_longitude,
            t.full_name AS technician_name, t.mobile AS technician_mobile,
            t.availability AS technician_availability,
            u.name AS support_user_name,
            sc.name AS service_category_name,
            cc.call_id, cc.urgency, cc.problem_description, cc.requirement,
            cc.preferred_date, cc.preferred_time
     FROM service_requests sr
     LEFT JOIN customers c ON sr.customer_id = c.id
     LEFT JOIN technicians t ON sr.assigned_technician_id = t.id
     LEFT JOIN users u ON sr.support_user_id = u.id
     LEFT JOIN service_categories sc ON sr.service_category_id = sc.id
     LEFT JOIN customer_calls cc ON sr.customer_call_id = cc.id
     WHERE sr.customer_call_id = ?
     ORDER BY sr.id DESC
     LIMIT 1`,
    [callId]
  );
  return rows[0] || null;
}

async function getAllRequests({ page = 1, limit = 20, status = '', supportUserId = '', technicianId = '', dateFrom = '', dateTo = '' }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  if (status) { 
    conditions.push('sr.status = ?'); 
    values.push(status); 
  } else {
    // Service Requests only shows active in-progress requests: completed & cancelled belong to Customer Calls
    conditions.push("sr.status NOT IN ('completed', 'cancelled')");
  }
  if (supportUserId) { conditions.push('sr.support_user_id = ?'); values.push(supportUserId); }
  if (technicianId) { conditions.push('sr.assigned_technician_id = ?'); values.push(technicianId); }
  if (dateFrom) { conditions.push('DATE(sr.created_at) >= ?'); values.push(dateFrom); }
  if (dateTo) { conditions.push('DATE(sr.created_at) <= ?'); values.push(dateTo); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT sr.id, sr.request_id, sr.customer_call_id, sr.service_category_id, sr.status, sr.scheduled_date, sr.scheduled_time, sr.created_at,
            c.full_name AS customer_name, c.mobile AS customer_mobile, c.alternate_mobile AS customer_alternate_mobile,
            c.address AS customer_address, c.landmark AS customer_landmark,
            c.area AS customer_area, c.city AS customer_city, c.pin_code AS customer_pin_code,
            t.id AS technician_id, t.full_name AS technician_name, t.mobile AS technician_mobile,
            u.name AS support_user_name,
            sc.name AS service_category_name,
            sr.work_description, sr.parts_replaced, sr.labor_charge, sr.parts_charge,
            sr.final_amount, sr.payment_status, sr.payment_mode, sr.completed_at,
            cc.call_id, cc.urgency, cc.problem_description, cc.requirement
     FROM service_requests sr
     LEFT JOIN customers c ON sr.customer_id = c.id
     LEFT JOIN technicians t ON sr.assigned_technician_id = t.id
     LEFT JOIN users u ON sr.support_user_id = u.id
     LEFT JOIN service_categories sc ON sr.service_category_id = sc.id
     LEFT JOIN customer_calls cc ON sr.customer_call_id = cc.id
     ${where} ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) as total FROM service_requests sr ${where}`,
    values
  );
  return { rows, total: countRows[0].total };
}

async function updateRequest(id, data) {
  const allowed = [
    'service_category_id', 'status', 'scheduled_date', 'scheduled_time',
    'completion_notes', 'internal_notes', 'assigned_technician_id',
    'work_description', 'parts_replaced', 'labor_charge', 'parts_charge',
    'final_amount', 'payment_status', 'payment_mode', 'completed_at'
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
    `UPDATE service_requests SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // If status was updated to completed, or charges were updated on a completed job
  if (data.status === 'completed' || data.final_amount !== undefined) {
    try {
      const { accrueCommissionForServiceRequest } = require('../controllers/technicianPlanController');
      await accrueCommissionForServiceRequest(id, null);
    } catch (e) {
      console.warn('Could not auto-accrue commission on updateRequest:', e.message);
    }
  }

  return result.affectedRows;
}

async function completeRequest(id, data, userId) {
  const [existing] = await db.query('SELECT status FROM service_requests WHERE id = ?', [id]);
  const oldStatus = existing.length ? existing[0].status : null;

  const {
    work_description,
    workDescription,
    parts_replaced,
    partsReplaced,
    labor_charge,
    laborCharge,
    parts_charge,
    partsCharge,
    final_amount,
    actualCost,
    amountTaken,
    payment_status,
    paymentStatus,
    payment_mode,
    paymentMode,
    completion_notes,
    notes,
    status = 'completed'
  } = data;

  const desc = work_description || workDescription || null;
  const parts = parts_replaced || partsReplaced || null;
  const labor = parseFloat(labor_charge || laborCharge || 0);
  const pCharge = parseFloat(parts_charge || partsCharge || 0);
  const total = parseFloat(final_amount || actualCost || amountTaken || (labor + pCharge) || 0);
  const payStatus = payment_status || paymentStatus || 'paid';
  const payMode = payment_mode || paymentMode || 'cash';
  const cNotes = completion_notes || notes || null;

  const [result] = await db.query(
    `UPDATE service_requests 
     SET status = ?,
         work_description = ?,
         parts_replaced = ?,
         labor_charge = ?,
         parts_charge = ?,
         final_amount = ?,
         payment_status = ?,
         payment_mode = ?,
         internal_notes = COALESCE(?, internal_notes),
         completed_at = NOW()
     WHERE id = ?`,
    [status, desc, parts, labor, pCharge, total, payStatus, payMode, cNotes, id]
  );

  // Sync status to customer_calls if linked
  const [srRows] = await db.query('SELECT customer_call_id FROM service_requests WHERE id = ?', [id]);
  if (srRows.length && srRows[0].customer_call_id) {
    await db.query('UPDATE customer_calls SET status = ? WHERE id = ?', [status, srRows[0].customer_call_id]);
  }

  // Insert status history
  await db.query(
    `INSERT INTO service_status_history
     (service_request_id, old_status, new_status, changed_by, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [id, oldStatus, status, userId, cNotes || `Job marked completed. Work done recorded. Amount: ₹${total}`]
  );

  // Auto-accrue commission if assigned technician is on commission plan
  if (status === 'completed') {
    try {
      const { accrueCommissionForServiceRequest } = require('../controllers/technicianPlanController');
      await accrueCommissionForServiceRequest(id, userId);
    } catch (commErr) {
      console.warn('Could not auto-accrue commission:', commErr.message);
    }
  }

  return result.affectedRows;
}

async function updateStatus(id, newStatus, userId, notes) {
  // Get old status
  const [existing] = await db.query('SELECT status FROM service_requests WHERE id = ?', [id]);
  const oldStatus = existing.length ? existing[0].status : null;

  const [result] = await db.query(
    'UPDATE service_requests SET status = ? WHERE id = ?',
    [newStatus, id]
  );

  // Insert status history
  await db.query(
    `INSERT INTO service_status_history
     (service_request_id, old_status, new_status, changed_by, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [id, oldStatus, newStatus, userId, notes || null]
  );

  // Auto-accrue commission if job status transitioned to completed
  if (newStatus === 'completed') {
    try {
      const { accrueCommissionForServiceRequest } = require('../controllers/technicianPlanController');
      await accrueCommissionForServiceRequest(id, userId);
    } catch (e) {
      console.warn('Could not auto-accrue commission on updateStatus:', e.message);
    }
  }

  return result.affectedRows;
}

async function assignTechnician({ serviceRequestId, technicianId, assignedBy }) {
  // Update service_requests
  await db.query(
    'UPDATE service_requests SET assigned_technician_id = ?, status = ? WHERE id = ?',
    [technicianId, 'technician_assigned', serviceRequestId]
  );
  // Insert assignment record
  const [result] = await db.query(
    `INSERT INTO technician_assignments
     (service_request_id, technician_id, assigned_by)
     VALUES (?, ?, ?)`,
    [serviceRequestId, technicianId, assignedBy]
  );
  return result.insertId;
}

async function updateAssignment(id, data) {
  const allowed = ['contacted', 'accepted', 'rejection_reason', 'customer_informed', 'visit_confirmed'];
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
    `UPDATE technician_assignments SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows;
}

async function getStatusHistory(requestId) {
  const [rows] = await db.query(
    `SELECT ssh.*, u.name AS changed_by_name
     FROM service_status_history ssh
     LEFT JOIN users u ON ssh.changed_by = u.id
     WHERE ssh.service_request_id = ?
     ORDER BY ssh.changed_at ASC`,
    [requestId]
  );
  return rows;
}

async function reassignTechnician(serviceRequestId, newTechnicianId, assignedBy) {
  await db.query(
    'UPDATE service_requests SET assigned_technician_id = ? WHERE id = ?',
    [newTechnicianId, serviceRequestId]
  );
  const [result] = await db.query(
    `INSERT INTO technician_assignments (service_request_id, technician_id, assigned_by)
     VALUES (?, ?, ?)`,
    [serviceRequestId, newTechnicianId, assignedBy]
  );
  return result.insertId;
}

async function getStats({ dateFrom, dateTo, supportUserId }) {
  const conditions = [];
  const values = [];
  if (dateFrom) { conditions.push('DATE(created_at) >= ?'); values.push(dateFrom); }
  if (dateTo) { conditions.push('DATE(created_at) <= ?'); values.push(dateTo); }
  if (supportUserId) { conditions.push('support_user_id = ?'); values.push(supportUserId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [totals] = await db.query(
    `SELECT
       COUNT(*) as total,
       SUM(status = 'completed') as completed,
       SUM(status = 'cancelled') as cancelled,
       SUM(status IN ('new_call','requirement_recorded','finding_technician','technician_assigned','technician_contacted','visit_scheduled','work_in_progress')) as active
     FROM service_requests ${where}`,
    values
  );

  return totals[0];
}

module.exports = {
  createRequest,
  findById,
  findByCustomerCallId,
  findBySubmissionToken,
  getOrGenerateSubmissionToken,
  getAllRequests,
  updateRequest,
  updateStatus,
  completeRequest,
  assignTechnician,
  updateAssignment,
  getStatusHistory,
  reassignTechnician,
  getStats
};

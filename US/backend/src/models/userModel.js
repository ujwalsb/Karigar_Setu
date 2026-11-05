'use strict';

const db = require('../config/database');

async function findByEmail(email) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query(
    'SELECT id, name, email, role, is_active, phone, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

async function createUser({ name, email, password_hash, role, phone }) {
  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
    [name, email, password_hash, role || 'support', phone || null]
  );
  return result.insertId;
}

async function updateUser(id, fields) {
  const allowed = ['name', 'email', 'phone', 'role', 'is_active', 'password_hash'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (!updates.length) return 0;
  values.push(id);
  const [result] = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  return result.affectedRows;
}

async function getAllSupportStaff() {
  const [rows] = await db.query(
    `SELECT id, name, email, role, is_active, phone, created_at, updated_at
     FROM users
     WHERE deleted_at IS NULL
     ORDER BY name ASC`
  );
  return rows;
}

async function deactivateUser(id) {
  const [result] = await db.query(
    'UPDATE users SET is_active = FALSE WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows;
}

async function toggleUserActive(id) {
  const [user] = await db.query('SELECT is_active FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!user.length) return null;
  const newStatus = !user[0].is_active;
  await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
  return newStatus;
}

async function softDeleteUser(id) {
  const [result] = await db.query(
    'UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = ?',
    [id]
  );
  return result.affectedRows;
}

async function countAdmins() {
  const [rows] = await db.query(
    "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND deleted_at IS NULL"
  );
  return rows[0].cnt;
}

async function getPaginatedUsers({ page = 1, limit = 20, search = '', role = '' }) {
  const offset = (page - 1) * limit;
  const conditions = ['deleted_at IS NULL'];
  const values = [];
  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    conditions.push('role = ?');
    values.push(role);
  }
  const where = conditions.join(' AND ');
  const [rows] = await db.query(
    `SELECT id, name, email, role, is_active, phone, created_at, updated_at
     FROM users WHERE ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) as total FROM users WHERE ${where}`,
    values
  );
  return { rows, total: countRows[0].total };
}

async function getUserActivityLogs(userId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const [rows] = await db.query(
    `SELECT id, action, entity_type, entity_id, details, ip_address, created_at
     FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const [countRows] = await db.query(
    'SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?',
    [userId]
  );
  return { rows, total: countRows[0].total };
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateUser,
  getAllSupportStaff,
  deactivateUser,
  toggleUserActive,
  softDeleteUser,
  countAdmins,
  getPaginatedUsers,
  getUserActivityLogs
};

'use strict';

const db = require('../config/database');

async function getAllCategories() {
  const [rows] = await db.query(
    'SELECT * FROM service_categories WHERE is_active = TRUE ORDER BY name ASC'
  );
  return rows;
}

async function getAllCategoriesAdmin(includeInactive = false) {
  const query = includeInactive
    ? 'SELECT * FROM service_categories ORDER BY name ASC'
    : 'SELECT * FROM service_categories WHERE is_active = TRUE ORDER BY name ASC';
  const [rows] = await db.query(query);
  return rows;
}

async function createCategory({ name, description, icon }) {
  const [result] = await db.query(
    'INSERT INTO service_categories (name, description, icon) VALUES (?, ?, ?)',
    [name, description || null, icon || null]
  );
  return result.insertId;
}

async function updateCategory(id, data) {
  const allowed = ['name', 'description', 'icon', 'is_active'];
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
    `UPDATE service_categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows;
}

async function toggleCategory(id) {
  const [result] = await db.query(
    'UPDATE service_categories SET is_active = NOT is_active WHERE id = ?',
    [id]
  );
  return result.affectedRows;
}

module.exports = { getAllCategories, getAllCategoriesAdmin, createCategory, updateCategory, toggleCategory };

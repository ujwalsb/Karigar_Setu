'use strict';

const serviceCategoryModel = require('../models/serviceCategoryModel');
const { logActivity } = require('../middleware/auth');

async function getAll(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const includeInactive = req.query.includeInactive === 'true' || req.query.all === 'true';
    const categories = isAdmin
      ? await serviceCategoryModel.getAllCategoriesAdmin(includeInactive)
      : await serviceCategoryModel.getAllCategories();
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, description, icon } = req.body;
    const id = await serviceCategoryModel.createCategory({ name, description, icon });
    await logActivity(req.user.id, 'CREATE_CATEGORY', 'service_category', id, { name }, req.ip);
    return res.status(201).json({ success: true, message: 'Category created.', data: { id, name } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const affectedRows = await serviceCategoryModel.updateCategory(parseInt(id), req.body);
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    await logActivity(req.user.id, 'UPDATE_CATEGORY', 'service_category', parseInt(id), req.body, req.ip);
    return res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    next(err);
  }
}

async function toggle(req, res, next) {
  try {
    const { id } = req.params;
    const affectedRows = await serviceCategoryModel.toggleCategory(parseInt(id));
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    await logActivity(req.user.id, 'TOGGLE_CATEGORY', 'service_category', parseInt(id), {}, req.ip);
    return res.json({ success: true, message: 'Category toggled.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, toggle };

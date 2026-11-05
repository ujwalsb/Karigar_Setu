'use strict';

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { logActivity } = require('../middleware/auth');

async function getAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const result = await userModel.getPaginatedUsers({
      page: parseInt(page), limit: parseInt(limit), search, role
    });
    return res.json({
      success: true,
      data: {
        rows: result.rows,
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const id = await userModel.createUser({ name, email, password_hash, role: role || 'support', phone });
    await logActivity(req.user.id, 'CREATE_USER', 'user', id, { name, email, role }, req.ip);
    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { id, name, email, role: role || 'support', phone }
    });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, role, is_active, password } = req.body;
    const user = await userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If email is changed, check if new email is already in use
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await userModel.findByEmail(email.toLowerCase());
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ success: false, message: 'Email is already in use by another user.' });
      }
    }

    // Prevent deactivating or demoting the last admin
    if (user.role === 'admin' && (role === 'support' || is_active === false || is_active === 0)) {
      const adminCount = await userModel.countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote or deactivate the last administrator.' });
      }
    }

    const updateData = { name, email, phone, role };
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      updateData.password_hash = await bcrypt.hash(password.trim(), 12);
    }

    await userModel.updateUser(parseInt(id), updateData);
    await logActivity(req.user.id, 'UPDATE_USER', 'user', parseInt(id), { name, email, role, is_active }, req.ip);
    const updated = await userModel.findById(parseInt(id));
    return res.json({ success: true, message: 'User updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in account.' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      const adminCount = await userModel.countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last administrator account.' });
      }
    }

    const affected = await userModel.softDeleteUser(userId);
    if (!affected) {
      return res.status(404).json({ success: false, message: 'Failed to delete user.' });
    }

    await logActivity(req.user.id, 'DELETE_USER', 'user', userId, { name: user.name, email: user.email }, req.ip);
    return res.json({ success: true, message: `Staff user "${user.name}" has been deleted.` });
  } catch (err) {
    next(err);
  }
}

async function toggleUserActive(req, res, next) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot change active status for your own account.' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin' && user.is_active) {
      const adminCount = await userModel.countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last administrator account.' });
      }
    }

    const newStatus = await userModel.toggleUserActive(userId);
    await logActivity(req.user.id, newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'user', userId, {}, req.ip);
    const updated = await userModel.findById(userId);
    return res.json({
      success: true,
      message: `User ${user.name} is now ${newStatus ? 'Active' : 'Inactive'}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }
    const affectedRows = await userModel.deactivateUser(parseInt(id));
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    await logActivity(req.user.id, 'DEACTIVATE_USER', 'user', parseInt(id), {}, req.ip);
    return res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    next(err);
  }
}

async function getUserActivity(req, res, next) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const result = await userModel.getUserActivityLogs(parseInt(id), {
      page: parseInt(page), limit: parseInt(limit)
    });
    return res.json({
      success: true,
      data: {
        rows: result.rows,
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers, createUser, updateUser, deleteUser, toggleUserActive, deactivateUser, getUserActivity };

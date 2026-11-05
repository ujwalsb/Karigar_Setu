'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { logActivity } = require('../middleware/auth');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.cookie('us_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    await logActivity(user.id, 'LOGIN', 'user', user.id, { email: user.email }, req.ip);

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: Boolean(user.is_active),
      is_active: Boolean(user.is_active)
    };

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        ...userData,
        token,
        user: userData
      }
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user) {
      await logActivity(req.user.id, 'LOGOUT', 'user', req.user.id, {}, req.ip);
    }
    res.clearCookie('us_token');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: Boolean(user.is_active),
      is_active: Boolean(user.is_active)
    };
    return res.json({ success: true, data: { ...userData, user: userData } });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { old_password, new_password } = req.body;
    const user = await userModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect.' });
    }
    const hash = await bcrypt.hash(new_password, 12);
    await userModel.updateUser(req.user.id, { password_hash: hash });

    // Need to update password_hash directly since updateUser only allows certain fields
    const db = require('../config/database');
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    await logActivity(req.user.id, 'CHANGE_PASSWORD', 'user', req.user.id, {}, req.ip);
    res.clearCookie('us_token');
    return res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (err) {
    next(err);
  }
}

async function setupAdmin(req, res, next) {
  try {
    const adminCount = await userModel.countAdmins();
    if (adminCount > 0) {
      return res.status(403).json({ success: false, message: 'Admin account already exists.' });
    }
    const { name, email, password, phone } = req.body;
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const id = await userModel.createUser({ name, email, password_hash, role: 'admin', phone });
    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      data: { id, name, email, role: 'admin' }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, getMe, changePassword, setupAdmin };

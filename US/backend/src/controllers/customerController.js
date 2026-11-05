'use strict';

const customerModel = require('../models/customerModel');
const { logActivity } = require('../middleware/auth');

async function createCustomer(req, res, next) {
  try {
    const existing = await customerModel.findByMobile(req.body.mobile);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A customer with this mobile number already exists.',
        data: { existing_id: existing.id, full_name: existing.full_name }
      });
    }
    const id = await customerModel.createCustomer({ ...req.body, created_by: req.user.id });
    await logActivity(req.user.id, 'CREATE_CUSTOMER', 'customer', id, { mobile: req.body.mobile }, req.ip);
    return res.status(201).json({ success: true, message: 'Customer created.', data: { id } });
  } catch (err) {
    next(err);
  }
}

async function getAllCustomers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', area = '', city = '' } = req.query;
    const result = await customerModel.getAllCustomers({
      page: parseInt(page), limit: parseInt(limit), search, area, city
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

async function getCustomerById(req, res, next) {
  try {
    const customer = await customerModel.findById(parseInt(req.params.id));
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    const callHistory = await customerModel.getCustomerCallHistory(customer.id);
    return res.json({ success: true, data: { ...customer, call_history: callHistory } });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await customerModel.findById(parseInt(id));
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    // Check mobile uniqueness if being changed
    if (req.body.mobile && req.body.mobile !== customer.mobile) {
      const dup = await customerModel.findByMobile(req.body.mobile);
      if (dup && dup.id !== parseInt(id)) {
        return res.status(409).json({ success: false, message: 'Mobile number already used by another customer.' });
      }
    }
    const affectedRows = await customerModel.updateCustomer(parseInt(id), req.body);
    await logActivity(req.user.id, 'UPDATE_CUSTOMER', 'customer', parseInt(id), req.body, req.ip);
    return res.json({ success: true, message: 'Customer updated.', data: { affectedRows } });
  } catch (err) {
    next(err);
  }
}

async function searchCustomers(req, res, next) {
  try {
    const query = req.query.query || req.query.mobile || req.query.search || '';
    const { page = 1, limit = 20 } = req.query;
    const result = await customerModel.searchCustomers({
      query, page: parseInt(page), limit: parseInt(limit)
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

async function lookupCustomer(req, res, next) {
  try {
    const mobile = req.query.mobile || req.query.phone || req.params.mobile;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }
    const clean = String(mobile).replace(/[\s\-\(\)]/g, '').trim();
    if (clean.length < 5) {
      return res.json({ success: true, data: null, is_new: true, message: 'Phone number too short.' });
    }
    const customer = await customerModel.lookupByMobile(clean);
    if (!customer) {
      return res.json({
        success: true,
        data: null,
        is_new: true,
        message: 'New customer (not in database).'
      });
    }
    return res.json({
      success: true,
      data: customer,
      is_new: false,
      message: 'Previous customer found.'
    });
  } catch (err) {
    next(err);
  }
}

async function getCustomerCalls(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await customerModel.findById(parseInt(id));
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    const calls = await customerModel.getCustomerCallHistory(parseInt(id));
    return res.json({ success: true, data: calls });
  } catch (err) {
    next(err);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await customerModel.findById(parseInt(id));
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    await customerModel.deleteCustomer(parseInt(id));
    await logActivity(req.user.id, 'DELETE_CUSTOMER', 'customer', parseInt(id), { name: customer.full_name }, req.ip);
    return res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getCustomerServiceDetails(req, res, next) {
  try {
    const { id } = req.params;
    const history = await customerModel.getCustomerFullServiceHistory(parseInt(id));
    if (!history) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    return res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  lookupCustomer,
  getCustomerCalls,
  getCustomerServiceDetails
};

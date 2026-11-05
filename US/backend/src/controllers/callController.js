'use strict';

const callModel = require('../models/callModel');
const serviceRequestModel = require('../models/serviceRequestModel');
const { logActivity } = require('../middleware/auth');

async function createCall(req, res, next) {
  try {
    const {
      customer_id, service_category_id, requirement, problem_description,
      urgency, call_source, preferred_date, preferred_time, internal_notes
    } = req.body;

    // Create call
    const { insertId: callDbId, callId } = await callModel.createCall({
      customer_id, service_category_id, requirement, problem_description,
      urgency, call_source, preferred_date, preferred_time,
      support_user_id: req.user.id, internal_notes
    });

    // Auto-create a linked service request
    const { insertId: requestDbId, requestId } = await serviceRequestModel.createRequest({
      customer_call_id: callDbId,
      customer_id,
      support_user_id: req.user.id,
      service_category_id,
      status: 'requirement_recorded',
      internal_notes
    });

    await logActivity(req.user.id, 'CREATE_CALL', 'call', callDbId, { callId, requestId }, req.ip);

    return res.status(201).json({
      success: true,
      message: 'Call logged and service request created.',
      data: { call_id: callId, call_db_id: callDbId, request_id: requestId, request_db_id: requestDbId }
    });
  } catch (err) {
    next(err);
  }
}

async function getAllCalls(req, res, next) {
  try {
    const { page = 1, limit = 20, status = '', supportUserId = '', dateFrom = '', dateTo = '' } = req.query;
    const resolvedUserId = req.user.role === 'support' ? req.user.id : supportUserId;
    const result = await callModel.getAllCalls({
      page: parseInt(page), limit: parseInt(limit),
      status, supportUserId: resolvedUserId, dateFrom, dateTo
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

async function getCallById(req, res, next) {
  try {
    const call = await callModel.findById(parseInt(req.params.id));
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found.' });
    }
    // Support users can only see their own calls
    if (req.user.role === 'support' && call.support_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
}

async function updateCall(req, res, next) {
  try {
    const { id } = req.params;
    const call = await callModel.findById(parseInt(id));
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found.' });
    }
    if (req.user.role === 'support' && call.support_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    await callModel.updateCall(parseInt(id), req.body);
    await logActivity(req.user.id, 'UPDATE_CALL', 'call', parseInt(id), req.body, req.ip);
    return res.json({ success: true, message: 'Call updated.' });
  } catch (err) {
    next(err);
  }
}

async function updateCallStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const call = await callModel.findById(parseInt(id));
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found.' });
    }
    await callModel.updateCallStatus(parseInt(id), status, req.user.id);
    await logActivity(req.user.id, 'UPDATE_CALL_STATUS', 'call', parseInt(id), { status }, req.ip);
    return res.json({ success: true, message: 'Call status updated.' });
  } catch (err) {
    next(err);
  }
}

async function addNote(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const call = await callModel.findById(parseInt(id));
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found.' });
    }
    const insertId = await callModel.addCallNote({
      customer_call_id: parseInt(id),
      note,
      created_by: req.user.id
    });
    return res.status(201).json({ success: true, message: 'Note added.', data: { id: insertId } });
  } catch (err) {
    next(err);
  }
}

async function getNotes(req, res, next) {
  try {
    const notes = await callModel.getCallNotes(parseInt(req.params.id));
    return res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
}

async function assignTechnician(req, res, next) {
  try {
    const { id } = req.params;
    const techId = req.body.technician_id || req.body.technicianId;
    const call = await callModel.findById(parseInt(id));
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found.' });
    }

    await callModel.updateCallStatus(parseInt(id), 'technician_assigned', req.user.id);

    let sr = await serviceRequestModel.findByCustomerCallId(parseInt(id));
    let serviceRequestId;
    if (sr) {
      serviceRequestId = sr.id;
      await serviceRequestModel.assignTechnician({
        serviceRequestId: sr.id,
        technicianId: parseInt(techId),
        assignedBy: req.user.id
      });
    } else {
      const created = await serviceRequestModel.createRequest({
        customer_call_id: parseInt(id),
        customer_id: call.customer_id,
        assigned_technician_id: parseInt(techId),
        support_user_id: req.user.id,
        service_category_id: call.service_category_id,
        status: 'technician_assigned',
        internal_notes: call.internal_notes
      });
      serviceRequestId = created.insertId;
      await serviceRequestModel.assignTechnician({
        serviceRequestId,
        technicianId: parseInt(techId),
        assignedBy: req.user.id
      });
    }

    await logActivity(req.user.id, 'ASSIGN_TECHNICIAN', 'call', parseInt(id), { technicianId: techId, serviceRequestId }, req.ip);
    return res.json({ success: true, message: 'Technician assigned to call.', data: { serviceRequestId, callId: parseInt(id) } });
  } catch (err) {
    next(err);
  }
}

async function getRecentCalls(req, res, next) {
  try {
    const calls = await callModel.getRecentCallsByUser(req.user.id, 10);
    return res.json({ success: true, data: calls });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCall,
  getAllCalls,
  getCallById,
  updateCall,
  updateCallStatus,
  addNote,
  getNotes,
  getRecentCalls,
  assignTechnician
};

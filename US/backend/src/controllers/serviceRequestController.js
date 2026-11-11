'use strict';

const db = require('../config/database');
const serviceRequestModel = require('../models/serviceRequestModel');
const callModel = require('../models/callModel');
const { logActivity } = require('../middleware/auth');
const { resolveCompanyName } = require('../utils/branding');

async function getAllRequests(req, res, next) {
  try {
    const { page = 1, limit = 20, status = '', supportUserId = '', technicianId = '', dateFrom = '', dateTo = '' } = req.query;
    const resolvedUserId = req.user.role === 'support' ? req.user.id : supportUserId;
    const result = await serviceRequestModel.getAllRequests({
      page: parseInt(page), limit: parseInt(limit),
      status, supportUserId: resolvedUserId, technicianId, dateFrom, dateTo
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

async function getRequestById(req, res, next) {
  try {
    const request = await serviceRequestModel.findById(parseInt(req.params.id));
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }
    if (req.user.role === 'support' && request.support_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

async function updateRequest(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await serviceRequestModel.findById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }
    await serviceRequestModel.updateRequest(parseInt(id), req.body);
    await logActivity(req.user.id, 'UPDATE_SERVICE_REQUEST', 'service_request', parseInt(id), req.body, req.ip);
    return res.json({ success: true, message: 'Service request updated.' });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const existing = await serviceRequestModel.findById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }
    await serviceRequestModel.updateStatus(parseInt(id), status, req.user.id, notes);
    await logActivity(req.user.id, 'UPDATE_SR_STATUS', 'service_request', parseInt(id), { status, notes }, req.ip);
    return res.json({ success: true, message: 'Status updated.' });
  } catch (err) {
    next(err);
  }
}

async function assignTechnician(req, res, next) {
  try {
    const { id } = req.params;
    const techId = req.body.technician_id || req.body.technicianId;
    if (!techId) {
      return res.status(400).json({ success: false, message: 'Valid technician_id required.' });
    }

    let target = await serviceRequestModel.findById(parseInt(id));
    if (!target) {
      // Check if ID is a customer_call_id
      target = await serviceRequestModel.findByCustomerCallId(parseInt(id));
    }
    if (!target) {
      // Check if call exists with this ID and auto-create the request
      const call = await callModel.findById(parseInt(id));
      if (call) {
        const created = await serviceRequestModel.createRequest({
          customer_call_id: call.id,
          customer_id: call.customer_id,
          support_user_id: req.user.id,
          service_category_id: call.service_category_id,
          status: 'requirement_recorded',
          internal_notes: call.internal_notes
        });
        target = await serviceRequestModel.findById(created.insertId);
      }
    }

    if (!target) {
      return res.status(404).json({ success: false, message: 'Service request or customer call not found.' });
    }

    const assignmentId = await serviceRequestModel.assignTechnician({
      serviceRequestId: target.id,
      technicianId: parseInt(techId),
      assignedBy: req.user.id
    });

    // Sync status to customer_calls if linked
    if (target.customer_call_id) {
      await db.query('UPDATE customer_calls SET status = ? WHERE id = ?', ['technician_assigned', target.customer_call_id]);
    }

    await logActivity(req.user.id, 'ASSIGN_TECHNICIAN', 'service_request', target.id, { technicianId: techId }, req.ip);
    const updated = await serviceRequestModel.findById(target.id);
    return res.json({
      success: true,
      message: 'Technician assigned successfully.',
      data: {
        assignmentId,
        serviceRequestId: target.id,
        callId: target.customer_call_id,
        dispatchDetails: updated
      }
    });
  } catch (err) {
    next(err);
  }
}

async function reassignTechnician(req, res, next) {
  try {
    const { id } = req.params;
    const techId = req.body.technician_id || req.body.technicianId;
    if (!techId) {
      return res.status(400).json({ success: false, message: 'Valid technician_id required.' });
    }

    let target = await serviceRequestModel.findById(parseInt(id));
    if (!target) {
      target = await serviceRequestModel.findByCustomerCallId(parseInt(id));
    }
    if (!target) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    const assignmentId = await serviceRequestModel.reassignTechnician(target.id, parseInt(techId), req.user.id);

    if (target.customer_call_id) {
      await db.query('UPDATE customer_calls SET status = ? WHERE id = ?', ['technician_assigned', target.customer_call_id]);
    }

    await logActivity(req.user.id, 'REASSIGN_TECHNICIAN', 'service_request', target.id, { technicianId: techId }, req.ip);
    const updated = await serviceRequestModel.findById(target.id);
    return res.json({
      success: true,
      message: 'Technician reassigned successfully.',
      data: {
        assignmentId,
        serviceRequestId: target.id,
        callId: target.customer_call_id,
        dispatchDetails: updated
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;
    const affectedRows = await serviceRequestModel.updateAssignment(parseInt(assignmentId), req.body);
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }
    return res.json({ success: true, message: 'Assignment updated.' });
  } catch (err) {
    next(err);
  }
}

async function getStatusHistory(req, res, next) {
  try {
    const { id } = req.params;
    const history = await serviceRequestModel.getStatusHistory(parseInt(id));
    return res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

async function getDispatchDetails(req, res, next) {
  try {
    const { id } = req.params;
    let target = await serviceRequestModel.findById(parseInt(id));
    if (!target) {
      target = await serviceRequestModel.findByCustomerCallId(parseInt(id));
    }
    if (!target) {
      return res.status(404).json({ success: false, message: 'Service request or call not found.' });
    }
    return res.json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
}

async function completeRequest(req, res, next) {
  try {
    const { id } = req.params;
    let target = await serviceRequestModel.findById(parseInt(id));
    if (!target) {
      target = await serviceRequestModel.findByCustomerCallId(parseInt(id));
    }
    if (!target) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    await serviceRequestModel.completeRequest(target.id, req.body, req.user.id);
    await logActivity(req.user.id, 'COMPLETE_SERVICE_REQUEST', 'service_request', target.id, req.body, req.ip);

    const updated = await serviceRequestModel.findById(target.id);
    return res.json({
      success: true,
      message: 'Service request completed and work/billing recorded successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function getSubmissionLink(req, res, next) {
  try {
    const { id } = req.params;
    let target = await serviceRequestModel.findById(parseInt(id));
    if (!target) {
      target = await serviceRequestModel.findByCustomerCallId(parseInt(id));
    }
    if (!target) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    const token = await serviceRequestModel.getOrGenerateSubmissionToken(target.id);
    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
    const submissionUrl = `${origin}/job-report/${token}`;

    // Fetch custom branding & template from platform_settings if present
    let companyName = '';
    let platformName = '';
    let template = null;
    try {
      const [settingRows] = await db.query(
        `SELECT setting_key, setting_value FROM platform_settings 
         WHERE setting_key IN ('company_name', 'platform_name', 'report_link_whatsapp_template')`
      );
      for (const row of settingRows) {
        if (row.setting_key === 'company_name' && row.setting_value) companyName = row.setting_value;
        if (row.setting_key === 'platform_name' && row.setting_value) platformName = row.setting_value;
        if (row.setting_key === 'report_link_whatsapp_template' && row.setting_value) template = row.setting_value;
      }
    } catch (e) { }

    const resolvedBrandName = resolveCompanyName({ company_name: companyName, platform_name: platformName });
    let defaultMessage = '';
    const reqItems = '• Enter total amount collected from customer\n• Mention parts replaced (if any)\n• Upload 1 photo of the repaired machine / appliance';
    if (template && template.trim()) {
      defaultMessage = template
        .replace(/\{\{\s*(platform_name|company_name)\s*\}\}/gi, resolvedBrandName)
        .replace(/\{\{\s*technician_name\s*\}\}/gi, target.technician_name || 'Technician')
        .replace(/\{\{\s*job_id\s*\}\}/gi, target.request_id || target.id)
        .replace(/\{\{\s*customer_name\s*\}\}/gi, `${target.customer_name || 'Customer'} (${target.customer_area || 'Pune'})`)
        .replace(/\{\{\s*service_category\s*\}\}/gi, target.service_category_name || 'Appliance Service')
        .replace(/\{\{\s*report_link\s*\}\}/gi, submissionUrl)
        .replace(/\{\{\s*required_items\s*\}\}/gi, reqItems)
        .trim();
    } else {
      defaultMessage = `🛠️ *${resolvedBrandName.toUpperCase()} - WORK COMPLETION REPORT* 🛠️
━━━━━━━━━━━━━━━━━━━━
Hi *${target.technician_name || 'Technician'}*,
Please submit your work report for Job *#${target.request_id || target.id}*:

👤 *Customer:* ${target.customer_name || 'Customer'} (${target.customer_area || 'Pune'})
🔧 *Category:* ${target.service_category_name || 'Appliance Service'}

👉 *Click here to submit charges, parts replaced & machine photo:*
${submissionUrl}

📌 *Required Information:*
${reqItems}

Please submit this immediately after completing the service. Thank you!`.trim();
    }

    return res.json({
      success: true,
      data: {
        token,
        submissionUrl,
        technicianId: target.assigned_technician_id,
        technicianName: target.technician_name,
        technicianMobile: target.technician_mobile,
        customerName: target.customer_name,
        customerArea: target.customer_area,
        categoryName: target.service_category_name,
        jobId: target.request_id || target.id,
        status: target.status,
        whatsappMessage: defaultMessage
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRequests,
  getRequestById,
  updateRequest,
  updateStatus,
  completeRequest,
  assignTechnician,
  reassignTechnician,
  updateAssignment,
  getStatusHistory,
  getDispatchDetails,
  getSubmissionLink
};

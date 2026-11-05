'use strict';

const router = require('express').Router();
const db = require('../config/database');
const machinePhotoUpload = require('../config/machinePhotoMulter');
const serviceRequestModel = require('../models/serviceRequestModel');
const { accrueCommissionForServiceRequest } = require('../controllers/technicianPlanController');

// GET /api/v1/public/job-report/:token - Fetch job details for technician submission
router.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const target = await serviceRequestModel.findBySubmissionToken(token);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired job submission link. Please contact Karigar Setu admin.'
      });
    }

    return res.json({
      success: true,
      data: {
        id: target.id,
        requestId: target.request_id,
        status: target.status,
        customerName: target.customer_name,
        customerArea: target.customer_area,
        customerCity: target.customer_city || 'Pune',
        customerPhone: target.customer_mobile,
        customerAddress: target.customer_address,
        serviceCategory: target.service_category_name || 'Appliance Service',
        requirement: target.requirement || target.problem_description,
        technicianName: target.technician_name,
        technicianPhone: target.technician_mobile,
        scheduledDate: target.scheduled_date,
        scheduledTime: target.scheduled_time,
        workDescription: target.work_description || '',
        partsReplaced: target.parts_replaced || '',
        laborCharge: target.labor_charge || 0,
        partsCharge: target.parts_charge || 0,
        finalAmount: target.final_amount || 0,
        paymentStatus: target.payment_status || 'paid',
        paymentMode: target.payment_mode || 'cash',
        machinePhotoUrl: target.machine_photo_url || null,
        technicianRemarks: target.technician_remarks || '',
        completedAt: target.completed_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/public/job-report/:token - Technician submits work done, charges, parts, and machine photo
router.post('/:token', (req, res, next) => {
  machinePhotoUpload.single('machine_photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { token } = req.params;
      const target = await serviceRequestModel.findBySubmissionToken(token);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired job submission link.'
        });
      }

      const body = req.body || {};
      const workDesc = body.work_description || body.workDescription || null;
      const partsReplaced = body.parts_replaced || body.partsReplaced || null;
      const labor = parseFloat(body.labor_charge || body.laborCharge || 0);
      const partsCharge = parseFloat(body.parts_charge || body.partsCharge || 0);
      let totalAmount = parseFloat(body.final_amount || body.finalAmount || body.amountTaken || 0);
      if (!totalAmount && (labor > 0 || partsCharge > 0)) {
        totalAmount = labor + partsCharge;
      }
      const payStatus = body.payment_status || body.paymentStatus || 'paid';
      const payMode = body.payment_mode || body.paymentMode || 'cash';
      const remarks = body.technician_remarks || body.technicianRemarks || null;
      const photoUrl = req.file
        ? `/uploads/machine_photos/${req.file.filename}`
        : body.machine_photo_url || target.machine_photo_url || null;

      // Update service request status to 'completed'
      await db.query(
        `UPDATE service_requests 
         SET status = 'completed',
             work_description = ?,
             parts_replaced = ?,
             labor_charge = ?,
             parts_charge = ?,
             final_amount = ?,
             payment_status = ?,
             payment_mode = ?,
             technician_remarks = ?,
             machine_photo_url = ?,
             completed_at = NOW()
         WHERE id = ?`,
        [
          workDesc,
          partsReplaced,
          labor,
          partsCharge,
          totalAmount,
          payStatus,
          payMode,
          remarks,
          photoUrl,
          target.id
        ]
      );

      // Sync customer_calls status to 'completed' if linked
      if (target.customer_call_id) {
        await db.query('UPDATE customer_calls SET status = ? WHERE id = ?', ['completed', target.customer_call_id]);
      }

      // Update technician availability back to 'available' and increment completed total_jobs
      if (target.assigned_technician_id) {
        await db.query(
          `UPDATE technicians 
           SET availability = 'available', 
               total_jobs = COALESCE(total_jobs, 0) + 1 
           WHERE id = ?`,
          [target.assigned_technician_id]
        );

        // Mark visit as confirmed in technician_assignments
        await db.query(
          `UPDATE technician_assignments 
           SET visit_confirmed = 1 
           WHERE service_request_id = ? AND technician_id = ?`,
          [target.id, target.assigned_technician_id]
        );

        // Auto-accrue commission for technician if on commission plan
        try {
          await accrueCommissionForServiceRequest(target.id, null);
        } catch (planErr) {
          console.warn('Could not accrue commission for completed job:', planErr.message);
        }
      }

      // Record in status history
      await db.query(
        `INSERT INTO service_status_history
         (service_request_id, old_status, new_status, notes)
         VALUES (?, ?, ?, ?)`,
        [
          target.id,
          target.status,
          'completed',
          `Technician self-reported via online submission link. Amount: ₹${totalAmount}${photoUrl ? ' (Machine photo uploaded)' : ''}`
        ]
      );

      // Notify support user / admin
      try {
        const notifyUserId = target.support_user_id || 1;
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
           VALUES (?, ?, ?, 'service_completed', 'service_request', ?)`,
          [
            notifyUserId,
            `Job #${target.request_id} Completed`,
            `Technician ${target.technician_name || ''} completed job #${target.request_id}. Amount collected: ₹${totalAmount}${partsReplaced ? ' (Parts: ' + partsReplaced + ')' : ''}`,
            target.id
          ]
        );
      } catch (notifErr) {
        console.warn('Could not insert notification:', notifErr.message);
      }

      const updated = await serviceRequestModel.findById(target.id);
      return res.json({
        success: true,
        message: 'Job completion report & machine photo submitted successfully!',
        data: updated
      });
    } catch (innerErr) {
      next(innerErr);
    }
  });
});

module.exports = router;


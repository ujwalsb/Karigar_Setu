'use strict';

const db = require('../config/database');
const { logActivity } = require('../middleware/auth');

/**
 * Automatically accrue commission when a service request is completed
 * Only applies if the assigned technician is on the 'commission' plan.
 */
async function accrueCommissionForServiceRequest(serviceRequestId, recordedByUserId = null) {
  try {
    const [srRows] = await db.query(
      `SELECT sr.id, sr.request_id, sr.assigned_technician_id, 
              COALESCE(NULLIF(sr.final_amount, 0), (COALESCE(sr.labor_charge, 0) + COALESCE(sr.parts_charge, 0)), 0) AS calculated_amount,
              t.id AS tech_id, t.full_name AS tech_name, t.plan_type, t.commission_rate_type, t.commission_rate
       FROM service_requests sr
       JOIN technicians t ON sr.assigned_technician_id = t.id
       WHERE sr.id = ?`,
      [serviceRequestId]
    );

    if (!srRows.length) return null;
    const sr = srRows[0];

    // Only apply if technician is on commission plan
    if (sr.plan_type !== 'commission') return null;

    const finalAmount = parseFloat(sr.calculated_amount || 0);
    const rate = parseFloat(sr.commission_rate !== null && sr.commission_rate !== undefined ? sr.commission_rate : 10.00);
    const rateType = sr.commission_rate_type || 'percentage';

    let commissionAmount = 0;
    if (rateType === 'percentage') {
      commissionAmount = Math.round((finalAmount * (rate / 100)) * 100) / 100;
    } else {
      commissionAmount = finalAmount > 0 ? rate : 0;
    }

    const note = `Auto commission (${rate}${rateType === 'percentage' ? '%' : ' flat'}) on job #${sr.request_id} (Total billed: ₹${finalAmount})`;

    // Check if commission already accrued for this service request
    const [existingTx] = await db.query(
      `SELECT id, amount, payment_status FROM technician_plan_transactions 
       WHERE service_request_id = ? AND transaction_type = 'commission_due'`,
      [serviceRequestId]
    );

    if (existingTx.length > 0) {
      // If existing transaction is pending, update amount with latest final_amount & rate
      if (existingTx[0].payment_status === 'pending') {
        await db.query(
          `UPDATE technician_plan_transactions 
           SET amount = ?, reference_note = ?
           WHERE id = ?`,
          [commissionAmount, note, existingTx[0].id]
        );
      }
      return existingTx[0].id;
    }

    const [txResult] = await db.query(
      `INSERT INTO technician_plan_transactions
       (technician_id, plan_type, service_request_id, transaction_type, amount, payment_status, payment_mode, reference_note, recorded_by)
       VALUES (?, 'commission', ?, 'commission_due', ?, 'pending', 'cash', ?, ?)`,
      [sr.tech_id, sr.id, commissionAmount, note, recordedByUserId]
    );

    return txResult.insertId;
  } catch (err) {
    console.error('Error accruing commission for service request:', err.message);
    return null;
  }
}

/**
 * Synchronize all completed jobs for technicians on commission plan.
 * Ensures transactions exist and pending uncollected dues reflect current plan rates.
 */
async function syncAllCompletedCommissions() {
  try {
    const [rows] = await db.query(`
      SELECT 
        sr.id AS sr_id, 
        sr.request_id, 
        sr.assigned_technician_id, 
        COALESCE(NULLIF(sr.final_amount, 0), (COALESCE(sr.labor_charge, 0) + COALESCE(sr.parts_charge, 0)), 0) AS final_amount,
        t.id AS tech_id, 
        t.plan_type, 
        t.commission_rate_type, 
        t.commission_rate
      FROM service_requests sr
      JOIN technicians t ON sr.assigned_technician_id = t.id
      WHERE sr.status = 'completed' AND t.plan_type = 'commission'
    `);

    for (const sr of rows) {
      const finalAmount = parseFloat(sr.final_amount || 0);
      const rate = parseFloat(sr.commission_rate !== null && sr.commission_rate !== undefined ? sr.commission_rate : 10.00);
      const rateType = sr.commission_rate_type || 'percentage';

      let commissionAmount = 0;
      if (rateType === 'percentage') {
        commissionAmount = Math.round((finalAmount * (rate / 100)) * 100) / 100;
      } else {
        commissionAmount = finalAmount > 0 ? rate : 0;
      }

      const note = `Auto commission (${rate}${rateType === 'percentage' ? '%' : ' flat'}) on job #${sr.request_id} (Total billed: ₹${finalAmount})`;

      const [existing] = await db.query(
        `SELECT id, amount, payment_status FROM technician_plan_transactions 
         WHERE service_request_id = ? AND transaction_type = 'commission_due'`,
        [sr.sr_id]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO technician_plan_transactions
           (technician_id, plan_type, service_request_id, transaction_type, amount, payment_status, payment_mode, reference_note)
           VALUES (?, 'commission', ?, 'commission_due', ?, 'pending', 'cash', ?)`,
          [sr.tech_id, sr.sr_id, commissionAmount, note]
        );
      } else if (existing[0].payment_status === 'pending') {
        await db.query(
          `UPDATE technician_plan_transactions 
           SET amount = ?, reference_note = ?
           WHERE id = ?`,
          [commissionAmount, note, existing[0].id]
        );
      }
    }
  } catch (err) {
    console.warn('syncAllCompletedCommissions error:', err.message);
  }
}

/**
 * GET /api/v1/technician-plans
 * Returns aggregated statistics and all technicians with their plan settings & balances
 */
async function getAllTechnicianPlans(req, res, next) {
  try {
    const { plan_type, search, status } = req.query;

    // Run synchronization check so that any recent or updated commissions are aligned
    await syncAllCompletedCommissions();

    // 1. Fetch platform summary KPIs
    const [summaryRows] = await db.query(`
      SELECT 
        COUNT(DISTINCT t.id) AS total_technicians,
        SUM(CASE WHEN t.plan_type = 'commission' THEN 1 ELSE 0 END) AS commission_technicians,
        SUM(CASE WHEN t.plan_type = 'monthly' THEN 1 ELSE 0 END) AS monthly_technicians,
        SUM(CASE WHEN t.plan_type = 'monthly' AND (t.subscription_end_date IS NULL OR t.subscription_end_date >= CURDATE()) AND t.subscription_status = 'active' THEN 1 ELSE 0 END) AS active_monthly_subscriptions,
        SUM(CASE WHEN t.plan_type = 'monthly' AND (t.subscription_end_date < CURDATE() OR t.subscription_status = 'expired') THEN 1 ELSE 0 END) AS expired_monthly_subscriptions
      FROM technicians t
      WHERE t.deleted_at IS NULL
    `);

    const [txSummaryRows] = await db.query(`
      SELECT
        SUM(CASE WHEN transaction_type = 'commission_due' THEN amount ELSE 0 END) AS total_commission_accrued,
        SUM(CASE WHEN transaction_type = 'payment_collected' THEN amount ELSE 0 END) AS total_commission_collected,
        SUM(CASE WHEN transaction_type = 'monthly_subscription' AND payment_status = 'paid' THEN amount ELSE 0 END) AS total_monthly_revenue
      FROM technician_plan_transactions
    `);

    // 2. Fetch technician billing data
    let query = `
      SELECT 
        t.id, 
        t.full_name, 
        t.mobile, 
        t.alternate_mobile, 
        t.email, 
        t.area, 
        t.city, 
        t.photo_url,
        t.rating, 
        t.total_jobs, 
        t.status, 
        t.availability,
        t.plan_type, 
        t.commission_rate_type, 
        t.commission_rate, 
        t.monthly_fee,
        t.subscription_status, 
        DATE_FORMAT(t.subscription_start_date, '%Y-%m-%d') AS subscription_start_date, 
        DATE_FORMAT(t.subscription_end_date, '%Y-%m-%d') AS subscription_end_date,
        CASE 
          WHEN t.subscription_end_date IS NULL THEN NULL
          ELSE DATEDIFF(t.subscription_end_date, CURDATE())
        END AS days_remaining,
        COALESCE(sr_stats.completed_count, 0) AS completed_jobs,
        COALESCE(sr_stats.total_billed, 0.00) AS total_revenue_billed,
        COALESCE(tx_stats.commission_due, 0.00) AS total_commission_due,
        COALESCE(tx_stats.commission_collected, 0.00) AS total_commission_collected,
        GREATEST(0, (COALESCE(tx_stats.commission_due, 0.00) - COALESCE(tx_stats.commission_collected, 0.00))) AS commission_balance,
        COALESCE(tx_stats.monthly_paid, 0.00) AS total_monthly_paid,
        tx_stats.last_transaction_date,
        tx_stats.pending_tx_count
      FROM technicians t
      LEFT JOIN (
        SELECT 
          assigned_technician_id,
          COUNT(*) AS completed_count,
          SUM(COALESCE(NULLIF(final_amount, 0), (COALESCE(labor_charge, 0) + COALESCE(parts_charge, 0)), 0)) AS total_billed
        FROM service_requests
        WHERE status = 'completed' AND assigned_technician_id IS NOT NULL
        GROUP BY assigned_technician_id
      ) sr_stats ON sr_stats.assigned_technician_id = t.id
      LEFT JOIN (
        SELECT 
          technician_id,
          SUM(CASE WHEN transaction_type = 'commission_due' THEN amount ELSE 0 END) AS commission_due,
          SUM(CASE WHEN transaction_type = 'payment_collected' THEN amount ELSE 0 END) AS commission_collected,
          SUM(CASE WHEN transaction_type = 'monthly_subscription' AND payment_status = 'paid' THEN amount ELSE 0 END) AS monthly_paid,
          SUM(CASE WHEN transaction_type = 'commission_due' AND payment_status = 'pending' THEN 1 ELSE 0 END) AS pending_tx_count,
          MAX(created_at) AS last_transaction_date
        FROM technician_plan_transactions
        GROUP BY technician_id
      ) tx_stats ON tx_stats.technician_id = t.id
      WHERE t.deleted_at IS NULL
    `;

    const params = [];
    if (plan_type && plan_type !== 'all') {
      query += ` AND t.plan_type = ?`;
      params.push(plan_type);
    }
    if (status && status !== 'all') {
      if (status === 'active_sub') {
        query += ` AND t.plan_type = 'monthly' AND (t.subscription_end_date IS NULL OR t.subscription_end_date >= CURDATE()) AND t.subscription_status = 'active'`;
      } else if (status === 'expired_sub') {
        query += ` AND t.plan_type = 'monthly' AND (t.subscription_end_date < CURDATE() OR t.subscription_status = 'expired')`;
      } else if (status === 'due_commission') {
        query += ` AND (COALESCE(tx_stats.commission_due, 0) - COALESCE(tx_stats.commission_collected, 0)) > 0`;
      } else {
        query += ` AND t.status = ?`;
        params.push(status);
      }
    }
    if (search) {
      query += ` AND (t.full_name LIKE ? OR t.mobile LIKE ? OR t.area LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.full_name ASC`;

    const [rows] = await db.query(query, params);

    // Normalize output data
    let sumPendingCommission = 0;
    const technicians = rows.map((tech) => {
      const isMonthlyExpired = tech.plan_type === 'monthly' && (tech.days_remaining !== null && tech.days_remaining < 0 || tech.subscription_status === 'expired');
      const commissionBalance = Math.max(0, parseFloat(tech.commission_balance || 0));
      if (tech.plan_type === 'commission') {
        sumPendingCommission += commissionBalance;
      }
      return {
        ...tech,
        commission_rate: parseFloat(tech.commission_rate !== null && tech.commission_rate !== undefined ? tech.commission_rate : 10.00),
        monthly_fee: parseFloat(tech.monthly_fee || 999.00),
        completed_jobs: parseInt(tech.completed_jobs || 0),
        total_revenue_billed: parseFloat(tech.total_revenue_billed || 0),
        total_commission_due: parseFloat(tech.total_commission_due || 0),
        total_commission_collected: parseFloat(tech.total_commission_collected || 0),
        commission_balance: commissionBalance,
        total_monthly_paid: parseFloat(tech.total_monthly_paid || 0),
        days_remaining: tech.days_remaining !== null ? parseInt(tech.days_remaining) : null,
        is_subscription_expired: isMonthlyExpired
      };
    });

    const summary = {
      totalTechnicians: parseInt(summaryRows[0]?.total_technicians || 0),
      commissionTechnicians: parseInt(summaryRows[0]?.commission_technicians || 0),
      monthlyTechnicians: parseInt(summaryRows[0]?.monthly_technicians || 0),
      activeMonthlySubscriptions: parseInt(summaryRows[0]?.active_monthly_subscriptions || 0),
      expiredMonthlySubscriptions: parseInt(summaryRows[0]?.expired_monthly_subscriptions || 0),
      totalCommissionAccrued: parseFloat(txSummaryRows[0]?.total_commission_accrued || 0),
      totalCommissionCollected: parseFloat(txSummaryRows[0]?.total_commission_collected || 0),
      totalCommissionPending: Math.round(sumPendingCommission * 100) / 100,
      totalMonthlyRevenue: parseFloat(txSummaryRows[0]?.total_monthly_revenue || 0)
    };

    return res.json({
      success: true,
      data: {
        summary,
        technicians
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/technician-plans/:id
 * Update technician plan configuration (switch between commission and monthly, set rates)
 */
async function updateTechnicianPlan(req, res, next) {
  try {
    const { id } = req.params;
    const {
      plan_type,
      commission_rate_type,
      commission_rate,
      monthly_fee,
      subscription_status,
      subscription_start_date,
      subscription_end_date,
      extend_days
    } = req.body;

    const [existing] = await db.query('SELECT * FROM technicians WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }

    const tech = existing[0];
    const updates = [];
    const values = [];

    if (plan_type) {
      updates.push('plan_type = ?');
      values.push(plan_type);
    }
    if (commission_rate_type) {
      updates.push('commission_rate_type = ?');
      values.push(commission_rate_type);
    }
    if (commission_rate !== undefined) {
      updates.push('commission_rate = ?');
      values.push(parseFloat(commission_rate));
    }
    if (monthly_fee !== undefined) {
      updates.push('monthly_fee = ?');
      values.push(parseFloat(monthly_fee));
    }
    if (subscription_status) {
      updates.push('subscription_status = ?');
      values.push(subscription_status);
    }
    if (subscription_start_date !== undefined) {
      updates.push('subscription_start_date = ?');
      values.push(subscription_start_date || null);
    }
    if (subscription_end_date !== undefined) {
      updates.push('subscription_end_date = ?');
      values.push(subscription_end_date || null);
    }

    // Auto-extend subscription if extend_days is provided
    if (extend_days && parseInt(extend_days) > 0) {
      updates.push('subscription_end_date = DATE_ADD(GREATEST(COALESCE(subscription_end_date, CURDATE()), CURDATE()), INTERVAL ? DAY)');
      values.push(parseInt(extend_days));
      updates.push("subscription_status = 'active'");
    }

    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE technicians SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // If technician is on commission plan, re-sync uncollected transactions with updated rate
    if ((plan_type || tech.plan_type) === 'commission') {
      await syncAllCompletedCommissions();
    }

    await logActivity(req.user.id, 'UPDATE_TECHNICIAN_PLAN', 'technician', id, req.body, req.ip);

    const [updatedRows] = await db.query('SELECT * FROM technicians WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Technician plan updated successfully.',
      data: updatedRows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/technician-plans/:id/payment
 * Record a payment (Commission collection or Monthly subscription renewal)
 */
async function recordTechnicianPayment(req, res, next) {
  try {
    const { id } = req.params;
    const {
      payment_type, // 'commission_collection' | 'monthly_renewal'
      amount,
      payment_mode = 'cash',
      reference_note = '',
      service_request_id = null,
      renewal_days = 30
    } = req.body;

    const [existing] = await db.query('SELECT * FROM technicians WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }

    const tech = existing[0];
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    let txType = 'payment_collected';
    let planType = tech.plan_type || 'commission';
    let note = reference_note;

    if (payment_type === 'monthly_renewal') {
      txType = 'monthly_subscription';
      planType = 'monthly';
      const days = parseInt(renewal_days) || 30;
      note = note || `Monthly subscription renewal (${days} days) - Plan fee: ₹${numAmount}`;

      // Insert transaction
      await db.query(
        `INSERT INTO technician_plan_transactions
         (technician_id, plan_type, service_request_id, transaction_type, amount, payment_status, payment_mode, reference_note, recorded_by)
         VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?)`,
        [id, planType, null, txType, numAmount, payment_mode, note, req.user.id]
      );

      // Extend subscription dates
      await db.query(
        `UPDATE technicians 
         SET subscription_status = 'active',
             subscription_start_date = COALESCE(subscription_start_date, CURDATE()),
             subscription_end_date = DATE_ADD(GREATEST(COALESCE(subscription_end_date, CURDATE()), CURDATE()), INTERVAL ? DAY)
         WHERE id = ?`,
        [days, id]
      );
    } else {
      // Commission collection
      txType = 'payment_collected';
      planType = 'commission';
      note = note || `Commission collected by admin: ₹${numAmount}`;

      await db.query(
        `INSERT INTO technician_plan_transactions
         (technician_id, plan_type, service_request_id, transaction_type, amount, payment_status, payment_mode, reference_note, recorded_by)
         VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?)`,
        [id, planType, service_request_id || null, txType, numAmount, payment_mode, note, req.user.id]
      );

      // If specific service request was provided, mark that transaction as paid
      if (service_request_id) {
        await db.query(
          `UPDATE technician_plan_transactions 
           SET payment_status = 'paid' 
           WHERE service_request_id = ? AND transaction_type = 'commission_due'`,
          [service_request_id]
        );
      } else {
        // Automatically settle oldest pending commission_due transactions up to numAmount
        let remainingToSettle = numAmount;
        const [pendingTxs] = await db.query(
          `SELECT id, amount FROM technician_plan_transactions
           WHERE technician_id = ? AND transaction_type = 'commission_due' AND payment_status = 'pending'
           ORDER BY id ASC`,
          [id]
        );

        for (const pTx of pendingTxs) {
          if (remainingToSettle <= 0) break;
          const pAmt = parseFloat(pTx.amount || 0);
          if (remainingToSettle >= pAmt) {
            await db.query(`UPDATE technician_plan_transactions SET payment_status = 'paid' WHERE id = ?`, [pTx.id]);
            remainingToSettle -= pAmt;
          } else {
            // Partially settled
            remainingToSettle = 0;
          }
        }
      }
    }

    await logActivity(req.user.id, 'RECORD_TECHNICIAN_PAYMENT', 'technician_plan', id, {
      payment_type,
      amount: numAmount,
      payment_mode,
      note
    }, req.ip);

    // Fetch updated summary for this technician
    const [balanceRows] = await db.query(
      `SELECT 
         SUM(CASE WHEN transaction_type = 'commission_due' THEN amount ELSE 0 END) AS total_due,
         SUM(CASE WHEN transaction_type = 'payment_collected' THEN amount ELSE 0 END) AS total_collected
       FROM technician_plan_transactions
       WHERE technician_id = ?`,
      [id]
    );

    const [updatedTech] = await db.query('SELECT * FROM technicians WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: payment_type === 'monthly_renewal' ? 'Monthly subscription renewed successfully!' : 'Commission payment collected and recorded successfully!',
      data: {
        technician: updatedTech[0],
        totalDue: parseFloat(balanceRows[0]?.total_due || 0),
        totalCollected: parseFloat(balanceRows[0]?.total_collected || 0),
        balanceRemaining: Math.max(0, parseFloat(balanceRows[0]?.total_due || 0) - parseFloat(balanceRows[0]?.total_collected || 0))
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/technician-plans/:id/ledger
 * Return detailed transaction ledger for a technician
 */
async function getTechnicianLedger(req, res, next) {
  try {
    const { id } = req.params;

    const [techRows] = await db.query('SELECT id, full_name, mobile, plan_type, commission_rate, monthly_fee, subscription_status, subscription_start_date, subscription_end_date FROM technicians WHERE id = ?', [id]);
    if (!techRows.length) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }

    const [transactions] = await db.query(
      `SELECT 
         tx.id,
         tx.technician_id,
         tx.plan_type,
         tx.service_request_id,
         tx.transaction_type,
         tx.amount,
         tx.payment_status,
         tx.payment_mode,
         tx.reference_note,
         tx.created_at,
         sr.request_id AS service_request_code,
         sr.final_amount AS service_final_amount,
         sr.customer_id,
         c.full_name AS customer_name,
         u.name AS recorded_by_name
       FROM technician_plan_transactions tx
       LEFT JOIN service_requests sr ON tx.service_request_id = sr.id
       LEFT JOIN customers c ON sr.customer_id = c.id
       LEFT JOIN users u ON tx.recorded_by = u.id
       WHERE tx.technician_id = ?
       ORDER BY tx.created_at DESC, tx.id DESC`,
      [id]
    );

    // Calculate balances
    let totalCommissionDue = 0;
    let totalCommissionCollected = 0;
    let totalMonthlyPaid = 0;

    for (const t of transactions) {
      const amt = parseFloat(t.amount || 0);
      if (t.transaction_type === 'commission_due') totalCommissionDue += amt;
      if (t.transaction_type === 'payment_collected') totalCommissionCollected += amt;
      if (t.transaction_type === 'monthly_subscription' && t.payment_status === 'paid') totalMonthlyPaid += amt;
    }

    return res.json({
      success: true,
      data: {
        technician: techRows[0],
        totals: {
          totalCommissionDue,
          totalCommissionCollected,
          outstandingBalance: Math.max(0, totalCommissionDue - totalCommissionCollected),
          totalMonthlyPaid
        },
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  accrueCommissionForServiceRequest,
  syncAllCompletedCommissions,
  getAllTechnicianPlans,
  updateTechnicianPlan,
  recordTechnicianPayment,
  getTechnicianLedger
};


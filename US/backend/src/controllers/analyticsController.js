'use strict';

const analyticsModel = require('../models/analyticsModel');
const { exportToExcel, exportToCSV } = require('../utils/excelExport');

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.role === 'support' ? req.user.id : null;
    const stats = await analyticsModel.getDashboardStats(req.user.role, userId);
    return res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

async function getCallsChart(req, res, next) {
  try {
    const { period = '7days' } = req.query;
    const userId = req.user.role === 'support' ? req.user.id : null;
    const data = await analyticsModel.getCallsOverTime({ period, userId });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getCategoryBreakdown(req, res, next) {
  try {
    const data = await analyticsModel.getServiceCategoryBreakdown();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getAreaDemand(req, res, next) {
  try {
    const data = await analyticsModel.getAreaWiseDemand();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getEmployeePerformance(req, res, next) {
  try {
    const { dateFrom = '', dateTo = '' } = req.query;
    const data = await analyticsModel.getEmployeePerformance({ dateFrom, dateTo });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getTechnicianPerformance(req, res, next) {
  try {
    const { dateFrom = '', dateTo = '' } = req.query;
    const data = await analyticsModel.getTechnicianPerformance({ dateFrom, dateTo });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function exportReport(req, res, next) {
  try {
    const { type = 'calls', format = 'excel', dateFrom = '', dateTo = '' } = req.query;
    let data = [];
    let columns = [];
    let sheetName = 'Report';

    if (type === 'calls') {
      data = await analyticsModel.getCallsOverTime({ period: 'custom', userId: null });
      columns = [
        { key: 'date', header: 'Date' },
        { key: 'count', header: 'Total Calls' }
      ];
      sheetName = 'Calls Over Time';
    } else if (type === 'employee_performance') {
      data = await analyticsModel.getEmployeePerformance({ dateFrom, dateTo });
      columns = [
        { key: 'name', header: 'Employee Name' },
        { key: 'total_calls', header: 'Total Calls' },
        { key: 'completed_calls', header: 'Completed' },
        { key: 'emergency_handled', header: 'Emergency Calls' }
      ];
      sheetName = 'Employee Performance';
    } else if (type === 'technician_performance') {
      data = await analyticsModel.getTechnicianPerformance({ dateFrom, dateTo });
      columns = [
        { key: 'full_name', header: 'Technician Name' },
        { key: 'mobile', header: 'Mobile' },
        { key: 'total_assignments', header: 'Total Assignments' },
        { key: 'completed_jobs', header: 'Completed Jobs' },
        { key: 'verification_status', header: 'Verification' }
      ];
      sheetName = 'Technician Performance';
    } else if (type === 'area_demand') {
      data = await analyticsModel.getAreaWiseDemand();
      columns = [
        { key: 'area', header: 'Area' },
        { key: 'city', header: 'City' },
        { key: 'call_count', header: 'Calls' }
      ];
      sheetName = 'Area Demand';
    }

    if (format === 'csv') {
      const csv = exportToCSV(data, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${sheetName.replace(/ /g, '_')}.csv"`);
      return res.send(csv);
    }

    const buffer = exportToExcel(data, columns, sheetName);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${sheetName.replace(/ /g, '_')}.xlsx"`);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, getCallsChart, getCategoryBreakdown, getAreaDemand, getEmployeePerformance, getTechnicianPerformance, exportReport };

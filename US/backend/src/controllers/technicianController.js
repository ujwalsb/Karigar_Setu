'use strict';

const technicianModel = require('../models/technicianModel');
const { logActivity } = require('../middleware/auth');

async function createTechnician(req, res, next) {
  try {
    const { skills = [], service_areas = [], ...techData } = req.body;
    const id = await technicianModel.createTechnician({ ...techData, created_by: req.user.id });

    // Add skills
    for (const skill of skills) {
      const catId = typeof skill === 'object' ? (skill.service_category_id || skill.serviceCategoryId || skill.id) : skill;
      const spec = typeof skill === 'object' && skill.specialization ? skill.specialization : 'Certified Technician';
      if (catId) {
        await technicianModel.addTechnicianSkill({
          technicianId: id,
          serviceCategoryId: parseInt(catId),
          specialization: spec
        });
      }
    }

    // Add service areas
    if (service_areas.length > 0) {
      for (const area of service_areas) {
        await technicianModel.addTechnicianArea({
          technicianId: id,
          area: typeof area === 'string' ? area : area.area,
          city: typeof area === 'string' ? 'Pune' : (area.city || 'Pune'),
          pinCode: typeof area === 'string' ? techData.pin_code : (area.pin_code || area.pinCode)
        });
      }
    } else if (techData.area) {
      // Auto-add primary area
      await technicianModel.addTechnicianArea({
        technicianId: id,
        area: techData.area,
        city: techData.city || 'Pune',
        pinCode: techData.pin_code || null
      });
    }

    await logActivity(req.user.id, 'CREATE_TECHNICIAN', 'technician', id, { name: techData.full_name }, req.ip);
    return res.status(201).json({ success: true, message: 'Technician created.', data: { id } });
  } catch (err) {
    next(err);
  }
}

async function getAllTechnicians(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '', serviceCategory = '', area = '', verificationStatus = '', status = '', experience = '' } = req.query;
    const result = await technicianModel.getAllTechnicians({
      page: parseInt(page), limit: parseInt(limit),
      search, serviceCategory, area, verificationStatus, status, experience
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

async function getTechnicianById(req, res, next) {
  try {
    const technician = await technicianModel.findById(parseInt(req.params.id));
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }
    return res.json({ success: true, data: technician });
  } catch (err) {
    next(err);
  }
}

async function updateTechnician(req, res, next) {
  try {
    const { id } = req.params;
    const { skills, service_areas, ...techData } = req.body;
    const existing = await technicianModel.findById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }

    await technicianModel.updateTechnician(parseInt(id), techData);

    // Refresh skills if provided
    if (skills !== undefined) {
      await technicianModel.deleteTechnicianSkills(parseInt(id));
      for (const skill of skills) {
        const catId = typeof skill === 'object' ? (skill.service_category_id || skill.serviceCategoryId || skill.id) : skill;
        const spec = typeof skill === 'object' && skill.specialization ? skill.specialization : 'Certified Technician';
        if (catId) {
          await technicianModel.addTechnicianSkill({
            technicianId: parseInt(id),
            serviceCategoryId: parseInt(catId),
            specialization: spec
          });
        }
      }
    }

    // Refresh areas if provided
    if (service_areas !== undefined) {
      await technicianModel.deleteTechnicianAreas(parseInt(id));
      for (const area of service_areas) {
        await technicianModel.addTechnicianArea({
          technicianId: parseInt(id),
          area: typeof area === 'string' ? area : (area.area || area.area_name),
          city: typeof area === 'string' ? 'Pune' : (area.city || 'Pune'),
          pinCode: typeof area === 'string' ? techData.pin_code : (area.pin_code || area.pinCode)
        });
      }
    }

    await logActivity(req.user.id, 'UPDATE_TECHNICIAN', 'technician', parseInt(id), techData, req.ip);
    const updatedTechnician = await technicianModel.findById(parseInt(id));
    return res.json({ success: true, message: 'Technician updated successfully.', data: updatedTechnician });
  } catch (err) {
    next(err);
  }
}

async function deleteTechnician(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await technicianModel.findById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }
    await technicianModel.deleteTechnician(parseInt(id));
    await logActivity(req.user.id, 'DELETE_TECHNICIAN', 'technician', parseInt(id), { name: existing.full_name }, req.ip);
    return res.json({ success: true, message: 'Technician deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function findNearestTechnicians(req, res, next) {
  try {
    const service_category_id =
      req.query.service_category_id ||
      req.query.serviceCategoryId ||
      req.query.categoryId ||
      req.query.category ||
      '';
    const area = (req.query.area || '').trim();
    const city = (req.query.city || '').trim();
    const pin_code = (req.query.pin_code || req.query.pinCode || req.query.pincode || '').trim();
    const { lat, lng, limit = 30 } = req.query;

    const results = await technicianModel.searchNearestTechnicians({
      serviceCategoryId: service_category_id || null,
      area,
      city,
      pinCode: pin_code,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      limit: Math.min(parseInt(limit), 50)
    });
    return res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

async function getTechnicianHistory(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await technicianModel.findById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }
    const history = await technicianModel.getTechnicianHistory(parseInt(id));
    return res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

async function updateVerificationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending', 'verified', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(', ')}` });
    }
    const affectedRows = await technicianModel.updateVerificationStatus(parseInt(id), status);
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }
    await logActivity(req.user.id, 'VERIFY_TECHNICIAN', 'technician', parseInt(id), { status }, req.ip);
    return res.json({ success: true, message: `Technician verification status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTechnician,
  getAllTechnicians,
  getTechnicianById,
  updateTechnician,
  deleteTechnician,
  findNearestTechnicians,
  getTechnicianHistory,
  updateVerificationStatus
};

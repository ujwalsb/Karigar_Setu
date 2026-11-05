'use strict';

const db = require('../config/database');

async function createTechnician(data) {
  const {
    full_name, mobile, alt_mobile, alternate_mobile, email, photo_url, address, area, city,
    state, pin_code, latitude, longitude,
    experience_years, rating, total_jobs,
    availability, verification_status, status, consent_given, created_by
  } = data;
  const alt = alternate_mobile || alt_mobile || null;
  const [result] = await db.query(
    `INSERT INTO technicians
     (full_name, mobile, alternate_mobile, email, photo_url, address, area, city, state,
      pin_code, latitude, longitude, experience_years, rating, total_jobs,
      availability, verification_status, status, consent_given, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [full_name, mobile, alt, email || null, photo_url || null, address || null,
      area || null, city || 'Pune', state || 'Maharashtra',
      pin_code || null, latitude || null, longitude || null,
      experience_years || 0, rating || 4.5, total_jobs || 0,
      availability || 'available', verification_status || 'pending', status || 'active',
      consent_given ? 1 : 0,
      created_by || null]
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT t.*,
            u.name AS created_by_name
     FROM technicians t
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ? AND t.deleted_at IS NULL`,
    [id]
  );
  if (!rows.length) return null;
  const technician = rows[0];

  const [skills] = await db.query(
    `SELECT ts.id, ts.specialization, sc.id AS category_id, sc.name AS category_name
     FROM technician_skills ts
     JOIN service_categories sc ON ts.service_category_id = sc.id
     WHERE ts.technician_id = ?`,
    [id]
  );
  const [areas] = await db.query(
    'SELECT * FROM technician_areas WHERE technician_id = ?',
    [id]
  );
  const [docs] = await db.query(
    `SELECT id, technician_id, doc_type, document_type, file_name, document_number, file_size, mime_type, is_verified, consent_given, uploaded_at, verified_at
     FROM technician_documents
     WHERE technician_id = ?
     ORDER BY uploaded_at DESC`,
    [id]
  );
  technician.skills = skills;
  technician.service_areas = areas;
  technician.documents = docs;
  return technician;
}

async function getAllTechnicians({ page = 1, limit = 20, search = '', serviceCategory = '', area = '', verificationStatus = '', status = '', experience = '' }) {
  const offset = (page - 1) * limit;
  const conditions = ['t.deleted_at IS NULL'];
  const values = [];
  if (search) {
    conditions.push('(t.full_name LIKE ? OR t.mobile LIKE ? OR t.email LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (serviceCategory) {
    conditions.push(
      'EXISTS (SELECT 1 FROM technician_skills ts WHERE ts.technician_id = t.id AND ts.service_category_id = ?)'
    );
    values.push(serviceCategory);
  }
  if (area) {
    conditions.push(
      '(t.area LIKE ? OR EXISTS (SELECT 1 FROM technician_areas tsa WHERE tsa.technician_id = t.id AND tsa.area LIKE ?))'
    );
    values.push(`%${area}%`, `%${area}%`);
  }
  if (verificationStatus) {
    conditions.push('t.verification_status = ?');
    values.push(verificationStatus);
  }
  if (status) {
    conditions.push('t.status = ?');
    values.push(status);
  }
  if (experience) {
    conditions.push('t.experience_years >= ?');
    values.push(parseInt(experience));
  }
  const where = conditions.join(' AND ');
  const [rows] = await db.query(
    `SELECT t.id, t.full_name, t.mobile, t.alternate_mobile, t.email,
            t.photo_url,
            t.area, t.city, t.state, t.pin_code,
            t.experience_years, t.rating, t.total_jobs, t.availability,
            t.verification_status, t.status, t.created_at,
            t.plan_type, t.commission_rate_type, t.commission_rate,
            t.monthly_fee, t.subscription_status, t.subscription_start_date, t.subscription_end_date
     FROM technicians t WHERE ${where}
     ORDER BY t.full_name ASC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) as total FROM technicians t WHERE ${where}`,
    values
  );

  // Attach skills and service areas and documents
  const techIds = rows.map((r) => r.id);
  if (techIds.length > 0) {
    const [skills] = await db.query(
      `SELECT ts.technician_id, sc.id as category_id, sc.name as category_name, sc.icon as category_icon, ts.specialization
       FROM technician_skills ts
       JOIN service_categories sc ON ts.service_category_id = sc.id
       WHERE ts.technician_id IN (?)`,
      [techIds]
    );
    const [areas] = await db.query(
      'SELECT technician_id, area, pin_code FROM technician_areas WHERE technician_id IN (?)',
      [techIds]
    );
    const [docs] = await db.query(
      `SELECT id, technician_id, doc_type, document_type, file_name, document_number, file_size, mime_type, is_verified, consent_given, uploaded_at, verified_at
       FROM technician_documents
       WHERE technician_id IN (?)
       ORDER BY uploaded_at DESC`,
      [techIds]
    );
    const skillMap = {};
    const areaMap = {};
    const docMap = {};
    for (const s of skills) {
      if (!skillMap[s.technician_id]) skillMap[s.technician_id] = [];
      skillMap[s.technician_id].push(s);
    }
    for (const a of areas) {
      if (!areaMap[a.technician_id]) areaMap[a.technician_id] = [];
      areaMap[a.technician_id].push(a);
    }
    for (const d of docs) {
      if (!docMap[d.technician_id]) docMap[d.technician_id] = [];
      docMap[d.technician_id].push(d);
    }
    for (const r of rows) {
      r.skills = skillMap[r.id] || [];
      r.service_areas = areaMap[r.id] || [];
      r.documents = docMap[r.id] || [];
    }
  }

  return { rows, total: countRows[0].total };
}

async function updateTechnician(id, data) {
  if (data.alt_mobile && !data.alternate_mobile) {
    data.alternate_mobile = data.alt_mobile;
  }
  const allowed = [
    'full_name', 'mobile', 'alternate_mobile', 'email', 'photo_url', 'address', 'area', 'city',
    'state', 'pin_code', 'latitude', 'longitude', 'experience_years',
    'rating', 'total_jobs', 'availability', 'verification_status', 'status', 'consent_given',
    'plan_type', 'commission_rate_type', 'commission_rate', 'monthly_fee',
    'subscription_status', 'subscription_start_date', 'subscription_end_date'
  ];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (!updates.length) return 0;
  values.push(id);
  const [result] = await db.query(
    `UPDATE technicians SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
  return result.affectedRows;
}

async function addTechnicianSkill({ technicianId, serviceCategoryId, specialization }) {
  const [result] = await db.query(
    'INSERT INTO technician_skills (technician_id, service_category_id, specialization) VALUES (?, ?, ?)',
    [technicianId, serviceCategoryId, specialization || null]
  );
  return result.insertId;
}

async function deleteTechnicianSkills(technicianId) {
  const [result] = await db.query(
    'DELETE FROM technician_skills WHERE technician_id = ?',
    [technicianId]
  );
  return result.affectedRows;
}

async function addTechnicianArea({ technicianId, area, city, pinCode }) {
  const [result] = await db.query(
    'INSERT INTO technician_areas (technician_id, area, city, pin_code) VALUES (?, ?, ?, ?)',
    [technicianId, area || null, city || null, pinCode || null]
  );
  return result.insertId;
}

async function deleteTechnicianAreas(technicianId) {
  const [result] = await db.query(
    'DELETE FROM technician_areas WHERE technician_id = ?',
    [technicianId]
  );
  return result.affectedRows;
}

async function searchNearestTechnicians({ serviceCategoryId, area, city, pinCode, lat, lng, limit = 30 }) {
  // Resolve category IDs (including legacy and alias category IDs)
  let categoryIds = [];
  if (serviceCategoryId) {
    const rawId = parseInt(serviceCategoryId);
    if (!isNaN(rawId)) {
      categoryIds.push(rawId);
      if (rawId === 3 || rawId === 6) categoryIds.push(3, 6);
      if (rawId === 2 || rawId === 7) categoryIds.push(2, 7);
      if (rawId === 1 || rawId === 8) categoryIds.push(1, 8);
      if (rawId === 4 || rawId === 14) categoryIds.push(4, 14);
      if (rawId === 5 || rawId === 13) categoryIds.push(5, 13);
      categoryIds = [...new Set(categoryIds)];
    } else if (typeof serviceCategoryId === 'string' && serviceCategoryId.trim()) {
      const [matchingCats] = await db.query(
        'SELECT id FROM service_categories WHERE name LIKE ?',
        [`%${serviceCategoryId.trim()}%`]
      );
      if (matchingCats.length) {
        categoryIds = matchingCats.map(c => c.id);
      }
    }
  }

  // Fetch candidates
  let query = `
    SELECT DISTINCT t.id, t.full_name, t.mobile, t.photo_url, t.area, t.city, t.pin_code,
           t.latitude, t.longitude, t.availability, t.verification_status,
           t.experience_years, t.rating
    FROM technicians t
  `;
  const params = [];
  if (categoryIds.length > 0) {
    query += `
      JOIN technician_skills ts ON ts.technician_id = t.id
      WHERE ts.service_category_id IN (?)
        AND t.status = 'active'
        AND t.deleted_at IS NULL
    `;
    params.push(categoryIds);
  } else {
    query += ` WHERE t.status = 'active' AND t.deleted_at IS NULL`;
  }

  const [candidates] = await db.query(query, params);

  // Get service areas and skills for these technicians
  const techIds = candidates.map(c => c.id);
  let areaMap = {};
  let skillMap = {};
  if (techIds.length) {
    const [areaRows] = await db.query(
      'SELECT technician_id, area, pin_code, city FROM technician_areas WHERE technician_id IN (?)',
      [techIds]
    );
    for (const row of areaRows) {
      if (!areaMap[row.technician_id]) areaMap[row.technician_id] = [];
      areaMap[row.technician_id].push(row);
    }

    const [skillRows] = await db.query(
      `SELECT ts.technician_id, sc.id as category_id, sc.name as category_name, sc.icon as category_icon, ts.specialization
       FROM technician_skills ts
       JOIN service_categories sc ON ts.service_category_id = sc.id
       WHERE ts.technician_id IN (?)`,
      [techIds]
    );
    for (const s of skillRows) {
      if (!skillMap[s.technician_id]) skillMap[s.technician_id] = [];
      skillMap[s.technician_id].push(s);
    }
  }

  const { haversineDistance } = require('../utils/haversine');
  const hasLocalityFilter = Boolean(pinCode || area);

  const scored = candidates.map(t => {
    let score = 0;
    let matchType = hasLocalityFilter ? 'none' : 'all';
    let localityMatched = false;
    const techAreas = areaMap[t.id] || [];

    // PIN code match (highest priority, exact match)
    const normalizedPin = pinCode ? String(pinCode).trim() : '';
    if (normalizedPin && (
      (t.pin_code && String(t.pin_code).trim() === normalizedPin) ||
      techAreas.some(a => a.pin_code && String(a.pin_code).trim() === normalizedPin)
    )) {
      score += 70;
      matchType = 'pincode';
      localityMatched = true;
    }

    // Area match (exact or substring comparison)
    if (area) {
      const areaLower = area.toLowerCase().trim();
      const techAreaLower = (t.area || '').toLowerCase();
      const areaMatches =
        (techAreaLower && (techAreaLower.includes(areaLower) || areaLower.includes(techAreaLower))) ||
        techAreas.some(a => a.area && (a.area.toLowerCase().includes(areaLower) || areaLower.includes(a.area.toLowerCase())));

      if (areaMatches) {
        score += 50;
        if (!localityMatched) {
          matchType = 'area';
          localityMatched = true;
        }
      }
    }

    // City match
    if (city && !localityMatched) {
      const cityLower = city.toLowerCase();
      if ((t.city && t.city.toLowerCase() === cityLower) ||
        techAreas.some(a => a.city && a.city.toLowerCase() === cityLower)) {
        score += 20;
        if (!hasLocalityFilter) {
          matchType = 'city';
        }
      }
    }

    // Verification bonus
    if (t.verification_status === 'verified') score += 25;

    // Availability bonus (available techs prioritized)
    if (t.availability === 'available') score += 30;
    else if (t.availability === 'busy') score += 10;

    // Rating bonus (up to 25 pts)
    score += Math.round(parseFloat(t.rating || 4.5) * 5);

    // Experience bonus (up to 20 pts)
    score += Math.min(parseInt(t.experience_years || 0) * 2, 20);

    // Haversine distance
    let distance = null;
    if (lat && lng && t.latitude && t.longitude) {
      distance = haversineDistance(parseFloat(lat), parseFloat(lng), parseFloat(t.latitude), parseFloat(t.longitude));
      if (matchType === 'none') matchType = 'geo';
    }

    return {
      ...t,
      score,
      distance,
      matchType,
      localityMatched,
      skills: skillMap[t.id] || [],
      service_areas: techAreas
    };
  });

  // Sort by locality match first (if locality was searched), then score DESC, distance ASC
  scored.sort((a, b) => {
    if (hasLocalityFilter && a.localityMatched !== b.localityMatched) {
      return a.localityMatched ? -1 : 1;
    }
    if (b.score !== a.score) return b.score - a.score;
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
  });

  return scored.slice(0, limit);
}

async function deleteTechnician(id) {
  const [result] = await db.query(
    'UPDATE technicians SET deleted_at = NOW(), status = ? WHERE id = ? AND deleted_at IS NULL',
    ['inactive', id]
  );
  return result.affectedRows;
}

async function updateVerificationStatus(id, status) {
  const [result] = await db.query(
    'UPDATE technicians SET verification_status = ? WHERE id = ? AND deleted_at IS NULL',
    [status, id]
  );
  return result.affectedRows;
}

async function getTechnicianHistory(technicianId) {
  const [rows] = await db.query(
    `SELECT sr.id, sr.request_id, sr.status, sr.scheduled_date, sr.scheduled_time,
            sr.created_at, sr.completed_at, sr.internal_notes,
            sr.work_description, sr.parts_replaced, sr.labor_charge, sr.parts_charge,
            sr.final_amount, sr.payment_status, sr.payment_mode,
            sr.machine_photo_url, sr.technician_remarks,
            c.full_name AS customer_name, c.mobile AS customer_mobile,
            c.area AS customer_area, c.city AS customer_city, c.address AS customer_address,
            sc.name AS service_category_name,
            cc.problem_description
     FROM service_requests sr
     LEFT JOIN customers c ON sr.customer_id = c.id
     LEFT JOIN service_categories sc ON sr.service_category_id = sc.id
     LEFT JOIN customer_calls cc ON sr.customer_call_id = cc.id
     WHERE sr.assigned_technician_id = ?
     ORDER BY sr.created_at DESC`,
    [technicianId]
  );
  return rows;
}

module.exports = {
  createTechnician,
  findById,
  getAllTechnicians,
  updateTechnician,
  deleteTechnician,
  addTechnicianSkill,
  deleteTechnicianSkills,
  addTechnicianArea,
  deleteTechnicianAreas,
  searchNearestTechnicians,
  updateVerificationStatus,
  getTechnicianHistory
};

'use strict';

const db = require('../config/database');

async function addDocument({ technicianId, docType, filePath, fileName, documentNumber, fileSize, mimeType, consentGiven }) {
  const [result] = await db.query(
    `INSERT INTO technician_documents
     (technician_id, doc_type, document_type, file_name, document_number, file_path, file_size, mime_type, consent_given)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [technicianId, docType, docType, fileName, documentNumber || null, filePath, fileSize || null, mimeType || null, consentGiven ? 1 : 0]
  );
  return result.insertId;
}

async function getDocumentsByTechnician(technicianId) {
  // Returns metadata WITHOUT file_path (security)
  const [rows] = await db.query(
    `SELECT td.id, td.technician_id, td.doc_type, td.document_type, td.file_name, td.document_number, td.file_size,
            td.mime_type, td.is_verified, td.consent_given, td.uploaded_at,
            td.verified_at, u.name AS verified_by_name
     FROM technician_documents td
     LEFT JOIN users u ON td.verified_by = u.id
     WHERE td.technician_id = ?
     ORDER BY td.uploaded_at DESC`,
    [technicianId]
  );
  return rows;
}

async function getDocumentWithPath(docId) {
  // Admin only — includes file_path
  const [rows] = await db.query(
    `SELECT td.*, u.name AS verified_by_name
     FROM technician_documents td
     LEFT JOIN users u ON td.verified_by = u.id
     WHERE td.id = ?`,
    [docId]
  );
  return rows[0] || null;
}

async function verifyDocument(docId, userId) {
  const [result] = await db.query(
    `UPDATE technician_documents
     SET is_verified = TRUE, verified_by = ?, verified_at = NOW()
     WHERE id = ?`,
    [userId, docId]
  );
  return result.affectedRows;
}

async function deleteDocument(docId) {
  const [rows] = await db.query(
    'SELECT file_path FROM technician_documents WHERE id = ?',
    [docId]
  );
  if (!rows.length) return { filePath: null, affectedRows: 0 };
  const filePath = rows[0].file_path;
  const [result] = await db.query(
    'DELETE FROM technician_documents WHERE id = ?',
    [docId]
  );
  return { filePath, affectedRows: result.affectedRows };
}

async function logDocumentAccess(docId, userId, action) {
  await db.query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
     VALUES (?, ?, 'document', ?, ?)`,
    [userId, action, docId, JSON.stringify({ docId, action })]
  );
}

module.exports = {
  addDocument,
  getDocumentsByTechnician,
  getDocumentWithPath,
  verifyDocument,
  deleteDocument,
  logDocumentAccess
};

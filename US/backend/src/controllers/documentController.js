'use strict';

const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const documentModel = require('../models/documentModel');
const { logActivity } = require('../middleware/auth');

async function uploadDocument(req, res, next) {
  try {
    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const technician_id = req.params.technicianId || req.body.technician_id || req.body.technicianId;
    if (!technician_id) {
      for (const f of files) {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      }
      return res.status(400).json({ success: false, message: 'technician_id is required.' });
    }

    const techId = parseInt(technician_id);
    const uploadedDocs = [];
    let updatedPhotoUrl = null;

    for (const file of files) {
      const isPhoto = file.fieldname === 'photo' || file.fieldname === 'avatar' || req.body.doc_type === 'profile_photo';
      const docType = isPhoto
        ? 'profile_photo'
        : (req.body.doc_type || req.body.document_type || 'aadhaar_card');
      const docNumber = req.body.document_number || req.body.doc_number || null;
      const consentGiven = req.body.consent_given === 'true' || req.body.consent_given === true || req.body.consent_given === undefined;

      const docId = await documentModel.addDocument({
        technicianId: techId,
        docType,
        filePath: file.path,
        fileName: file.originalname,
        documentNumber: isPhoto ? null : docNumber,
        fileSize: file.size,
        mimeType: file.mimetype,
        consentGiven
      });

      const relativeUrl = `/uploads/documents/${techId}/${file.filename}`;

      if (isPhoto) {
        await db.query('UPDATE technicians SET photo_url = ? WHERE id = ?', [relativeUrl, techId]);
        updatedPhotoUrl = relativeUrl;
      }

      await logActivity(req.user.id, 'UPLOAD_DOCUMENT', 'document', docId, {
        technicianId: techId, docType, fileName: file.originalname, documentNumber: docNumber
      }, req.ip);

      uploadedDocs.push({
        id: docId,
        fileName: file.originalname,
        docType,
        documentNumber: docNumber,
        url: relativeUrl
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Document(s) uploaded successfully.',
      data: {
        technicianId: techId,
        photo_url: updatedPhotoUrl,
        documents: uploadedDocs,
        ...(uploadedDocs.length === 1 ? uploadedDocs[0] : {})
      }
    });
  } catch (err) {
    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    for (const f of files) {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    }
    next(err);
  }
}

async function getDocuments(req, res, next) {
  try {
    const { technician_id } = req.params;
    const docs = await documentModel.getDocumentsByTechnician(parseInt(technician_id));
    return res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await documentModel.getDocumentWithPath(parseInt(id));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ success: false, message: 'File not found on disk.' });
    }

    await documentModel.logDocumentAccess(parseInt(id), req.user.id, 'DOWNLOAD');
    await logActivity(req.user.id, 'DOWNLOAD_DOCUMENT', 'document', parseInt(id), {
      technicianId: doc.technician_id, docType: doc.doc_type
    }, req.ip);

    const disposition = req.query.inline === 'true' || req.query.view === 'true' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${doc.file_name}"`);
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    return res.sendFile(path.resolve(doc.file_path));
  } catch (err) {
    next(err);
  }
}

async function verifyDocument(req, res, next) {
  try {
    const { id } = req.params;
    const affectedRows = await documentModel.verifyDocument(parseInt(id), req.user.id);
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    await logActivity(req.user.id, 'VERIFY_DOCUMENT', 'document', parseInt(id), {}, req.ip);
    return res.json({ success: true, message: 'Document verified.' });
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { filePath, affectedRows } = await documentModel.deleteDocument(parseInt(id));
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    // Delete file from disk
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await logActivity(req.user.id, 'DELETE_DOCUMENT', 'document', parseInt(id), {}, req.ip);
    return res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocument, getDocuments, downloadDocument, verifyDocument, deleteDocument };

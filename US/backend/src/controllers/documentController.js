'use strict';

const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const documentModel = require('../models/documentModel');
const multerUpload = require('../config/multer');
const { logActivity } = require('../middleware/auth');

const BACKEND_UPLOADS_DIR = multerUpload.UPLOADS_BASE_DIR || path.resolve(__dirname, '../../uploads');
const LEGACY_ROOT_UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

async function resolveDocumentFilePath(doc) {
  if (!doc) return null;

  const candidates = [];
  const rawPath = String(doc.file_path || '').trim();
  if (rawPath) {
    candidates.push(rawPath);
    candidates.push(path.resolve(rawPath));

    // Recover paths from relocated folders/drives (e.g., D:\...\uploads\documents\18\file.jpg)
    const normalized = rawPath.replace(/\\/g, '/');
    const uploadsMatch = normalized.match(/(?:^|\/)uploads\/(.+)$/i);
    if (uploadsMatch && uploadsMatch[1]) {
      const subPath = uploadsMatch[1];
      candidates.push(path.join(BACKEND_UPLOADS_DIR, subPath));
      candidates.push(path.join(LEGACY_ROOT_UPLOADS_DIR, subPath));
      candidates.push(path.resolve(process.cwd(), process.env.UPLOAD_PATH || './uploads', subPath));
    }

    const baseName = path.basename(normalized);
    if (baseName) {
      if (doc.technician_id) {
        candidates.push(path.join(BACKEND_UPLOADS_DIR, 'documents', String(doc.technician_id), baseName));
        candidates.push(path.join(LEGACY_ROOT_UPLOADS_DIR, 'documents', String(doc.technician_id), baseName));
      }
      candidates.push(path.join(BACKEND_UPLOADS_DIR, 'technician_documents', baseName));
      candidates.push(path.join(LEGACY_ROOT_UPLOADS_DIR, 'technician_documents', baseName));
    }
  }

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return path.resolve(candidate);
      }
    } catch {
      // ignore invalid path candidate
    }
  }

  // Fallback for profile_photo documents stored on technician.photo_url
  if (doc.technician_id && (doc.doc_type === 'profile_photo' || doc.document_type === 'profile_photo')) {
    const [techRows] = await db.query('SELECT photo_url FROM technicians WHERE id = ?', [doc.technician_id]);
    const photoUrl = techRows[0]?.photo_url;
    if (photoUrl) {
      const subPath = String(photoUrl).replace(/\\/g, '/').replace(/^\/?uploads\//i, '');
      for (const baseDir of [BACKEND_UPLOADS_DIR, LEGACY_ROOT_UPLOADS_DIR]) {
        const photoCandidate = path.join(baseDir, subPath);
        try {
          if (fs.existsSync(photoCandidate) && fs.statSync(photoCandidate).isFile()) {
            return path.resolve(photoCandidate);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return null;
}

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
    const docId = parseInt(id);
    const doc = await documentModel.getDocumentWithPath(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    const resolvedPath = await resolveDocumentFilePath(doc);
    if (!resolvedPath) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk. Please delete this record or re-upload the document.'
      });
    }

    if (resolvedPath !== doc.file_path) {
      db.query('UPDATE technician_documents SET file_path = ? WHERE id = ?', [resolvedPath, docId]).catch(() => { });
    }

    await documentModel.logDocumentAccess(docId, req.user.id, 'DOWNLOAD');
    await logActivity(req.user.id, 'DOWNLOAD_DOCUMENT', 'document', docId, {
      technicianId: doc.technician_id, docType: doc.doc_type
    }, req.ip);

    const disposition = req.query.inline === 'true' || req.query.view === 'true' ? 'inline' : 'attachment';
    const safeFileName = path.basename(String(doc.file_name || 'document')).replace(/["\r\n]/g, '_');
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeFileName}"`);
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    return res.sendFile(resolvedPath);
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
    const docId = parseInt(id);
    const existingDoc = await documentModel.getDocumentWithPath(docId);
    if (!existingDoc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    const resolvedPath = await resolveDocumentFilePath(existingDoc);
    const { filePath, affectedRows } = await documentModel.deleteDocument(docId);
    if (!affectedRows) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    // Delete file from disk
    const pathToDelete = resolvedPath || filePath;
    if (pathToDelete && fs.existsSync(pathToDelete)) {
      fs.unlinkSync(pathToDelete);
    }
    await logActivity(req.user.id, 'DELETE_DOCUMENT', 'document', docId, {}, req.ip);
    return res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadDocument,
  getDocuments,
  downloadDocument,
  verifyDocument,
  deleteDocument,
  resolveDocumentFilePath
};

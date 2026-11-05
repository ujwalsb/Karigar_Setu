'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const multerUpload = require('../config/multer');
const documentController = require('../controllers/documentController');

router.use(authenticate);

// POST /api/v1/documents/upload/:technicianId
router.post(
  '/upload/:technicianId',
  (req, res, next) => {
    multerUpload.any()(req, res, (err) => {
      if (err) return next(err);
      if (req.files && req.files.length > 0) {
        req.file = req.files[0];
      }
      next();
    });
  },
  documentController.uploadDocument
);

// GET /api/v1/documents/technician/:technician_id
router.get('/technician/:technician_id', documentController.getDocuments);

// GET /api/v1/documents/:id/download — Admin and Support
router.get('/:id/download', authorize('admin', 'support'), documentController.downloadDocument);

// PATCH /api/v1/documents/:id/verify — Admin only
router.patch('/:id/verify', authorize('admin'), documentController.verifyDocument);

// DELETE /api/v1/documents/:id — Admin only
router.delete('/:id', authorize('admin'), documentController.deleteDocument);

module.exports = router;

'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf')
  .split(',')
  .map(t => t.trim().toLowerCase());

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const BACKEND_ROOT = path.resolve(__dirname, '../..');
const RAW_UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const UPLOADS_BASE_DIR = path.isAbsolute(RAW_UPLOAD_PATH)
  ? RAW_UPLOAD_PATH
  : path.resolve(BACKEND_ROOT, RAW_UPLOAD_PATH);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const technicianId = req.params.technicianId || req.body.technician_id || 'unknown';
    const uploadDir = path.join(
      UPLOADS_BASE_DIR,
      'documents',
      String(technicianId)
    );
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeAllowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];
  if (ALLOWED_TYPES.includes(ext) && mimeAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
      ),
      false
    );
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 5
  }
});

multerUpload.UPLOADS_BASE_DIR = UPLOADS_BASE_DIR;
module.exports = multerUpload;

'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BRANDING_UPLOAD_DIR = path.join(__dirname, '../../uploads/branding');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(BRANDING_UPLOAD_DIR, { recursive: true });
    cb(null, BRANDING_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `company-logo-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid logo format. Please upload a PNG, JPG, or WEBP image.'), false);
  }
};

const logoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { logoUpload, BRANDING_UPLOAD_DIR };


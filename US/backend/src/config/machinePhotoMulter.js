'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'machine_photos');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const token = req.params.token ? String(req.params.token).slice(0, 8) : 'job';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `machine-${token}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Please upload a JPG, PNG, or WEBP photo of the machine.'), false);
  }
};

const machinePhotoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

module.exports = machinePhotoUpload;


// backend/routes/resourceRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadResource, getResourcesByClassCode, requestResource, deleteResource } = require('../controllers/resourceController');
const router = express.Router();

const fs = require('fs');

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${cleanName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Middleware to accept either 'file' or 'resourceFile' field name
const handleUpload = (req, res, next) => {
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'resourceFile', maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    if (req.files) {
      req.file = req.files['file']?.[0] || req.files['resourceFile']?.[0];
    }
    next();
  });
};

// Route to upload a new resource (teacher)
router.post('/upload', handleUpload, uploadResource);

// Route to get all resources for a specific classroom
router.get('/:classCode', getResourcesByClassCode);

// Route to delete a resource
router.delete('/:resourceId', deleteResource);

// Route for students to request a resource
router.post('/request', requestResource);

module.exports = router;

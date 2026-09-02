// backend/routes/resourceRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadResource, getResourcesByClassCode, requestResource, deleteResource } = require('../controllers/resourceController');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Route to upload a new resource (teacher)
router.post('/upload', upload.single('file'), uploadResource);

// Route to get all resources for a specific classroom
router.get('/:classCode', getResourcesByClassCode);

// Route to delete a resource
router.delete('/:resourceId', deleteResource);

// Route for students to request a resource
router.post('/request', requestResource);

module.exports = router;

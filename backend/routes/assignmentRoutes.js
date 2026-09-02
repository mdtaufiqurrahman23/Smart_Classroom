// backend/routes/assignmentRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { createAssignment, getAssignments, submitAssignment, deleteAssignment, deleteSubmission } = require('../controllers/assignmentController');
const router = express.Router();

// Configure multer for file uploads (optional, for future use)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Route to create an assignment (send as JSON, no file upload for now)
router.post('/create', createAssignment);

// DEBUG: Get all assignments in database (for troubleshooting) - MUST come before :classCode route
router.get('/debug/all', async (req, res) => {
  try {
    const Assignment = require('../models/Assignment');
    const allAssignments = await Assignment.find({});
    console.log('DEBUG: All assignments in database:', allAssignments);
    res.status(200).json(allAssignments);
  } catch (error) {
    console.error('DEBUG: Error fetching all assignments:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Route to submit an assignment (student submits the completed assignment PDF) - MUST come before :classCode route
router.post('/:assignmentId/submit', upload.single('submissionFile'), submitAssignment);

// Route to delete a specific submission
router.delete('/:assignmentId/submission/:submissionIndex', deleteSubmission);

// Route to get all assignments for a specific classroom (classCode)
router.get('/:classCode', getAssignments);

// Route to delete an assignment
router.delete('/:assignmentId', deleteAssignment);

module.exports = router;

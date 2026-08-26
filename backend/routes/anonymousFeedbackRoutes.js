// backend/routes/anonymousFeedbackRoutes.js
const express = require('express');
const { submitFeedback, getFeedbackByClassCode, deleteFeedback } = require('../controllers/anonymousFeedbackController');
const router = express.Router();

// Route to submit feedback
router.post('/submit', submitFeedback);

// Route to get all feedback for a specific classroom
router.get('/:classCode', getFeedbackByClassCode);

// Route to delete feedback by ID
router.delete('/:feedbackId', deleteFeedback);

module.exports = router;

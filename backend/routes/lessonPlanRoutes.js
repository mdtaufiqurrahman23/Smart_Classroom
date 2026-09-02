// backend/routes/lessonPlanRoutes.js
const express = require('express');
const { createLessonPlan, getLessonPlans, updateLessonPlan, deleteLessonPlan } = require('../controllers/lessonPlanController');
const router = express.Router();

// Route to create a new lesson plan
router.post('/create', createLessonPlan);

// Route to get lesson plans for a specific classroom (classCode) within a date range (startDate, endDate)
router.get('/:classCode', getLessonPlans);

// Route to update a lesson plan
router.post('/update', updateLessonPlan);

// Route to delete a lesson plan
router.post('/delete', deleteLessonPlan);

module.exports = router;

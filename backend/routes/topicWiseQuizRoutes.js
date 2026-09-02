// backend/routes/topicWiseQuizRoutes.js
const express = require('express');
const { createQuiz, getQuizzesByClassCode, deleteQuiz } = require('../controllers/topicWiseQuizController');
const router = express.Router();

// Route to create a new quiz
router.post('/create', createQuiz);

// Route to get quizzes by classCode
router.get('/:classCode', getQuizzesByClassCode);

// Route to delete a quiz
router.delete('/:quizId', deleteQuiz);

module.exports = router;

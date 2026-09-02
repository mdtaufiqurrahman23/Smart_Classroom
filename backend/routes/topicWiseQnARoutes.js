// backend/routes/topicWiseQnARoutes.js
const express = require('express');
const { createQuestion, updateQuestion, deleteQuestion, getQnAsByClassCode } = require('../controllers/topicWiseQnAController');
const router = express.Router();

// Route to create (submit) a question
router.post('/create', createQuestion);

// Route to get all QnAs for a specific classCode
router.get('/:classCode', getQnAsByClassCode);

// Route to update (answer) a question
router.put('/:qnaId', updateQuestion);

// Route to delete a question
router.delete('/:qnaId', deleteQuestion);

module.exports = router;

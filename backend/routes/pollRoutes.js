// backend/routes/pollRoutes.js
const express = require('express');
const { createPoll, getPollsByClassCode, votePoll } = require('../controllers/pollController');
const router = express.Router();

// Route to create a new poll
router.post('/create', createPoll);

// Route to get polls for a specific classroom
router.get('/:classCode', getPollsByClassCode);

// Route to vote for a poll option
router.post('/vote', votePoll);

module.exports = router;

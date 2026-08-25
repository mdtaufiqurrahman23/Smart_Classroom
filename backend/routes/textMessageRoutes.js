// backend/routes/textMessageRoutes.js
const express = require('express');
const { sendTextMessage, getTextMessages } = require('../controllers/textMessageController');
const router = express.Router();

// Route to send a text message to students in a specific classroom
router.post('/send', sendTextMessage);

// Route to get all text messages for a specific classroom
router.get('/:classCode', getTextMessages);

module.exports = router;

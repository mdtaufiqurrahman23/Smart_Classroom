// backend/routes/marksheetRoutes.js
const express = require('express');
const { createMarksheet, getMarksheetByClassCode, updateMarksheet } = require('../controllers/marksheetController');
const router = express.Router();

// Route to create a new marksheet
router.post('/create', createMarksheet);

// Route to get marksheets for a specific classroom
router.get('/:classCode', getMarksheetByClassCode);

// Route to update marksheet marks
router.put('/:marksheetId', updateMarksheet);

module.exports = router;

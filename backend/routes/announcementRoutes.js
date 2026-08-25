// backend/routes/announcementRoutes.js
const express = require('express');
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const router = express.Router();

// Route to create an announcement for a specific classroom (classCode)
router.post('/create', createAnnouncement);

// Route to get all announcements for a specific classroom by classCode
router.get('/:classCode', getAnnouncements);  // Use classCode to get announcements for a class

// Route to delete an announcement by ID
router.delete('/:announcementId', deleteAnnouncement);

module.exports = router;

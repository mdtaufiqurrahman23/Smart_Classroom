// backend/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// QR Code based attendance
router.post('/start-session', authMiddleware, attendanceController.startAttendanceSession);
router.post('/end-session', authMiddleware, attendanceController.endAttendanceSession);
router.post('/scan-qr', authMiddleware, attendanceController.scanQRCode);

// Bulk save attendance records (must be before :classCode to avoid conflict)
router.post('/bulk-save', authMiddleware, attendanceController.bulkSaveAttendance);

// Mark attendance for a student
router.post('/mark', authMiddleware, attendanceController.markAttendance);

// Get all attendance records (requires auth)
router.get('/', authMiddleware, attendanceController.getAllAttendance);

// Get attendance records for a specific classroom (requires auth)
router.get('/:classCode', authMiddleware, attendanceController.getAttendance);

module.exports = router;

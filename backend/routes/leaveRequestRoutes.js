// backend/routes/leaveRequestRoutes.js
const express = require('express');
const { createLeaveRequest, getLeaveRequests, updateLeaveRequestStatus } = require('../controllers/leaveRequestController');
const router = express.Router();

// Route to create a leave request
router.post('/create', createLeaveRequest);

// Route to get all leave requests for a specific classroom (classCode)
router.get('/:classCode', getLeaveRequests);

// Route to update the status of a leave request (approve/reject)
router.post('/update-status', updateLeaveRequestStatus);

module.exports = router;

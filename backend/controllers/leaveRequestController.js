// backend/controllers/leaveRequestController.js
const LeaveRequest = require('../models/LeaveRequest');  // Import the LeaveRequest model

// Create a new leave request
exports.createLeaveRequest = async (req, res) => {
  const { classCode, studentId, studentName, reason, leaveDate, document } = req.body;

  try {
    // Validate required fields
    if (!classCode || !studentId || !studentName || !reason || !leaveDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert leaveDate string to Date object if it's a string
    let leaveDateObj = leaveDate;
    if (typeof leaveDate === 'string') {
      leaveDateObj = new Date(leaveDate);
      if (isNaN(leaveDateObj)) {
        return res.status(400).json({ message: 'Invalid leave date format' });
      }
    }

    const newLeaveRequest = new LeaveRequest({
      classCode,
      studentId,
      studentName,
      reason,
      leaveDate: leaveDateObj,
      document,
    });

    await newLeaveRequest.save(); // Save the leave request to the database
    res.status(201).json({ message: 'Leave request created successfully!', leaveRequest: newLeaveRequest });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Failed to create leave request', error: error.message });
  }
};

// Get all leave requests for a specific classroom
exports.getLeaveRequests = async (req, res) => {
  const { classCode } = req.params;  // Get the classCode from the request parameters

  try {
    const leaveRequests = await LeaveRequest.find({ classCode }).sort({ createdAt: -1 });  // Sort by created date (latest first)
    res.status(200).json(leaveRequests);  // Return the list of leave requests
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ message: 'Failed to fetch leave requests' });
  }
};

// Update leave request status (approve/reject)
exports.updateLeaveRequestStatus = async (req, res) => {
  const { requestId, status } = req.body;  // Get requestId and status (approved/rejected) from the request body

  try {
    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(requestId, { status }, { new: true }); // Update the status of the leave request
    res.status(200).json({ message: 'Leave request status updated', updatedLeaveRequest });
  } catch (error) {
    console.error('Error updating leave request status:', error);
    res.status(500).json({ message: 'Failed to update leave request status' });
  }
};

// backend/controllers/attendanceReportController.js
const Attendance = require('../models/Attendance');

// Generate attendance report for a classroom
exports.generateAttendanceReport = async (req, res) => {
  try {
    const { classCode, date } = req.body;

    if (!classCode) {
      return res.status(400).json({ message: 'classCode is required' });
    }

    // Build query
    const query = { classCode };
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Fetch attendance records
    const attendance = await Attendance.find(query).sort({ date: -1 });

    if (!attendance.length) {
      return res.status(404).json({ message: 'No attendance records found' });
    }

    res.status(200).json({ 
      message: 'Attendance report generated',
      data: attendance,
      count: attendance.length
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ message: 'Failed to generate attendance report' });
  }
};

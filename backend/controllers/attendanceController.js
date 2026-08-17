// backend/controllers/attendanceController.js

const Attendance = require('../models/Attendance');  // Your attendance model
const crypto = require('crypto');

// Store active attendance sessions in memory (consider using Redis for production)
const activeSessions = new Map();

// Start attendance session with QR code
exports.startAttendanceSession = async (req, res) => {
    try {
        console.log('📍 [Attendance] Start session request received:', req.body);
        const { classCode } = req.body;

        if (!classCode) {
            console.warn('⚠️ [Attendance] classCode not provided');
            return res.status(400).json({ message: 'classCode required' });
        }

        // Generate unique session ID
        const sessionId = crypto.randomBytes(8).toString('hex');
        const startTime = new Date();

        console.log('✓ [Attendance] Created session ID:', sessionId);

        // Store session
        activeSessions.set(sessionId, {
            classCode,
            startTime,
            active: true,
            scannedStudents: new Set(),
        });

        console.log('✓ [Attendance] Session stored. Total active sessions:', activeSessions.size);

        // Auto-expire session after 2 hours
        setTimeout(() => {
            activeSessions.delete(sessionId);
            console.log('⏰ [Attendance] Session expired:', sessionId);
        }, 2 * 60 * 60 * 1000);

        const response = {
            message: 'Attendance session started',
            sessionId,
        };
        
        console.log('✓ [Attendance] Sending response:', response);
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ [Attendance] Error starting attendance session:', error);
        res.status(500).json({ message: 'Failed to start attendance session', error: error.message });
    }
};

// End attendance session
exports.endAttendanceSession = async (req, res) => {
    try {
        const { classCode, sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: 'sessionId required' });
        }

        const session = activeSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Mark session as inactive
        session.active = false;
        activeSessions.delete(sessionId);

        res.status(200).json({
            message: 'Attendance session ended',
            totalScanned: session.scannedStudents.size,
        });
    } catch (error) {
        console.error('Error ending attendance session:', error);
        res.status(500).json({ message: 'Failed to end attendance session' });
    }
};

// Scan QR code and mark attendance
exports.scanQRCode = async (req, res) => {
    try {
        const { classCode, sessionId, timestamp, studentId, studentName } = req.body;

        // Validate required fields
        if (!classCode || !sessionId || !studentId || !studentName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get session
        const session = activeSessions.get(sessionId);
        if (!session || !session.active) {
            return res.status(400).json({ message: 'Attendance session is not active' });
        }

        if (session.classCode !== classCode) {
            return res.status(400).json({ message: 'Invalid class code for this session' });
        }

        // Check if student already scanned
        if (session.scannedStudents.has(studentId)) {
            return res.status(400).json({ message: 'You have already marked attendance in this session' });
        }

        // Mark attendance
        const attendance = new Attendance({
            classCode,
            studentId,
            name: studentName,
            status: 'Present',
            date: new Date(),
            sessionId,
        });

        await attendance.save();

        // Add to scanned students
        session.scannedStudents.add(studentId);

        res.status(201).json({
            message: '✅ Attendance marked successfully',
            attendance,
        });
    } catch (error) {
        console.error('Error scanning QR code:', error);
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
};

// Fetch attendance data for a classroom by classCode
exports.getAttendance = async (req, res) => {
    const { classCode } = req.params;  // Get classCode from URL params

    try {
        const attendance = await Attendance.find({ classCode }).sort({ date: -1 });  // Fetch all attendance records for the class
        res.status(200).json(attendance);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Failed to fetch attendance data.' });
    }
};

// Fetch all attendance records
exports.getAllAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find().sort({ date: -1 });
        res.status(200).json(attendance);
    } catch (error) {
        console.error('Error fetching all attendance:', error);
        res.status(500).json({ message: 'Failed to fetch attendance data.' });
    }
};

// Mark attendance for a student
exports.markAttendance = async (req, res) => {
    try {
        const { classCode, studentId, name, status } = req.body;

        // Validate required fields
        if (!classCode || !studentId || !name || !status) {
            return res.status(400).json({ message: 'All fields required: classCode, studentId, name, status' });
        }

        // Check if attendance already marked today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.findOne({
            classCode,
            studentId,
            date: { $gte: today }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance already marked for today' });
        }

        // Create new attendance record
        const attendance = new Attendance({
            classCode,
            studentId,
            name,
            status
        });

        await attendance.save();
        res.status(201).json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
};

// Bulk save attendance records
exports.bulkSaveAttendance = async (req, res) => {
    try {
        const { classCode, attendanceData } = req.body;

        if (!classCode || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'Invalid request: classCode and attendanceData array required' });
        }

        // Delete existing attendance for this class and date range
        const dates = attendanceData.map(record => new Date(record.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        await Attendance.deleteMany({
            classCode,
            date: { $gte: minDate, $lte: maxDate }
        });

        // Insert new attendance records
        const savedRecords = await Attendance.insertMany(attendanceData);

        res.status(201).json({
            message: `${savedRecords.length} attendance records saved successfully`,
            recordCount: savedRecords.length
        });
    } catch (error) {
        console.error('Error bulk saving attendance:', error);
        res.status(500).json({ message: 'Failed to save attendance records' });
    }
};


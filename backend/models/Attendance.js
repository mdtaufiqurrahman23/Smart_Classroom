const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    classCode: { type: String, required: true },
    studentId: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
    date: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now },
    sessionId: { type: String, default: null }, // For QR code sessions
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

// backend/models/LeaveRequest.js
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Reference to the classroom
  studentId: { type: String, required: true },  // Student ID
  studentName: { type: String, required: true },  // Student name
  reason: { type: String, required: true },  // Reason for leave
  leaveDate: { type: Date, required: true },  // Date of the leave
  document: { type: String },  // URL or file path to any supporting document (optional)
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },  // Leave request status
}, { timestamps: true });  // Created and updated timestamps

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

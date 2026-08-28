// backend/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Classroom the assignment is for
  teacherId: { type: String, required: true },  // Teacher who created the assignment
  title: { type: String, required: true },  // Assignment title
  description: { type: String, required: true },  // Assignment description
  assignmentPDF: { type: String, required: true },  // Path to the uploaded assignment PDF
  dueDate: { type: Date, required: true },  // Due date for the assignment
  studentSubmissions: [
    {
      studentId: { type: String },  // Student ID (optional for flexibility)
      studentName: { type: String, required: true },  // Student's name
      submissionPDF: { type: String, required: true },  // Path to the submitted assignment PDF
      submittedAt: { type: Date, default: Date.now },  // Submission time
    }
  ]
}, { timestamps: true });  // Automatically adds createdAt and updatedAt timestamps

module.exports = mongoose.model('Assignment', assignmentSchema);

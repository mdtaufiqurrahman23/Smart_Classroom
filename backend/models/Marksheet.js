// backend/models/Marksheet.js
const mongoose = require('mongoose');

const marksheetSchema = new mongoose.Schema({
  studentId: { type: String, required: true },  // Student ID
  studentName: { type: String, required: true },  // Student name
  classCode: { type: String, required: true },  // Associated classroom
  
  // Individual quiz scores (4 quizzes max)
  quizScores: {
    quiz1: { type: Number, default: 0 },
    quiz2: { type: Number, default: 0 },
    quiz3: { type: Number, default: 0 },
    quiz4: { type: Number, default: 0 },
  },
  
  // Individual lab scores (4 labs max)
  labScores: {
    lab1: { type: Number, default: 0 },
    lab2: { type: Number, default: 0 },
    lab3: { type: Number, default: 0 },
    lab4: { type: Number, default: 0 },
  },
  
  // Final marks (calculated - average of best 3)
  finalQuizMarks: { type: Number, default: 0 },  // Best 3 avg (out of 15)
  finalLabMarks: { type: Number, default: 0 },   // Best 3 avg (out of 25)
  
  // Other marks
  assignmentMarks: { type: Number, default: 0, min: 0, max: 10 },  // Out of 10
  midtermMarks: { type: Number, default: 0, min: 0, max: 20 },     // Out of 20
  finalExamMarks: { type: Number, default: 0, min: 0, max: 30 },   // Out of 30
  
  totalMarks: { type: Number, default: 0 },  // Total marks (calculated)
  grade: { type: String, default: 'N/A' },  // Final grade (calculated)
  
}, { timestamps: true });  // Automatically add createdAt and updatedAt

module.exports = mongoose.model('Marksheet', marksheetSchema);

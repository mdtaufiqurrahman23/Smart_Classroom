// backend/models/LessonPlan.js
const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema({
  classCode: { type: String, required: true }, // Associated classroom
  date: { type: Date, required: true }, // Date of the lesson
  topic: { type: String, required: true }, // Lesson topic (subject)
  notes: { type: String }, // Additional notes for the lesson (homework, materials, etc.)
}, { timestamps: true });  // Automatically add createdAt and updatedAt

module.exports = mongoose.model('LessonPlan', lessonPlanSchema);

// backend/models/AnonymousFeedback.js
const mongoose = require('mongoose');

const anonymousFeedbackSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Classroom the feedback is for
  feedbackMessage: { type: String, required: true },  // The feedback message
  feedbackDate: { type: Date, default: Date.now },  // Date when the feedback was submitted
});

module.exports = mongoose.model('AnonymousFeedback', anonymousFeedbackSchema);

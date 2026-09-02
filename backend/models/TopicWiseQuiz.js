// backend/models/TopicWiseQuiz.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

const quizSchema = new mongoose.Schema({
  classCode: { type: String, required: true }, // Associated classroom
  topic: { type: String, required: true },  // Topic the quiz is for
  questions: [questionSchema],  // List of questions for the quiz
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TopicWiseQuiz', quizSchema);

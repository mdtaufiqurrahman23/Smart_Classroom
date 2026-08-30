// backend/models/TopicWiseQnA.js
const mongoose = require('mongoose');

const qnaSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Associated classroom
  topic: { type: String, required: true },  // Topic the QnA is for
  question: { type: String, required: true },
  answer: { type: String, required: false },
  askedBy: { type: String, required: true },  // Student who asked the question
  answeredBy: { type: String, required: false },  // Teacher who answers
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TopicWiseQnA', qnaSchema);

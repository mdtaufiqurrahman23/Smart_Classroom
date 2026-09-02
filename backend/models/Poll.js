// backend/models/Poll.js
const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  option: { type: String, required: true },
  votes: { type: Number, default: 0 },
});

const pollSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Associated classroom
  question: { type: String, required: true },   // Poll question
  options: [pollOptionSchema],                  // Options for the poll
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Poll', pollSchema);

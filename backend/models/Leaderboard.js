// backend/models/Leaderboard.js
const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  studentId: { type: String, required: true },  // Student ID
  studentName: { type: String, required: true },  // Student Name
  points: { type: Number, default: 0 },  // Points earned by the student for contributing resources
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);

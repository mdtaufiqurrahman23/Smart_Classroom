// backend/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Reference to the classroom
  title: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },  // The date when the announcement was created
});

module.exports = mongoose.model('Announcement', announcementSchema);

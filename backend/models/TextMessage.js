// backend/models/TextMessage.js
const mongoose = require('mongoose');

const textMessageSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Associated classroom
  senderId: { type: String },  // User ID who sent the message
  senderName: { type: String, required: true },  // Name of sender
  senderRole: { type: String, enum: ['teacher', 'student'], required: true },  // Role of sender
  message: { type: String, required: true },    // Text message content
  sentAt: { type: Date, default: Date.now },    // Date when the message was sent
});

module.exports = mongoose.model('TextMessage', textMessageSchema);

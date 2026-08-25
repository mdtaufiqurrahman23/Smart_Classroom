// backend/controllers/textMessageController.js
const TextMessage = require('../models/TextMessage');  // Import the TextMessage model

// Send a text message to students in a specific classroom
exports.sendTextMessage = async (req, res) => {
  const { classCode, message, senderName, senderRole } = req.body;

  try {
    const newMessage = new TextMessage({
      classCode,
      senderName: senderName || 'Anonymous',
      senderRole: senderRole || 'teacher',
      message,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Text message sent successfully!', textMessage: newMessage });
  } catch (error) {
    console.error('Error sending text message:', error);
    res.status(500).json({ message: 'Failed to send text message' });
  }
};

// Get all text messages for a specific classroom
exports.getTextMessages = async (req, res) => {
  const { classCode } = req.params;  // Get classCode from the request parameters

  try {
    const messages = await TextMessage.find({ classCode }).sort({ sentAt: -1 });  // Sort by sent date (latest first)
    res.status(200).json(messages);  // Return the list of messages
  } catch (error) {
    console.error('Error fetching text messages:', error);
    res.status(500).json({ message: 'Failed to fetch text messages' });
  }
};

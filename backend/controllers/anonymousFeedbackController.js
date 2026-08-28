// backend/controllers/anonymousFeedbackController.js
const AnonymousFeedback = require('../models/AnonymousFeedback');  // Import AnonymousFeedback model

// Submit anonymous feedback from a student
exports.submitFeedback = async (req, res) => {
  const { classCode, feedbackMessage } = req.body;

  try {
    const newFeedback = new AnonymousFeedback({
      classCode,
      feedbackMessage,
    });

    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully!', feedback: newFeedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

// Get all feedback for a specific classroom
exports.getFeedbackByClassCode = async (req, res) => {
  const { classCode } = req.params;  // Get classCode from the request parameters

  try {
    const feedbacks = await AnonymousFeedback.find({ classCode }).sort({ feedbackDate: -1 });  // Sort by date (latest first)
    res.status(200).json(feedbacks);  // Return the list of feedback
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
};

// Delete feedback by ID
exports.deleteFeedback = async (req, res) => {
  const { feedbackId } = req.params;

  try {
    const feedback = await AnonymousFeedback.findByIdAndDelete(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
};

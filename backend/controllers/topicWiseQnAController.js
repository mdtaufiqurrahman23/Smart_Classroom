// backend/controllers/topicWiseQnAController.js
const TopicWiseQnA = require('../models/TopicWiseQnA');  // Import the TopicWiseQnA model

// Create (submit) a new question for a specific topic
exports.createQuestion = async (req, res) => {
  const { classCode, topic, question, askedBy } = req.body;

  try {
    const newQnA = new TopicWiseQnA({
      classCode,
      topic,
      question,
      askedBy,
    });

    await newQnA.save();
    res.status(201).json({ message: 'Question submitted successfully!', qna: newQnA });
  } catch (error) {
    console.error('Error submitting question:', error);
    res.status(500).json({ message: 'Failed to submit question' });
  }
};

// Update/Answer a question
exports.updateQuestion = async (req, res) => {
  const { qnaId } = req.params;
  const { answer, answeredBy } = req.body;

  try {
    const updatedQnA = await TopicWiseQnA.findByIdAndUpdate(
      qnaId,
      { answer, answeredBy },
      { new: true }
    );

    res.status(200).json({ message: 'Question answered successfully!', qna: updatedQnA });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ message: 'Failed to answer question' });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  const { qnaId } = req.params;

  try {
    await TopicWiseQnA.findByIdAndDelete(qnaId);
    res.status(200).json({ message: 'Question deleted successfully!' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// Get all QnAs for a specific classCode
exports.getQnAsByClassCode = async (req, res) => {
  const { classCode } = req.params;

  try {
    const qnas = await TopicWiseQnA.find({ classCode });
    res.status(200).json(qnas);
  } catch (error) {
    console.error('Error fetching QnAs:', error);
    res.status(500).json({ message: 'Failed to fetch QnAs' });
  }
};

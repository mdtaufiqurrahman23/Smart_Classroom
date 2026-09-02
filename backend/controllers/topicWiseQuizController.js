// backend/controllers/topicWiseQuizController.js
const TopicWiseQuiz = require('../models/TopicWiseQuiz');  // Import the TopicWiseQuiz model

// Create a new quiz
exports.createQuiz = async (req, res) => {
  const { classCode, topic, questions } = req.body;

  try {
    const newQuiz = new TopicWiseQuiz({
      classCode,
      topic,
      questions,
    });

    await newQuiz.save();
    res.status(201).json({ message: 'Quiz created successfully!', quiz: newQuiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
};

// Get quizzes for a specific classCode
exports.getQuizzesByClassCode = async (req, res) => {
  const { classCode } = req.params;

  try {
    const quizzes = await TopicWiseQuiz.find({ classCode });
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};

// Delete a quiz
exports.deleteQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    await TopicWiseQuiz.findByIdAndDelete(quizId);
    res.status(200).json({ message: 'Quiz deleted successfully!' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
};

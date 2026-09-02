// backend/controllers/pollController.js
const Poll = require('../models/Poll');  // Import the Poll model

// Create a new poll
exports.createPoll = async (req, res) => {
  const { classCode, question, options } = req.body;

  try {
    const pollOptions = options.map((option) => ({ option, votes: 0 }));  // Format options
    const newPoll = new Poll({
      classCode,
      question,
      options: pollOptions,
    });

    await newPoll.save();
    res.status(201).json({ message: 'Poll created successfully!', poll: newPoll });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ message: 'Failed to create poll' });
  }
};

// Get all polls for a specific classroom
exports.getPollsByClassCode = async (req, res) => {
  const { classCode } = req.params;

  try {
    const polls = await Poll.find({ classCode });
    res.status(200).json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: 'Failed to fetch polls' });
  }
};

// Vote for a poll option
exports.votePoll = async (req, res) => {
  const { pollId, optionIndex } = req.body;  // Poll ID and the option index

  try {
    const poll = await Poll.findById(pollId);
    poll.options[optionIndex].votes += 1;  // Increment the vote for the selected option
    await poll.save();

    res.status(200).json({ message: 'Vote submitted successfully!', poll });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ message: 'Failed to submit vote' });
  }
};
// Delete a poll
exports.deletePoll = async (req, res) => {
  const { pollId } = req.params;                

  try {
    await Poll.findByIdAndDelete(pollId);
    res.status(200).json({ message: 'Poll deleted successfully!' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ message: 'Failed to delete poll' });
  }
};
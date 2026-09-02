// backend/controllers/leaderboardController.js
const Leaderboard = require('../models/Leaderboard');  // Import Leaderboard model
const Resource = require('../models/Resource');  // Import Resource model

// Award points to a student for their resource contribution
exports.awardPointsForResource = async (req, res) => {
  const { resourceId, studentId, studentName, points } = req.body;

  try {
    // Update the resource with points
    await Resource.findByIdAndUpdate(resourceId, { points }, { new: true });

    // Find or create a leaderboard entry for the student
    let leaderboardEntry = await Leaderboard.findOne({ studentId });
    if (!leaderboardEntry) {
      leaderboardEntry = new Leaderboard({ studentId, studentName, points: 0 });
    }

    // Add points to the student's leaderboard entry
    leaderboardEntry.points += points;
    await leaderboardEntry.save();

    res.status(200).json({ message: 'Points awarded successfully!', leaderboardEntry });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ message: 'Failed to award points' });
  }
};

// Get the leaderboard (all students)
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ points: -1 });  // Sort by points in descending order
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

// Update points when a student contributes a resource
exports.addPointsForResource = async (req, res) => {
  const { studentId, studentName } = req.body;

  try {
    // Find or create a leaderboard entry for the student
    let leaderboardEntry = await Leaderboard.findOne({ studentId });
    if (!leaderboardEntry) {
      leaderboardEntry = new Leaderboard({ studentId, studentName, points: 0 });
    }

    // Add 10 points for each resource contribution (you can adjust this value)
    leaderboardEntry.points += 10;  // Add points for the resource contribution
    await leaderboardEntry.save();

    res.status(200).json({ message: 'Points added successfully!', leaderboardEntry });
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ message: 'Failed to add points' });
  }
};

// backend/routes/leaderboardRoutes.js
const express = require('express');
const { awardPointsForResource, addPointsForResource, getLeaderboard } = require('../controllers/leaderboardController');
const router = express.Router();

// Route to award points to a student for a specific resource
router.post('/award-points', awardPointsForResource);

// Route to add points for a student when they contribute a resource
router.post('/add-points', addPointsForResource);

// Route to get the leaderboard
router.get('/', getLeaderboard);

module.exports = router;

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getPendingRequests, getAllUsers, approveUser, rejectUser, deleteUser } = require('../controllers/adminController');
const router = express.Router();

// Only an authenticated admin may use any of these routes
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
};

router.get('/pending', authMiddleware, requireAdmin, getPendingRequests);
router.get('/users', authMiddleware, requireAdmin, getAllUsers);
router.post('/approve/:userId', authMiddleware, requireAdmin, approveUser);
router.post('/reject/:userId', authMiddleware, requireAdmin, rejectUser);
router.delete('/users/:userId', authMiddleware, requireAdmin, deleteUser);

module.exports = router;

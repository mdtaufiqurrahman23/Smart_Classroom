const User = require('../models/User');

// Generate a sequential-looking unique ID per role, e.g. STU-00001, TCH-00001
const generateUniqueId = async (role) => {
  const prefix = role === 'teacher' ? 'TCH' : 'STU';
  const count = await User.countDocuments({ role, uniqueId: { $exists: true, $ne: '' } });
  const number = String(count + 1).padStart(5, '0');
  return `${prefix}-${number}`;
};

// List all pending student/teacher registration requests
exports.getPendingRequests = async (req, res) => {
  try {
    const pending = await User.find({ status: 'pending', role: { $in: ['student', 'teacher'] } })
      .select('-password')
      .sort({ createdAt: 1 });
    res.json(pending);
  } catch (error) {
    console.error('❌ GET PENDING ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// List every active/rejected student & teacher, for the admin's own reference
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['student', 'teacher'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('❌ GET ALL USERS ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve a pending request — activates the account and assigns its unique ID
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'pending') {
      return res.status(400).json({ error: `This request is already ${user.status}` });
    }

    user.status = 'active';
    user.uniqueId = await generateUniqueId(user.role);
    await user.save();

    res.json({ success: true, message: `${user.role} approved`, user: { id: user._id, name: user.name, email: user.email, role: user.role, uniqueId: user.uniqueId } });
  } catch (error) {
    console.error('❌ APPROVE USER ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reject a pending request
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'pending') {
      return res.status(400).json({ error: `This request is already ${user.status}` });
    }

    user.status = 'rejected';
    await user.save();

    res.json({ success: true, message: `${user.role} request rejected` });
  } catch (error) {
    console.error('❌ REJECT USER ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

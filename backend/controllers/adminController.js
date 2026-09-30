const User = require('../models/User');

// Generate a sequential-looking unique ID per role, e.g. STU-00001, TCH-00001.
// Used as a suggested default for students (admin can overwrite it) and as
// the final ID for teachers (who have no other ID concept to assign).
const generateUniqueId = async (role) => {
  const prefix = role === 'teacher' ? 'TCH' : 'STU';
  const count = await User.countDocuments({ role, uniqueId: { $exists: true, $ne: '' } });
  const number = String(count + 1).padStart(5, '0');
  return `${prefix}-${number}`;
};

// List all pending student/teacher registration requests. Students get a
// suggestedId the admin dashboard can pre-fill (and override) when approving.
exports.getPendingRequests = async (req, res) => {
  try {
    const pending = await User.find({ status: 'pending', role: { $in: ['student', 'teacher'] } })
      .select('-password')
      .sort({ createdAt: 1 });

    const withSuggestions = await Promise.all(pending.map(async (doc) => {
      const obj = doc.toObject();
      if (obj.role === 'student') {
        obj.suggestedId = await generateUniqueId('student');
      }
      return obj;
    }));

    res.json(withSuggestions);
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

// Approve a pending request — activates the account and assigns its ID.
// Students: the admin provides studentId in the request body (this is the
// ONLY place a student's ID ever gets set — they can't choose it at signup).
// Teachers: no ID concept to assign manually, so one is auto-generated.
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status !== 'pending') {
      return res.status(400).json({ error: `This request is already ${user.status}` });
    }

    if (user.role === 'student') {
      const { studentId } = req.body;
      if (!studentId || !studentId.trim()) {
        return res.status(400).json({ error: 'A Student ID is required to approve a student' });
      }
      const normalizedId = studentId.trim().toUpperCase();
      const existing = await User.findOne({ studentId: normalizedId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ error: 'That Student ID is already assigned to someone else' });
      }
      user.studentId = normalizedId;
      user.uniqueId = normalizedId;
    } else {
      user.uniqueId = await generateUniqueId(user.role);
    }

    user.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: `${user.role} approved`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, uniqueId: user.uniqueId, studentId: user.studentId || '' }
    });
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

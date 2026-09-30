const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {  // ← async added
  try {
    let { email, password, role, name, studentId, department } = req.body;
    
    console.log('📝 SIGNUP ATTEMPT:', { email, role, name, studentId });
    
    // Normalize email
    email = email.trim().toLowerCase();
    
    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, role required' });
    }

    // Admin accounts are seeded directly, never created through public signup
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be self-registered' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (role === 'student') {
      if (!name || !studentId || !department) {
        return res.status(400).json({ error: 'Student: name, ID, department required' });
      }
      // Check if student ID exists
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({ error: 'Student ID already exists' });
      }
    }

    if (role === 'teacher' && !name) {
      return res.status(400).json({ error: 'Teacher: name required' });
    }

    // Create user (bcrypt hashes in pre-save hook). Students/teachers start
    // as 'pending' — an admin has to approve the request before they can log in.
    const user = new User({
      email,
      password,
      role,
      name,
      status: 'pending',
      ...(role === 'student' && { studentId, department })
    });

    console.log('💾 SAVING USER TO DB...');
    await user.save();
    console.log('✅ USER SAVED SUCCESSFULLY (pending admin approval):', user._id, 'Email:', user.email);

    // No token issued — the account isn't usable until an admin approves it.
    res.status(201).json({
      success: true,
      pending: true,
      message: 'Registration submitted! An admin will review your request and activate your account.'
    });
  } catch (error) {
    console.error('❌ SIGNUP ERROR:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {  // ← async added
  try {
    let { email, password, expectedRole } = req.body;

    console.log('🔐 LOGIN ATTEMPT:', { email, expectedRole });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Normalize email (IMPORTANT: must match signup normalization)
    email = email.trim().toLowerCase();
    console.log('📧 NORMALIZED EMAIL:', email);

    const user = await User.findOne({ email });
    console.log('🔍 USER FOUND:', user ? 'YES ✅' : 'NO ❌');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password exists in database
    console.log('🔒 PASSWORD IN DB:', user.password ? 'YES ✅' : 'NO ❌');
    if (!user.password) {
      console.error('ERROR: User found but password not stored in database!');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔑 COMPARING PASSWORDS...');
    console.log('   Input password:', password);
    console.log('   Hashed password from DB:', user.password.substring(0, 30) + '...');

    const isMatch = await user.comparePassword(password);
    console.log('✔️ PASSWORD MATCH:', isMatch ? 'YES ✅' : 'NO ❌');

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // The login form itself tells us which role it's for (student/teacher/admin
    // login pages). Reject if the account's actual role doesn't match — this is
    // what stops a teacher account from logging in through the student page.
    if (expectedRole && user.role !== expectedRole) {
      console.log(`❌ ROLE MISMATCH: account is '${user.role}', tried to log in as '${expectedRole}'`);
      return res.status(403).json({
        error: `This account is registered as a ${user.role}. Please use the ${user.role} login page.`
      });
    }

    // Students/teachers can't log in until an admin approves their request.
    if (user.role !== 'admin' && user.status !== 'active') {
      console.log(`❌ NOT ACTIVE: account status is '${user.status}'`);
      if (user.status === 'rejected') {
        return res.status(403).json({ error: 'Your registration was rejected. Please contact the administration.' });
      }
      return res.status(403).json({ error: 'Your registration is still pending admin approval.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get the logged-in user's full profile (req.user is set by authMiddleware)
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      uniqueId: user.uniqueId || '',
      name: user.name || '',
      studentId: user.studentId || '',
      department: user.department || '',
      profileImage: user.profileImage || '',
      phone: user.phone || '',
      bio: user.bio || ''
    });
  } catch (error) {
    console.error('❌ GET PROFILE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update the logged-in user's profile — name, phone, bio, department, and
// optionally a new profile image (multipart, handled by upload middleware).
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, phone, bio, department } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (department !== undefined && user.role === 'student') user.department = department.toUpperCase();
    if (req.file) user.profileImage = `/uploads/${req.file.filename}`;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name || '',
        studentId: user.studentId || '',
        department: user.department || '',
        profileImage: user.profileImage || '',
        phone: user.phone || '',
        bio: user.bio || ''
      }
    });
  } catch (error) {
    console.error('❌ UPDATE PROFILE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

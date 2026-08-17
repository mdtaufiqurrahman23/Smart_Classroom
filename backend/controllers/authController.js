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
    
    // Create user (bcrypt hashes in pre-save hook)
    const user = new User({ 
      email, 
      password, 
      role, 
      ...(role === 'student' && { name, studentId, department })
    });
    
    console.log('💾 SAVING USER TO DB...');
    await user.save();
    console.log('✅ USER SAVED SUCCESSFULLY:', user._id, 'Email:', user.email);
    
    // Verify user can be found immediately
    const verifyUser = await User.findOne({ email });
    console.log('🔍 VERIFICATION - User found in DB:', verifyUser ? 'YES' : 'NO');
    if (verifyUser && verifyUser.password) {
      console.log('🔒 Password stored in DB:', verifyUser.password.substring(0, 20) + '...');
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, email, role } 
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
    let { email, password } = req.body;
    
    console.log('🔐 LOGIN ATTEMPT:', { email });
    
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

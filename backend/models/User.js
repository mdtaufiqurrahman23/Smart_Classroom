const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'Email required'], 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password required'], 
    minlength: 6 
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  // Admin-approval workflow: students/teachers register as 'pending' and
  // can't log in until an admin approves them. Admin accounts are always
  // 'active' (there's no request/approval step for admin itself).
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending'
  },
  // Assigned by the admin at approval time — the "validity" ID that proves
  // this account was reviewed and accepted, separate from any ID the
  // person claims to have when they register.
  uniqueId: {
    type: String,
    uppercase: true,
    sparse: true,
    unique: true
  },
  name: String,
  studentId: {
    type: String,
    uppercase: true,
    sparse: true,
    unique: true
  },
  department: {
    type: String,
    uppercase: true
  },
  profileImage: { type: String, default: '' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 300 }
}, { timestamps: true });

// FIXED: Simple async hash - NO next() issues
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Password compare
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

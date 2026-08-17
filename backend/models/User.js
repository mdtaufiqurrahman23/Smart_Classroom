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
    enum: ['student', 'teacher'],
    default: 'student'
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
  }
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

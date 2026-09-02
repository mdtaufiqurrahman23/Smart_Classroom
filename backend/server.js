// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const classroomRoutes = require('./routes/classroomRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const textMessageRoutes = require('./routes/textMessageRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const marksheetRoutes = require('./routes/marksheetRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const pollRoutes = require('./routes/pollRoutes');
const anonymousFeedbackRoutes = require('./routes/anonymousFeedbackRoutes');
const leaveRequestRoutes = require('./routes/leaveRequestRoutes');
const lessonPlanRoutes = require('./routes/lessonPlanRoutes');
const topicWiseQnARoutes = require('./routes/topicWiseQnARoutes');
const topicWiseQuizRoutes = require('./routes/topicWiseQuizRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
// ADD YOUR ROUTE IMPORT ABOVE THIS LINE

const app = express();

// Middleware setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/text-messages', textMessageRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/marksheets', marksheetRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/polls', pollRoutes);

// Module 2 Communication
app.use('/api/feedback', anonymousFeedbackRoutes);
app.use('/api/anonymous-feedback', anonymousFeedbackRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/leave-request', leaveRequestRoutes);

// Module 3 Academics
app.use('/api/lesson-plans', lessonPlanRoutes);
app.use('/api/lesson-plan', lessonPlanRoutes);
app.use('/api/topicwise-qna', topicWiseQnARoutes);
app.use('/api/topic-wise-qna', topicWiseQnARoutes);
app.use('/api/topicwise-quiz', topicWiseQuizRoutes);
app.use('/api/topic-wise-quiz', topicWiseQuizRoutes);

// Module 4 Engagement & Resources
app.use('/api/resources', resourceRoutes);
// ADD YOUR ROUTE REGISTRATION ABOVE THIS LINE

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend Live! 🚀' });
});

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-class-app';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// backend/wipeStudentTeacherData.js
//
// Permanently deletes every student/teacher account and everything tied to
// them (classrooms, attendance, assignments, announcements, etc.) — a fresh
// start for the new admin-approval registration system.
//
// This does NOT touch an admin account, since admin is seeded separately
// (see seedAdmin.js) and isn't part of "teacher-student data".
//
// THIS CANNOT BE UNDONE. Run it yourself when you're ready:
//   node wipeStudentTeacherData.js
require('dotenv').config();
const mongoose = require('mongoose');

const modelNames = [
  'User', 'Announcement', 'AnonymousFeedback', 'Assignment', 'Attendance',
  'Classroom', 'Leaderboard', 'LeaveRequest', 'LessonPlan', 'Marksheet',
  'Poll', 'Resource', 'TextMessage', 'TopicWiseQnA', 'TopicWiseQuiz'
];

async function wipe() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Wiping teacher/student data...\n');

  for (const name of modelNames) {
    const Model = require(`./models/${name}`);
    // Keep any admin accounts if the User collection is what we're clearing
    const filter = name === 'User' ? { role: { $ne: 'admin' } } : {};
    const before = await Model.countDocuments(filter);
    const result = await Model.deleteMany(filter);
    console.log(`${name}: had ${before}, deleted ${result.deletedCount}`);
  }

  console.log('\n--- Wipe complete ---');
  process.exit(0);
}

wipe().catch((err) => {
  console.error('❌ Wipe failed:', err.message);
  process.exit(1);
});

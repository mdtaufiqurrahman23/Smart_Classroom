// Smart_classroom/backend/seedData.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const Classroom = require('./models/Classroom');
const Attendance = require('./models/Attendance');
const AnonymousFeedback = require('./models/AnonymousFeedback');
const LeaveRequest = require('./models/LeaveRequest');
const LessonPlan = require('./models/LessonPlan');
const TopicWiseQnA = require('./models/TopicWiseQnA');
const TopicWiseQuiz = require('./models/TopicWiseQuiz');

async function seed() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-class-app';
    console.log('Connecting to MongoDB at:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clean up existing demo data if re-running
    await User.deleteMany({ email: { $in: [
      'teacher@test.com',
      'alice@student.com',
      'bob@student.com',
      'charlie@student.com',
      'diana@student.com',
      'ethan@student.com'
    ] } });
    await Classroom.deleteMany({ classCode: 'CSE470' });
    await Attendance.deleteMany({ classCode: 'CSE470' });
    await AnonymousFeedback.deleteMany({ classCode: 'CSE470' });
    await LeaveRequest.deleteMany({ classCode: 'CSE470' });
    await LessonPlan.deleteMany({ classCode: 'CSE470' });
    await TopicWiseQnA.deleteMany({ classCode: 'CSE470' });
    await TopicWiseQuiz.deleteMany({ classCode: 'CSE470' });

    console.log('🧹 Cleaned previous demo records');

    // 1. Create Teacher
    const teacher = await User.create({
      name: 'Prof. Alan Turing',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher'
    });
    console.log('👨‍🏫 Teacher created:', teacher.email);

    // 2. Create Students
    const studentData = [
      { name: 'Alice Johnson', studentId: '2021001', email: 'alice@student.com', department: 'CSE' },
      { name: 'Bob Smith', studentId: '2021002', email: 'bob@student.com', department: 'CSE' },
      { name: 'Charlie Davis', studentId: '2021003', email: 'charlie@student.com', department: 'CSE' },
      { name: 'Diana Prince', studentId: '2021004', email: 'diana@student.com', department: 'CSE' },
      { name: 'Ethan Hunt', studentId: '2021005', email: 'ethan@student.com', department: 'CSE' }
    ];

    const students = [];
    for (const s of studentData) {
      const student = await User.create({
        ...s,
        password: 'password123',
        role: 'student'
      });
      students.push(student);
    }
    console.log(`🎓 Created ${students.length} students`);

    // 3. Create Classroom
    const classroom = await Classroom.create({
      name: 'CSE470: Software Engineering',
      details: 'Section 01 - Mon/Wed 10:00 AM',
      classCode: 'CSE470',
      teacher: teacher._id,
      students: students.map(s => s._id)
    });
    console.log('🏫 Classroom created with code:', classroom.classCode);

    // 4. Create Attendance Data
    // Generate dates for the past 7 days (including today)
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const attendanceRecords = [];
    // Realistic attendance pattern for each student
    // e.g., Alice: 100%, Bob: 85%, Charlie: 71%, Diana: 85%, Ethan: 57%
    const attendancePatterns = {
      'Alice Johnson': ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present'],
      'Bob Smith': ['Present', 'Present', 'Absent', 'Present', 'Present', 'Present', 'Present'],
      'Charlie Davis': ['Absent', 'Present', 'Present', 'Absent', 'Present', 'Present', 'Present'],
      'Diana Prince': ['Present', 'Present', 'Present', 'Present', 'Absent', 'Present', 'Present'],
      'Ethan Hunt': ['Present', 'Absent', 'Present', 'Absent', 'Present', 'Absent', 'Present']
    };

    dates.forEach((dateStr, dateIdx) => {
      students.forEach(student => {
        const status = attendancePatterns[student.name][dateIdx] || 'Present';
        const dateObj = new Date(dateStr + 'T09:00:00.000Z');
        attendanceRecords.push({
          classCode: classroom.classCode,
          studentId: student._id.toString(),
          name: student.name,
          status,
          date: dateObj,
          timestamp: dateObj,
          sessionId: dateIdx === dates.length - 1 ? 'session-today-demo' : null
        });
      });
    });

    await Attendance.insertMany(attendanceRecords);
    console.log(`📊 Inserted ${attendanceRecords.length} attendance records across ${dates.length} dates!`);

    // 5. Add Demo Member 2 Data (Feedback, Leaves, Lesson Plan, Q&A, Quiz)
    await AnonymousFeedback.create([
      {
        classCode: classroom.classCode,
        feedbackMessage: 'The explanation on Software Design Patterns in last lecture was very clear and helpful!'
      },
      {
        classCode: classroom.classCode,
        feedbackMessage: 'Could we please have a 10-minute recap of REST architecture before the next lab?'
      }
    ]);

    await LeaveRequest.create([
      {
        classCode: classroom.classCode,
        studentId: students[1].studentId,
        studentName: students[1].name,
        reason: 'Severe seasonal viral influenza with high fever. Doctor prescribed 3 days of strict bed rest.',
        leaveDate: new Date(),
        status: 'Pending',
        document: 'medical_certificate_bob.pdf'
      },
      {
        classCode: classroom.classCode,
        studentId: students[2].studentId,
        studentName: students[2].name,
        reason: 'Selected as primary team coder representing the university at the National Inter-University ACM-ICPC Programming Contest.',
        leaveDate: new Date(Date.now() - 86400000 * 2),
        status: 'Approved',
        document: 'icpc_invitation_charlie.pdf'
      },
      {
        classCode: classroom.classCode,
        studentId: students[3].studentId,
        studentName: students[3].name,
        reason: 'Attending IEEE International Conference on Software Engineering as co-author of a student research paper.',
        leaveDate: new Date(Date.now() + 86400000),
        status: 'Approved',
        document: 'ieee_conference_pass.pdf'
      },
      {
        classCode: classroom.classCode,
        studentId: students[4].studentId,
        studentName: students[4].name,
        reason: 'Immediate travel required due to urgent family medical emergency. Will review lecture recordings.',
        leaveDate: new Date(),
        status: 'Pending',
        document: ''
      },
      {
        classCode: classroom.classCode,
        studentId: students[0].studentId,
        studentName: students[0].name,
        reason: 'Scheduled dental surgery (wisdom tooth extraction) and post-operative recovery period.',
        leaveDate: new Date(Date.now() - 86400000 * 3),
        status: 'Approved',
        document: 'dental_prescription_alice.pdf'
      },
      {
        classCode: classroom.classCode,
        studentId: students[1].studentId,
        studentName: students[1].name,
        reason: 'Missed class due to unplanned personal leisure trip without advance departmental notification.',
        leaveDate: new Date(Date.now() - 86400000 * 5),
        status: 'Rejected',
        document: ''
      }
    ]);

    const year = new Date().getFullYear();
    const month = new Date().getMonth();

    await LessonPlan.create([
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 1, 10, 0, 0),
        topic: 'Introduction to Software Engineering & SDLC Models',
        notes: 'Overview of classical Waterfall vs. Modern Agile. Historical context of software crisis and professional code of ethics.'
      },
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 3, 10, 0, 0),
        topic: 'Requirements Engineering & User Stories',
        notes: 'Eliciting functional vs. non-functional requirements. Structuring user stories with INVEST criteria and MoSCoW prioritization.'
      },
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 7, 10, 0, 0),
        topic: 'Agile Methodologies & Scrum Framework',
        notes: 'Sprint planning ceremonies, daily standups, backlog refinement, sprint review, and retrospective rituals.'
      },
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 9, 10, 0, 0),
        topic: 'Software Architecture & MVC Pattern',
        notes: 'Architectural styles, Model-View-Controller (MVC) layers, separation of concerns, and RESTful API contracts.'
      },
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 14, 10, 0, 0),
        topic: 'Object-Oriented Design & Creational Design Patterns',
        notes: 'Deep dive into Singleton, Factory Method, and Abstract Factory patterns. Hands-on code refactoring exercise.'
      },
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 16, 10, 0, 0),
        topic: 'Structural & Behavioral Patterns (Observer & Strategy)',
        notes: 'Event-driven architecture with Observer pattern, algorithm encapsulation with Strategy, and Adapter for legacy bridges.'
      },
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 21, 10, 0, 0),
        topic: 'Software Testing, QA & Test-Driven Development (TDD)',
        notes: 'Unit testing, integration testing, black-box vs white-box techniques, Jest test suites, and Red-Green-Refactor cycle.'
      },
      {
        classCode: classroom.classCode,
        date: new Date(year, month, 23, 10, 0, 0),
        topic: 'CI/CD Pipelines, DevOps & Automated Deployment',
        notes: 'GitHub Actions workflow automation, Docker containerization, cloud artifact hosting, and zero-downtime releases.'
      }
    ]);

    await TopicWiseQnA.create([
      {
        classCode: classroom.classCode,
        topic: 'Design Patterns',
        question: 'What is the practical difference between Factory Pattern and Abstract Factory Pattern?',
        askedBy: students[0].name,
        answer: 'Factory Pattern creates objects through a single inheritance method, whereas Abstract Factory provides an interface for creating families of related or dependent objects without specifying their concrete classes.',
        answeredBy: teacher.name
      },
      {
        classCode: classroom.classCode,
        topic: 'Database Design',
        question: 'When is it better to use embedding over referencing in MongoDB?',
        askedBy: students[1].name
      }
    ]);

    await TopicWiseQuiz.create({
      classCode: classroom.classCode,
      topic: 'Software Testing & QA',
      questions: [
        {
          question: 'Which of the following is considered Black Box testing?',
          options: ['Equivalence Partitioning', 'Code Coverage', 'Mutation Testing', 'Statement Testing'],
          correctAnswer: 'Equivalence Partitioning'
        },
        {
          question: 'What does TDD stand for?',
          options: ['Test Driven Development', 'Technical Design Document', 'Total Delivery Duration', 'Test Design Document'],
          correctAnswer: 'Test Driven Development'
        }
      ]
    });

    console.log('🎉 All demo data successfully seeded!');
    console.log('\n--- Demo Login Credentials ---');
    console.log('Teacher: teacher@test.com / password123');
    console.log('Student: alice@student.com / password123');
    console.log('Student: bob@student.com / password123');
    console.log('Class Code: CSE470');
    console.log('Classroom URL: http://localhost:3000/classroom/CSE470');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed();

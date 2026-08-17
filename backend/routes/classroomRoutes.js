// backend/routes/classroomRoutes.js
const express = require('express');
const { createClassroom, getClassrooms, getClassroomByCode, getClassroomById, joinClassroom, getTeacherClasses, getStudentClasses } = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Route to create a classroom (teacher only)
router.post('/create', authMiddleware, createClassroom);

// Route to get all classrooms
router.get('/', getClassrooms);

// Route to get classroom by ID (teacher access control)
router.get('/my-classroom/:classroomId', authMiddleware, getClassroomById);

// Route to get all classes for a teacher
router.get('/teacher/my-classes', authMiddleware, getTeacherClasses);

// Route to get classroom by class code (for students joining)
router.get('/:classCode', getClassroomByCode);

// Route for student to join a classroom with class code
router.post('/student/join', authMiddleware, joinClassroom);

// Route to get all classes for a student
router.get('/student/my-classes', authMiddleware, getStudentClasses);

module.exports = router;

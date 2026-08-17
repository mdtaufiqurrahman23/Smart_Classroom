// backend/controllers/classroomController.js
const Classroom = require('../models/Classroom');  // Ensure this model is correct

// Create a new classroom
exports.createClassroom = async (req, res) => {
  const { name, details } = req.body;
  const teacherId = req.user._id;

  try {
    const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();  // Generate unique class code

    const newClassroom = new Classroom({ 
      name, 
      details, 
      classCode,
      teacher: teacherId,
      students: []
    });
    await newClassroom.save();

    res.status(201).json({ message: 'Classroom created successfully!', classCode });
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ message: 'Failed to create classroom' });
  }
};

// Get all classrooms
exports.getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate('teacher', 'name email').populate('students', 'name email');
    res.status(200).json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ message: 'Failed to fetch classrooms' });
  }
};

// Get classroom by class code (only for students joining or public access during join)
exports.getClassroomByCode = async (req, res) => {
  try {
    const { classCode } = req.params;
    const classroom = await Classroom.findOne({ classCode })
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    res.status(200).json(classroom);
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({ message: 'Failed to fetch classroom' });
  }
};

// Get classroom by ID - WITH TEACHER ACCESS CONTROL
exports.getClassroomById = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if the requesting user is the teacher of this classroom
    if (classroom.teacher._id.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }
    
    res.status(200).json(classroom);
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({ message: 'Failed to fetch classroom' });
  }
};

// Student joins a classroom with class code
exports.joinClassroom = async (req, res) => {
  try {
    const { classCode } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!classCode) {
      return res.status(400).json({ message: 'Class code is required' });
    }

    // Only students can join classrooms
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can join classrooms. Teachers must create their own classrooms.' });
    }

    const classroom = await Classroom.findOne({ classCode: classCode.toUpperCase() });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found with this code' });
    }

    // Check if student is already in the class
    if (classroom.students.includes(userId)) {
      return res.status(400).json({ message: 'You are already enrolled in this class' });
    }

    // Add student to classroom
    classroom.students.push(userId);
    await classroom.save();

    await classroom.populate('teacher', 'name email');

    res.status(200).json({ 
      message: 'Successfully joined the classroom',
      classroom 
    });
  } catch (error) {
    console.error('Error joining classroom:', error);
    res.status(500).json({ message: 'Failed to join classroom' });
  }
};

// Get all classrooms for a teacher
exports.getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const classrooms = await Classroom.find({ teacher: teacherId })
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(classrooms);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
};

// Get all classrooms for a student
exports.getStudentClasses = async (req, res) => {
  try {
    const studentId = req.user._id;

    const classrooms = await Classroom.find({ students: studentId })
      .populate('teacher', 'name email')
      .select('name classCode teacher createdAt');

    res.status(200).json(classrooms);
  } catch (error) {
    console.error('Error fetching student classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
};

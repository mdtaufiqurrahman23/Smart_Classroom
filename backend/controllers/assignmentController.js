// backend/controllers/assignmentController.js
const Assignment = require('../models/Assignment');  // Import the Assignment model

// Create a new assignment
exports.createAssignment = async (req, res) => {
  const { classCode, teacherId, title, description, dueDate, assignmentFileName } = req.body;
  
  console.log('Assignment create request received');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  // Get the file name from multer or from the request body
  let assignmentPDF = assignmentFileName || 'assignment.pdf';
  if (req.file) {
    assignmentPDF = `/uploads/assignments/${req.file.filename}`;
  }

  try {
    // Validate required fields
    if (!classCode) {
      return res.status(400).json({ message: 'Missing required field: classCode' });
    }
    if (!teacherId) {
      return res.status(400).json({ message: 'Missing required field: teacherId' });
    }
    if (!title) {
      return res.status(400).json({ message: 'Missing required field: title' });
    }
    if (!description) {
      return res.status(400).json({ message: 'Missing required field: description' });
    }
    if (!dueDate) {
      return res.status(400).json({ message: 'Missing required field: dueDate' });
    }

    // Convert due date string to Date object if needed
    let dueDateObj = dueDate;
    if (typeof dueDate === 'string') {
      dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj)) {
        return res.status(400).json({ message: 'Invalid due date format' });
      }
    }

    const newAssignment = new Assignment({
      classCode,
      teacherId,
      title,
      description,
      assignmentPDF,
      dueDate: dueDateObj
    });

    console.log('Saving assignment:', newAssignment);
    const savedAssignment = await newAssignment.save();
    console.log('Assignment saved successfully:', savedAssignment._id);
    
    res.status(201).json({ message: 'Assignment created successfully!', assignment: savedAssignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Failed to create assignment', error: error.message });
  }
};

// Get all assignments for a specific classroom
exports.getAssignments = async (req, res) => {
  const { classCode } = req.params;

  try {
    console.log('Getting assignments for classCode:', classCode);
    const assignments = await Assignment.find({ classCode }).sort({ createdAt: -1 });
    console.log('Found assignments:', assignments.length);
    console.log('Assignments data:', assignments);
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

// Submit an assignment (Student upload their completed assignment PDF)
exports.submitAssignment = async (req, res) => {
  const { assignmentId } = req.params;
  const { studentName } = req.body;
  
  console.log('📤 Submit assignment request received');
  console.log('Assignment ID:', assignmentId);
  console.log('Student Name:', studentName);
  console.log('File:', req.file);
  
  // Extract student ID from token if available
  let studentId = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      studentId = decoded.id;
      console.log('Student ID from token:', studentId);
    } catch (err) {
      console.log('Could not decode token for student ID');
    }
  }
  
  let submissionPDF = 'submission.pdf';
  if (req.file) {
    submissionPDF = `http://localhost:5000/uploads/assignments/${req.file.filename}`;
  }

  try {
    if (!assignmentId) {
      return res.status(400).json({ message: 'Missing required field: assignmentId' });
    }

    if (!studentName) {
      return res.status(400).json({ message: 'Missing required field: studentName' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('🔍 Finding assignment:', assignmentId);
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      console.log('❌ Assignment not found:', assignmentId);
      return res.status(404).json({ message: 'Assignment not found' });
    }

    console.log('✅ Assignment found, adding submission');
    // Add the student submission to the assignment
    assignment.studentSubmissions.push({ 
      studentId,
      studentName, 
      submissionPDF,
      submittedAt: new Date()
    });
    await assignment.save();

    console.log('✅ Assignment submitted successfully');
    res.status(200).json({ message: 'Assignment submitted successfully!' });
  } catch (error) {
    console.error('❌ Error submitting assignment:', error);
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
  const { assignmentId } = req.params;

  try {
    if (!assignmentId) {
      return res.status(400).json({ message: 'Missing required field: assignmentId' });
    }

    const assignment = await Assignment.findByIdAndDelete(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    console.log('Assignment deleted successfully:', assignmentId);
    res.status(200).json({ message: 'Assignment deleted successfully!' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Failed to delete assignment', error: error.message });
  }
};

// Delete a specific student submission
exports.deleteSubmission = async (req, res) => {
  const { assignmentId, submissionIndex } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (submissionIndex < 0 || submissionIndex >= assignment.studentSubmissions.length) {
      return res.status(400).json({ message: 'Invalid submission index' });
    }

    assignment.studentSubmissions.splice(submissionIndex, 1);
    await assignment.save();

    console.log('Submission deleted successfully');
    res.status(200).json({ message: 'Submission deleted successfully!' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Failed to delete submission', error: error.message });
  }
};

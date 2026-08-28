// backend/controllers/marksheetController.js
const Marksheet = require('../models/Marksheet');  // Import the Marksheet model

// Function to calculate best 3 of 4 scores and return average
const calculateBest3Average = (scores) => {
  // Handle both object format {quiz1: 5, quiz2: 10, ...} and array format [5, 10, ...]
  let scoreArray = [];
  
  if (typeof scores === 'object' && !Array.isArray(scores)) {
    scoreArray = Object.values(scores).map(s => parseFloat(s) || 0);
  } else if (Array.isArray(scores)) {
    scoreArray = scores.map(s => parseFloat(s) || 0);
  }
  
  if (scoreArray.length === 0) return 0;
  
  scoreArray.sort((a, b) => b - a);
  const best3 = scoreArray.slice(0, 3);
  const sum = best3.reduce((a, b) => a + b, 0);
  
  return sum / 3;
};

// Function to calculate grade based on total marks
const calculateGrade = (totalMarks) => {
  if (totalMarks >= 90) return 'A+';
  if (totalMarks >= 80) return 'A';
  if (totalMarks >= 70) return 'B';
  if (totalMarks >= 60) return 'C';
  if (totalMarks >= 50) return 'D';
  return 'F';
};

// Create a new marksheet and calculate grade
exports.createMarksheet = async (req, res) => {
  const { studentId, studentName, classCode } = req.body;

  try {
    // Create new marksheet entry with default values
    const newMarksheet = new Marksheet({
      studentId,
      studentName,
      classCode,
      quizScores: { quiz1: 0, quiz2: 0, quiz3: 0, quiz4: 0 },
      labScores: { lab1: 0, lab2: 0, lab3: 0, lab4: 0 },
      assignmentMarks: 0,
      midtermMarks: 0,
      finalExamMarks: 0,
      finalQuizMarks: 0,
      finalLabMarks: 0,
      totalMarks: 0,
      grade: 'N/A',
    });

    await newMarksheet.save();
    res.status(201).json({ message: 'Marksheet created successfully!', marksheet: newMarksheet });
  } catch (error) {
    console.error('Error creating marksheet:', error);
    res.status(500).json({ message: 'Failed to create marksheet' });
  }
};

// Get all marksheets for a specific classroom
exports.getMarksheetByClassCode = async (req, res) => {
  const { classCode } = req.params;

  try {
    const marksheets = await Marksheet.find({ classCode });
    res.status(200).json(marksheets);
  } catch (error) {
    console.error('Error fetching marksheets:', error);
    res.status(500).json({ message: 'Failed to fetch marksheets' });
  }
};

// Update marksheet marks and recalculate grade
exports.updateMarksheet = async (req, res) => {
  const { marksheetId } = req.params;
  const { quiz1, quiz2, quiz3, quiz4, lab1, lab2, lab3, lab4, assignmentMarks, midtermMarks, finalExamMarks } = req.body;

  try {
    // Build quiz and lab score objects
    const quizScores = {
      quiz1: parseFloat(quiz1) || 0,
      quiz2: parseFloat(quiz2) || 0,
      quiz3: parseFloat(quiz3) || 0,
      quiz4: parseFloat(quiz4) || 0,
    };

    const labScores = {
      lab1: parseFloat(lab1) || 0,
      lab2: parseFloat(lab2) || 0,
      lab3: parseFloat(lab3) || 0,
      lab4: parseFloat(lab4) || 0,
    };

    // Calculate best 3 of 4 quizzes as average and scale to 15
    const quizAverage = calculateBest3Average(quizScores);
    const finalQuizMarks = parseFloat((quizAverage * 15 / 15).toFixed(2)); // Average of best 3

    // Calculate best 3 of 4 labs as average and scale to 25
    const labAverage = calculateBest3Average(labScores);
    const finalLabMarks = parseFloat((labAverage * 25 / 25).toFixed(2)); // Average of best 3

    // Calculate total marks (out of 100)
    const totalMarks = 
      finalQuizMarks + 
      finalLabMarks + 
      (parseFloat(assignmentMarks) || 0) + 
      (parseFloat(midtermMarks) || 0) + 
      (parseFloat(finalExamMarks) || 0);

    // Calculate grade based on total marks
    const grade = calculateGrade(totalMarks);

    // Update the marksheet
    const updatedMarksheet = await Marksheet.findByIdAndUpdate(
      marksheetId,
      {
        quizScores,
        labScores,
        finalQuizMarks,
        finalLabMarks,
        assignmentMarks: parseFloat(assignmentMarks) || 0,
        midtermMarks: parseFloat(midtermMarks) || 0,
        finalExamMarks: parseFloat(finalExamMarks) || 0,
        totalMarks: parseFloat(totalMarks.toFixed(2)),
        grade,
      },
      { new: true }
    );

    if (!updatedMarksheet) {
      return res.status(404).json({ message: 'Marksheet not found' });
    }

    res.status(200).json({ message: 'Marksheet updated successfully!', marksheet: updatedMarksheet });
  } catch (error) {
    console.error('Error updating marksheet:', error);
    res.status(500).json({ message: 'Failed to update marksheet' });
  }
};

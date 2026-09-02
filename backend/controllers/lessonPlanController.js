// backend/controllers/lessonPlanController.js
const LessonPlan = require('../models/LessonPlan');

// Create a new lesson plan
exports.createLessonPlan = async (req, res) => {
  const { classCode, date, topic, notes } = req.body;

  try {
    // Validate required fields
    if (!classCode || !date || !topic || !notes) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert date string to Date object if needed
    let lessonDate = date;
    if (typeof date === 'string') {
      lessonDate = new Date(date);
      if (isNaN(lessonDate)) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    }

    const newLessonPlan = new LessonPlan({ 
      classCode, 
      date: lessonDate, 
      topic, 
      notes 
    });
    await newLessonPlan.save();
    res.status(201).json({ message: 'Lesson plan created successfully!', lessonPlan: newLessonPlan });
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    res.status(500).json({ message: 'Failed to create lesson plan', error: error.message });
  }
};

// Get all lesson plans for a specific classroom within a date range
exports.getLessonPlans = async (req, res) => {
  const { classCode } = req.params;  // Get classCode from the URL
  const { startDate, endDate } = req.query;  // Get date range (startDate, endDate)

  try {
    const lessonPlans = await LessonPlan.find({
      classCode,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ date: 1 }); // Sort by date in ascending order
    res.status(200).json(lessonPlans);
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    res.status(500).json({ message: 'Failed to fetch lesson plans' });
  }
};

// Update an existing lesson plan
exports.updateLessonPlan = async (req, res) => {
  const { lessonPlanId, topic, notes } = req.body; // Get lesson plan ID and updated data

  try {
    const updatedLessonPlan = await LessonPlan.findByIdAndUpdate(
      lessonPlanId,
      { topic, notes },
      { new: true }
    );
    res.status(200).json({ message: 'Lesson plan updated successfully!', updatedLessonPlan });
  } catch (error) {
    console.error('Error updating lesson plan:', error);
    res.status(500).json({ message: 'Failed to update lesson plan' });
  }
};

// Delete a lesson plan
exports.deleteLessonPlan = async (req, res) => {
  const { lessonPlanId } = req.body;  // Get lesson plan ID to delete

  try {
    await LessonPlan.findByIdAndDelete(lessonPlanId);
    res.status(200).json({ message: 'Lesson plan deleted successfully!' });
  } catch (error) {
    console.error('Error deleting lesson plan:', error);
    res.status(500).json({ message: 'Failed to delete lesson plan' });
  }
};

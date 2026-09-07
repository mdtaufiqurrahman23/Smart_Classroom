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

// Get all lesson plans for a specific classroom (optional date range)
exports.getLessonPlans = async (req, res) => {
  const { classCode } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const query = { classCode };
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      query.date = { $gte: start, $lte: end };
    }

    const lessonPlans = await LessonPlan.find(query).sort({ date: 1 });
    res.status(200).json(lessonPlans);
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    res.status(500).json({ message: 'Failed to fetch lesson plans', error: error.message });
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

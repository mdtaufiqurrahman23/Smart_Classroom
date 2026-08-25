// backend/controllers/announcementController.js
const Announcement = require('../models/Announcement');  // Import Announcement model

// Create a new announcement for a specific classroom (classCode)
exports.createAnnouncement = async (req, res) => {
  const { classCode, title, message } = req.body;

  try {
    // Create a new announcement document tied to a specific classroom
    const newAnnouncement = new Announcement({
      classCode,
      title,
      message,
    });

    await newAnnouncement.save(); // Save the new announcement to the database
    res.status(201).json({ message: 'Announcement created successfully!', announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

// Get all announcements for a specific classroom
exports.getAnnouncements = async (req, res) => {
  const { classCode } = req.params;  // Get the classCode from the request parameters

  try {
    // Fetch announcements for the specified classroom
    const announcements = await Announcement.find({ classCode }).sort({ date: -1 });  // Sort by date (latest first)
    res.status(200).json(announcements);  // Return the list of announcements
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

// Delete an announcement by ID
exports.deleteAnnouncement = async (req, res) => {
  const { announcementId } = req.params;  // Get the announcement ID from the request parameters

  try {
    // Delete the announcement with the specified ID
    const deletedAnnouncement = await Announcement.findByIdAndDelete(announcementId);
    
    if (!deletedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.status(200).json({ message: 'Announcement deleted successfully!' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};

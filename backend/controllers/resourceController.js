// backend/controllers/resourceController.js
const Resource = require('../models/Resource');  // Import Resource model

// Upload a new resource (teacher provides it)
exports.uploadResource = async (req, res) => {
  const { classCode, uploadedBy, resourceType } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Construct file URL path
    const resourceFile = `http://localhost:5000/uploads/${req.file.filename}`;

    const newResource = new Resource({
      classCode,
      uploadedBy,
      resourceFile,
      resourceType,
    });

    await newResource.save();
    res.status(201).json({ message: 'Resource uploaded successfully!', resource: newResource });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ message: 'Failed to upload resource' });
  }
};

// Get all resources for a specific classroom
exports.getResourcesByClassCode = async (req, res) => {
  const { classCode } = req.params;

  try {
    const resources = await Resource.find({ classCode });
    res.status(200).json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

// Request a resource (student requests a resource)
exports.requestResource = async (req, res) => {
  const { resourceId, studentId } = req.body;

  try {
    const resource = await Resource.findById(resourceId);
    resource.studentsRequested.push(studentId);
    await resource.save();
    res.status(200).json({ message: 'Resource requested successfully!' });
  } catch (error) {
    console.error('Error requesting resource:', error);
    res.status(500).json({ message: 'Failed to request resource' });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  const { resourceId } = req.params;

  try {
    const resource = await Resource.findByIdAndDelete(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(200).json({ message: 'Resource deleted successfully!' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Failed to delete resource' });
  }
};

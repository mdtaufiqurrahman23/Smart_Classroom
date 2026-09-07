// backend/controllers/resourceController.js
const Resource = require('../models/Resource');
const path = require('path');
const fs = require('fs');

// Upload a new resource (stored locally on disk)
exports.uploadResource = async (req, res) => {
  const { classCode, uploadedBy, resourceType } = req.body;

  try {
    if (!req.file) {
      console.warn('⚠️ No file received in uploadResource');
      return res.status(400).json({ message: 'No file uploaded. Please choose a file.' });
    }

    if (!classCode) {
      return res.status(400).json({ message: 'classCode is required.' });
    }

    // Local static URL pointing to the uploaded file on the local backend server
    const resourceFile = `http://localhost:5000/uploads/${req.file.filename}`;

    const newResource = new Resource({
      classCode,
      uploadedBy: uploadedBy || req.user?.name || 'Instructor',
      uploadedById: req.user?._id ? req.user._id.toString() : null,
      resourceFile,
      resourceType: resourceType || 'PDF',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      providedAt: new Date(),
    });

    await newResource.save();
    console.log(`✅ File uploaded locally: ${req.file.filename} (${req.file.size} bytes) for class ${classCode}`);
    res.status(201).json({ message: 'Resource uploaded successfully!', resource: newResource });
  } catch (error) {
    console.error('❌ Error uploading resource:', error);
    res.status(500).json({ message: 'Failed to upload resource', error: error.message });
  }
};

// Get all resources for a specific classroom
exports.getResourcesByClassCode = async (req, res) => {
  const { classCode } = req.params;

  try {
    const resources = await Resource.find({ classCode }).sort({ providedAt: -1 });
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
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    if (!resource.studentsRequested.includes(studentId)) {
      resource.studentsRequested.push(studentId);
      await resource.save();
    }
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

    // Attempt to remove local file from disk
    if (resource.resourceFile) {
      try {
        const filename = resource.resourceFile.split('/').pop();
        const localPath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`🗑️ Removed local file: ${localPath}`);
        }
      } catch (fileErr) {
        console.warn('Could not remove file from disk:', fileErr.message);
      }
    }

    res.status(200).json({ message: 'Resource deleted successfully!' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Failed to delete resource' });
  }
};

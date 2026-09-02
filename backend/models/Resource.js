// backend/models/Resource.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  classCode: { type: String, required: true },  // Classroom the resource is for
  uploadedBy: { type: String, required: true },  // Person who uploaded the resource (student or teacher)
  uploadedById: { type: String },  // ID of the person who uploaded (for tracking)
  resourceFile: { type: String, required: true },  // URL or path to the uploaded resource (e.g., PDF, DOC)
  resourceType: { type: String, required: true },  // Type of resource (e.g., "Notes", "PDF", etc.)
  studentsRequested: [{ type: String }],  // Students who requested this resource
  points: { type: Number, default: 0 },  // Points awarded for this resource
  providedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resource', resourceSchema);

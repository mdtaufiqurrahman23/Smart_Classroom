// frontend/src/components/TeacherDashboard/Announcement/CreateAssignment.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CreateAssignment({ classCode, onAssignmentCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentPDF, setAssignmentPDF] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('CreateAssignment component mounted with classCode:', classCode);
  }, [classCode]);

  const handleFileChange = (e) => {
    setAssignmentPDF(e.target.files[0]);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !dueDate || !assignmentPDF) {
      alert('Please fill in all fields and upload an assignment file');
      return;
    }

    try {
      setLoading(true);
      
      const payloadData = {
        classCode: classCode,
        teacherId: 'teacher123',
        title: title,
        description: description,
        dueDate: dueDate,
        assignmentFileName: assignmentPDF.name
      };

      console.log('Creating assignment with data:', payloadData);
      
      // Send as JSON instead of FormData
      const response = await axios.post('http://localhost:5000/api/assignments/create', payloadData, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Assignment created successfully:', response.data);
      alert('Assignment created successfully!');
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignmentPDF(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Wait a moment then refresh
      setTimeout(() => {
        if (onAssignmentCreated) {
          console.log('Calling onAssignmentCreated callback');
          onAssignmentCreated();
        }
      }, 500);
    } catch (error) {
      console.error('Error creating assignment:', error);
      console.error('Error response:', error.response?.data);
      alert('Error creating assignment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Assignment</h2>
      <form onSubmit={handleCreateAssignment} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Assignment description"
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Due Date:</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Upload Assignment (PDF):</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {assignmentPDF && (
            <p className="text-sm text-green-600 mt-2">✓ File selected: {assignmentPDF.name}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Assignment'}
        </button>
      </form>
    </div>
  );
}

export default CreateAssignment;

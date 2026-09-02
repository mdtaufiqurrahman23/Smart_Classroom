// frontend/src/components/StudentDashboard/AssignmentSubmit.js
import React, { useState } from 'react';
import axios from 'axios';

function AssignmentSubmit() {
  const [assignmentId, setAssignmentId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [submissionPDF, setSubmissionPDF] = useState(null);

  const handleFileChange = (e) => {
    setSubmissionPDF(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('studentId', studentId);
    formData.append('studentName', studentName);
    formData.append('submissionPDF', submissionPDF);

    try {
      await axios.post('/api/assignments/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Assignment submitted successfully!');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment');
    }
  };

  return (
    <div>
      <h2>Submit Assignment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Assignment ID:</label>
          <input
            type="text"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Student ID:</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Student Name:</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Submission PDF:</label>
          <input
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit">Submit Assignment</button>
      </form>
    </div>
  );
}

export default AssignmentSubmit;

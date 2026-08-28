// frontend/src/components/TeacherDashboard/AssignmentUpload.js
import React, { useState } from 'react';
import axios from 'axios';

function AssignmentUpload() {
  const [classCode, setClassCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentPDF, setAssignmentPDF] = useState(null);

  const handleFileChange = (e) => {
    setAssignmentPDF(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('classCode', classCode);
    formData.append('assignmentPDF', assignmentPDF);
    formData.append('dueDate', dueDate);

    try {
      await axios.post('/api/assignments/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Assignment uploaded successfully!');
    } catch (error) {
      console.error('Error uploading assignment:', error);
      alert('Error uploading assignment');
    }
  };

  return (
    <div>
      <h2>Upload Assignment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Class Code:</label>
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Due Date:</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Assignment PDF:</label>
          <input
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit">Upload Assignment</button>
      </form>
    </div>
  );
}

export default AssignmentUpload;

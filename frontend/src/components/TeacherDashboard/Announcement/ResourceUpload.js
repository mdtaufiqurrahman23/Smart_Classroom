// frontend/src/components/TeacherDashboard/ResourceUpload.js
import React, { useState } from 'react';
import axios from 'axios';

function ResourceUpload() {
  const [classCode, setClassCode] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceFile, setResourceFile] = useState(null);

  const handleFileChange = (e) => {
    setResourceFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('classCode', classCode);
    formData.append('resourceType', resourceType);
    formData.append('resourceFile', resourceFile);

    try {
      await axios.post('/api/resources/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Resource uploaded successfully!');

      const students = ['studentId1', 'studentId2'];  // Replace with actual student IDs who requested the resource
      students.forEach(async (studentId) => {
        await axios.post('/api/leaderboard/add-points', { studentId, studentName: 'Student Name' });
      });



    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Error uploading resource');
    }
  };

  return (
    <div>
      <h2>Upload Resource</h2>
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
          <label>Resource Type:</label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            required
          >
            <option value="Notes">Notes</option>
            <option value="PDF">PDF</option>
            <option value="Presentation">Presentation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label>Upload Resource:</label>
          <input
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit">Upload Resource</button>
      </form>
    </div>
  );
}

export default ResourceUpload;

// frontend/src/components/StudentDashboard/RequestResource.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RequestResource() {
  const [classCode, setClassCode] = useState('');
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');

  useEffect(() => {
    // Fetch available resources for the class
    const fetchResources = async () => {
      try {
        const response = await axios.get(`/api/resources/${classCode}`);
        setResources(response.data);
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };

    if (classCode) fetchResources();
  }, [classCode]);

  const handleRequestResource = async () => {
    try {
      await axios.post('/api/resources/request', { resourceId: selectedResource, studentId: 'student-id' });
      alert('Resource requested successfully!');
    } catch (error) {
      console.error('Error requesting resource:', error);
      alert('Error requesting resource');
    }
  };

  return (
    <div>
      <h2>Request Resource</h2>
      <input
        type="text"
        value={classCode}
        onChange={(e) => setClassCode(e.target.value)}
        placeholder="Enter class code"
      />
      <div>
        <label>Available Resources:</label>
        <select onChange={(e) => setSelectedResource(e.target.value)} required>
          <option value="">Select Resource</option>
          {resources.map((resource) => (
            <option key={resource._id} value={resource._id}>
              {resource.resourceType} - {resource.resourceFile}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleRequestResource}>Request Resource</button>
    </div>
  );
}

export default RequestResource;

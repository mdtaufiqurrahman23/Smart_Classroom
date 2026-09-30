// frontend/src/RequestResource.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function RequestResource({ classCode }) {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [requesting, setRequesting] = useState(false);

  const fetchResources = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/resources/${classCode}`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  }, [classCode]);

  useEffect(() => {
    if (classCode) fetchResources();
  }, [classCode, fetchResources]);

  const handleRequestResource = async () => {
    if (!selectedResource) {
      alert('Please select a resource first');
      return;
    }

    try {
      setRequesting(true);
      const token = localStorage.getItem('token');
      const userData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const studentId = userData?.name || userData?.email || 'Unknown student';

      await axios.post('http://localhost:5000/api/resources/request', {
        resourceId: selectedResource,
        studentId,
      });
      alert('Resource requested successfully!');
      setSelectedResource('');
    } catch (error) {
      console.error('Error requesting resource:', error);
      alert('Error requesting resource');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="glass-card-sm">
      <h3 className="text-xl font-bold text-white mb-4">🙋 Request a Resource</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-white font-semibold mb-2">Available Resources:</label>
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          >
            <option value="">Select a resource</option>
            {resources.map((resource) => (
              <option key={resource._id} value={resource._id}>
                {resource.resourceType} - {resource.fileName || resource.resourceFile}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRequestResource}
          disabled={requesting || !selectedResource}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
        >
          {requesting ? 'Requesting...' : '🙋 Request Resource'}
        </button>
      </div>
    </div>
  );
}

export default RequestResource;

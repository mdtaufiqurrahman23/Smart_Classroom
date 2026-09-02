import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudentProvideResource({ classCode }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingId, setRequestingId] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [classCode]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/resources/${classCode}`);
      setResources(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResource = async (resourceId) => {
    try {
      setRequestingId(resourceId);
      await axios.post('http://localhost:5000/api/resources/request', {
        resourceId,
        studentId: 'student123' // TODO: Get from user context
      });
      alert('Resource requested successfully!');
      await fetchResources();
    } catch (error) {
      console.error('Error requesting resource:', error);
      alert('Error requesting resource');
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) return <p className="text-gray-600">Loading resources...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Resources</h2>
        
        {resources.length === 0 ? (
          <p className="text-gray-600">No resources available yet. Check back later!</p>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource._id} className="border-l-4 border-blue-600 p-4 rounded-lg shadow-sm bg-blue-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {resource.resourceType}
                      </span>
                      <span className="text-xs text-gray-600">
                        From: {resource.uploadedBy}
                      </span>
                    </div>
                    <p className="text-gray-700 font-semibold mb-2">{resource.resourceFile}</p>
                    <p className="text-xs text-gray-600">
                      Provided: {new Date(resource.providedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRequestResource(resource._id)}
                    disabled={requestingId === resource._id}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    {requestingId === resource._id ? '⏳ Requesting...' : '📤 Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProvideResource;

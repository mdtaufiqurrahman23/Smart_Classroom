import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ViewStudentResources({ classCode }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [classCode]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      console.log('Fetching resources for classCode:', classCode);
      const response = await axios.get(`http://localhost:5000/api/resources/${classCode}`);
      console.log('Resources fetched:', response.data);
      setResources(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-gray-600">Loading resources...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Class Resources</h2>
        
        {resources.length === 0 ? (
          <p className="text-gray-600">No resources available yet.</p>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource._id} className="border-l-4 border-purple-600 p-4 rounded-lg shadow-sm bg-white border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {resource.resourceType}
                      </span>
                      <span className="text-xs text-gray-500">
                        Uploaded by: {resource.uploadedBy}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{resource.resourceFile}</p>
                    <p className="text-xs text-gray-400">
                      Provided: {new Date(resource.providedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={resource.resourceFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold text-sm whitespace-nowrap"
                  >
                    📥 Download
                  </a>
                </div>
                
                {resource.studentsRequested && resource.studentsRequested.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>{resource.studentsRequested.length}</strong> student(s) requested this resource
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewStudentResources;

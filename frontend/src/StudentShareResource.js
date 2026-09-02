import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudentShareResource({ classCode, onResourceShared }) {
  const [resourceType, setResourceType] = useState('Notes');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [myResources, setMyResources] = useState([]);
  const [fetchingResources, setFetchingResources] = useState(false);

  useEffect(() => {
    fetchMyResources();
  }, [classCode]);

  const fetchMyResources = async () => {
    try {
      setFetchingResources(true);
      const token = localStorage.getItem('token');
      const userData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const userName = userData?.name || userData?.email || 'Anonymous';

      const response = await axios.get(`http://localhost:5000/api/resources/${classCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Filter resources uploaded by current user
      const userResources = response.data.filter(resource => resource.uploadedBy === userName);
      setMyResources(userResources);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setFetchingResources(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        setPdfFile(null);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        setPdfFile(null);
        return;
      }
      
      setError(null);
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pdfFile) {
      setError('Please select a PDF file');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const userData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const userName = userData?.name || userData?.email || 'Anonymous';

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('classCode', classCode);
      formData.append('uploadedBy', userName);
      formData.append('resourceType', resourceType);
      formData.append('file', pdfFile);

      await axios.post('http://localhost:5000/api/resources/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('PDF shared successfully!');
      setPdfFile(null);
      setResourceType('Notes');
      fetchMyResources();
      
      if (onResourceShared) {
        onResourceShared();
      }
    } catch (err) {
      console.error('Error sharing PDF:', err);
      setError(err.response?.data?.message || 'Failed to share PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      alert('PDF deleted successfully!');
      fetchMyResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert('Failed to delete PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-white font-semibold mb-2">Resource Type:</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option>Notes</option>
              <option>Book</option>
              <option>Video</option>
              <option>Link</option>
              <option>PDF</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Upload PDF File:</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
            {pdfFile && (
              <p className="text-sm text-green-400 mt-2">
                ✓ Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-sm text-gray-400 mt-1">Maximum file size: 10MB</p>
          </div>

          <button
            type="submit"
            disabled={loading || !pdfFile}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? '📤 Sharing...' : '📤 Share PDF'}
          </button>
        </form>
      </div>

      <div className="glass-card-sm">
        <h3 className="text-xl font-bold text-white mb-4">My Shared PDFs</h3>
        
        {fetchingResources ? (
          <p className="text-gray-300">Loading your PDFs...</p>
        ) : myResources.length === 0 ? (
          <p className="text-gray-400">You haven't shared any PDFs yet.</p>
        ) : (
          <div className="space-y-3">
            {myResources.map((resource) => (
              <div
                key={resource._id}
                className="bg-white/10 border border-white/20 rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="text-white font-semibold">📄 {resource.resourceFile}</p>
                  <p className="text-sm text-gray-300">Type: {resource.resourceType}</p>
                  <p className="text-xs text-gray-400">
                    Shared: {new Date(resource.providedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={resource.resourceFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-sm transition-colors"
                  >
                    👁️ Preview
                  </a>
                  <button
                    onClick={() => handleDeleteResource(resource._id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold text-sm transition-colors"
                  >
                    🗑️ Delete
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

export default StudentShareResource;

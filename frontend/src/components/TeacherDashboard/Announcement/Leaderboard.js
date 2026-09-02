// frontend/src/components/TeacherDashboard/Announcement/Leaderboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Leaderboard({ classCode, userRole }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [points, setPoints] = useState('');
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    fetchResources();
  }, [classCode]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/leaderboard');
      setLeaderboard(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/resources/${classCode}`);
      setResources(response.data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!selectedResource || !points) {
      alert('Please select a resource and enter points');
      return;
    }

    try {
      setAwarding(true);
      const resource = resources.find(r => r._id === selectedResource);
      
      await axios.post('http://localhost:5000/api/leaderboard/award-points', {
        resourceId: selectedResource,
        studentId: resource.uploadedById || 'student-' + Date.now(),
        studentName: resource.uploadedBy,
        points: parseInt(points)
      });

      alert('Points awarded successfully!');
      setSelectedResource(null);
      setPoints('');
      await fetchLeaderboard();
      await fetchResources();
    } catch (error) {
      console.error('Error awarding points:', error);
      alert('Error awarding points: ' + (error.response?.data?.message || error.message));
    } finally {
      setAwarding(false);
    }
  };

  if (loading) return <p className="text-gray-600">Loading leaderboard...</p>;

  return (
    <div className="space-y-6">
      {/* Award Points Form */}
      {userRole === 'teacher' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Award Points for Resources</h2>
          <form onSubmit={handleAwardPoints} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Student Resource:</label>
              <select
                value={selectedResource || ''}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a student resource</option>
                {resources.map((resource) => (
                  <option key={resource._id} value={resource._id}>
                    {resource.uploadedBy} - {resource.resourceType} (Current: {resource.points || 0} pts)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Points to Award:</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Enter number of points"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={awarding}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
            >
              {awarding ? 'Awarding...' : '🏆 Award Points'}
            </button>
          </form>
        </div>
      )}

      {/* Leaderboard Display */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Leaderboard 🏆</h2>
        
        {leaderboard.length === 0 ? (
          <p className="text-gray-600">No students on leaderboard yet.</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry._id}
                className={`p-4 rounded-lg flex justify-between items-center ${
                  index === 0
                    ? 'bg-yellow-100 border-2 border-yellow-400'
                    : index === 1
                    ? 'bg-gray-100 border-2 border-gray-400'
                    : index === 2
                    ? 'bg-orange-100 border-2 border-orange-400'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                        ? 'bg-gray-500'
                        : index === 2
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{entry.studentName}</p>
                    <p className="text-sm text-gray-600">ID: {entry.studentId}</p>
                  </div>
                </div>
                <div
                  className={`text-2xl font-bold ${
                    index === 0
                      ? 'text-yellow-600'
                      : index === 1
                      ? 'text-gray-600'
                      : index === 2
                      ? 'text-orange-600'
                      : 'text-blue-600'
                  }`}
                >
                  {entry.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;

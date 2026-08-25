// frontend/src/components/TeacherDashboard/Announcement/ViewAnnouncements.js
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const ViewAnnouncements = forwardRef(({ classCode, onAnnouncementDeleted, userRole }, ref) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/announcements/${classCode}`);
      setAnnouncements(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [classCode]);

  // Expose the fetchAnnouncements method to parent components
  useImperativeHandle(ref, () => ({
    refreshAnnouncements: fetchAnnouncements
  }));

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`http://localhost:5000/api/announcements/${announcementId}`);
        setAnnouncements(announcements.filter(ann => ann._id !== announcementId));
        if (onAnnouncementDeleted) {
          onAnnouncementDeleted();
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Error deleting announcement: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading announcements...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (announcements.length === 0) {
    return <p className="text-gray-600">No announcements yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Announcements</h3>
      {announcements.map((announcement) => (
        <div key={announcement._id} className="bg-white border-l-4 border-blue-600 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-800 mb-2">{announcement.title}</h4>
              <p className="text-gray-700 mb-3">{announcement.message}</p>
              <p className="text-sm text-gray-500">
                {new Date(announcement.date).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleDeleteAnnouncement(announcement._id)}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              style={{ display: userRole === 'teacher' ? 'block' : 'none' }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

ViewAnnouncements.displayName = 'ViewAnnouncements';

export default ViewAnnouncements;

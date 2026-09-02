// frontend/src/components/Classroom/ViewFeedback.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ViewFeedback = ({ classCode, userRole = 'teacher' }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, [classCode]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching feedback for classCode:', classCode);
      const response = await axios.get(
        `http://localhost:5000/api/feedback/${classCode}`
      );
      console.log('✅ Feedback fetched:', response.data);
      setFeedbacks(response.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching feedback:', err);
      setError(err.response?.data?.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }
    try {
      await axios.delete(
        `http://localhost:5000/api/feedback/${feedbackId}`
      );
      setFeedbacks(feedbacks.filter(f => f._id !== feedbackId));
      console.log('✅ Feedback deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-secondary">⏳ Loading feedback...</p></div>;
  }

  if (error) {
    return <div className="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="w-full">
      {feedbacks.length === 0 ? (
        <div className="bg-yellow-50 border-2 border-yellow-300 text-yellow-800 p-8 rounded-lg text-center">
          <p className="text-lg font-semibold">📭 No feedback yet</p>
          {userRole === 'student' && (
            <p className="text-sm mt-2">Be the first to share your thoughts!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div
              key={feedback._id}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-6 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium">
                    📅 {new Date(feedback.feedbackDate).toLocaleString()}
                  </p>
                </div>
                {userRole === 'teacher' && (
                  <button
                    onClick={() => deleteFeedback(feedback._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
              <p className="text-gray-800 text-base leading-relaxed">{feedback.feedbackMessage}</p>
              {userRole === 'student' && (
                <p className="text-xs text-gray-600 mt-3 italic">🔒 This feedback is anonymous</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewFeedback;

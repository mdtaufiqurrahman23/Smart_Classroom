// frontend/src/components/StudentDashboard/SubmitFeedback.js
import React, { useState } from 'react';
import axios from 'axios';

function SubmitFeedback({ classCode }) {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) {
      setMessage('❌ Please enter your feedback');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Submitting feedback:', { classCode, feedbackMessage });
      
      await axios.post('http://localhost:5000/api/feedback/submit', { 
        classCode, 
        feedbackMessage 
      });

      setMessage('✅ Feedback submitted successfully!');
      setMessageType('success');
      setFeedbackMessage('');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      const errorMsg = error.response?.data?.message || 'Error submitting feedback';
      setMessage(`❌ ${errorMsg}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Your Anonymous Feedback
            </label>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Share your thoughts, suggestions, or concerns anonymously... (Your identity will be hidden)"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-vertical min-h-32"
            />
            <p className="text-xs text-gray-600 mt-2">💡 This feedback is anonymous and only visible to your teacher</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Submitting...' : '📤 Submit Feedback'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-center font-bold ${
              messageType === 'success'
                ? 'bg-green-100 border-2 border-green-500 text-green-800'
                : 'bg-red-100 border-2 border-red-500 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default SubmitFeedback;

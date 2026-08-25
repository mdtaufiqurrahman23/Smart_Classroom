// frontend/src/components/TeacherDashboard/SendTextMessage.js
import React, { useState } from 'react';
import axios from 'axios';

function SendTextMessage({ classCode, teacherId, onMessageSent, userRole }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (message.trim() === '') {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const senderName = userData?.name || userData?.email || 'Anonymous';

      await axios.post('http://localhost:5000/api/text-messages/send', { 
        classCode, 
        message: message.trim(),
        senderName,
        senderRole: userRole || 'teacher'
      });
      alert('Message sent successfully!');
      setMessage('');  // Reset message after sending
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">💬 Send Message to Class</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            placeholder="Type your message here..."
            rows={4}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : '💬 Send Message'}
        </button>
      </form>
    </div>
  );
}

export default SendTextMessage;

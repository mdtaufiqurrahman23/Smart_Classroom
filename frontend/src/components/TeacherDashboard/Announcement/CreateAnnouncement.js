// frontend/src/components/TeacherDashboard/Announcement/CreateAnnouncement.js
import React, { useState } from 'react';
import axios from 'axios';

function CreateAnnouncement({ classCode, onAnnouncementCreated }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      // Send the data to create an announcement
      const response = await axios.post('http://localhost:5000/api/announcements/create', { classCode, title, message });
      alert('Announcement created successfully!');
      setTitle('');
      setMessage('');
      // Call the callback to refresh announcements
      if (onAnnouncementCreated) {
        onAnnouncementCreated();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Error creating announcement: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2>Create Announcement</h2>
      <form onSubmit={handleCreateAnnouncement}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Announcement</button>
      </form>
    </div>
  );
}

export default CreateAnnouncement;

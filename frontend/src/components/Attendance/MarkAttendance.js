// frontend/src/components/TeacherDashboard/Attendance/MarkAttendance.js
import React, { useState } from 'react';
import axios from 'axios';

function MarkAttendance() {
  const [classCode, setClassCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Present'); // Default to Present

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/attendance/mark', { classCode, studentId, name, status });
      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance');
    }
  };

  return (
    <div>
      <h2>Mark Attendance</h2>
      <form onSubmit={handleMarkAttendance}>
        <div>
          <label>Class Code:</label>
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Student ID:</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
        <button type="submit">Mark Attendance</button>
      </form>
    </div>
  );
}

export default MarkAttendance;

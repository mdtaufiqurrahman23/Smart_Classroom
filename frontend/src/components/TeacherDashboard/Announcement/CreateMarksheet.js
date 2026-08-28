// frontend/src/components/TeacherDashboard/CreateMarksheet.js
import React, { useState } from 'react';
import axios from 'axios';

function CreateMarksheet({ classCode, onMarksheetCreated }) {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [quizMarks, setQuizMarks] = useState('');
  const [labMarks, setLabMarks] = useState('');
  const [assignmentMarks, setAssignmentMarks] = useState('');
  const [midtermMarks, setMidtermMarks] = useState('');
  const [finalMarks, setFinalMarks] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/marksheets/create', {
        studentId,
        studentName,
        quizMarks: Number(quizMarks),
        labMarks: Number(labMarks),
        assignmentMarks: Number(assignmentMarks),
        midtermMarks: Number(midtermMarks),
        finalMarks: Number(finalMarks),
        classCode,
      });
      alert('Marksheet created successfully!');
      setStudentId('');
      setStudentName('');
      setQuizMarks('');
      setLabMarks('');
      setAssignmentMarks('');
      setMidtermMarks('');
      setFinalMarks('');
      // Call the callback to refresh marksheets
      if (onMarksheetCreated) {
        onMarksheetCreated();
      }
    } catch (error) {
      console.error('Error creating marksheet:', error);
      alert('Error creating marksheet: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2>Create Marksheet</h2>
      <form onSubmit={handleSubmit}>
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
          <label>Student Name:</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Quiz Marks (out of 15):</label>
          <input
            type="number"
            value={quizMarks}
            onChange={(e) => setQuizMarks(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Lab Marks (out of 25):</label>
          <input
            type="number"
            value={labMarks}
            onChange={(e) => setLabMarks(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Assignment Marks (out of 10):</label>
          <input
            type="number"
            value={assignmentMarks}
            onChange={(e) => setAssignmentMarks(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Midterm Marks (out of 20):</label>
          <input
            type="number"
            value={midtermMarks}
            onChange={(e) => setMidtermMarks(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Final Marks (out of 30):</label>
          <input
            type="number"
            value={finalMarks}
            onChange={(e) => setFinalMarks(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Marksheet</button>
      </form>
    </div>
  );
}

export default CreateMarksheet;

// frontend/src/components/TeacherDashboard/CreatePoll.js
import React, { useState } from 'react';
import axios from 'axios';

function CreatePoll({ classCode, onPollCreated }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);  // 4 options initially

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all options are filled
    if (options.some(option => option.trim() === '')) {
      alert('Please fill in all poll options');
      return;
    }

    if (question.trim() === '') {
      alert('Please enter a poll question');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/polls/create', { 
        classCode, 
        question, 
        options: options.map(opt => opt.trim()) 
      });
      alert('Poll created successfully!');
      setQuestion('');
      setOptions(['', '', '', '']);
      if (onPollCreated) {
        onPollCreated();
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Create Poll</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Poll Question:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Enter your poll question"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Poll Options:</label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder={`Option ${index + 1}`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
        <button 
          type="submit" 
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          📊 Create Poll
        </button>
      </form>
    </div>
  );
}

export default CreatePoll;

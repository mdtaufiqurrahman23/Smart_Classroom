// frontend/src/components/TeacherDashboard/LessonPlanCalendar.js
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';

function LessonPlanCalendar({ classCode }) {
  const [date, setDate] = useState(new Date());
  const [lessonPlans, setLessonPlans] = useState([]);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);  // For editing lessons

  const fetchLessonPlans = async (currentDate = date) => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);  // Start of the month
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);  // End of the month

    try {
      const response = await axios.get(`http://localhost:5000/api/lesson-plans/${classCode}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      setLessonPlans(response.data);
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
    }
  };

  useEffect(() => {
    fetchLessonPlans();
  }, [classCode, date]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setSelectedLesson(null);  // Reset lesson when changing the date
  };

  const handleAddLesson = async () => {
    if (!topic || !notes) {
      alert('Please fill in both topic and notes');
      return;
    }

    const lessonDate = new Date(date);
    try {
      const response = await axios.post('http://localhost:5000/api/lesson-plans/create', { 
        classCode, 
        date: lessonDate, 
        topic, 
        notes 
      });
      alert('Lesson plan added successfully!');
      setTopic('');
      setNotes('');
      setSelectedLesson(null);  // Reset the form after adding
      // Refresh the lesson plans list
      await fetchLessonPlans();
    } catch (error) {
      console.error('Error adding lesson plan:', error);
      alert('Error adding lesson plan: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson plan?')) {
      try {
        await axios.post('http://localhost:5000/api/lesson-plans/delete', { lessonPlanId: lessonId });
        alert('Lesson plan deleted successfully!');
        setLessonPlans(lessonPlans.filter((lesson) => lesson._id !== lessonId));
      } catch (error) {
        console.error('Error deleting lesson plan:', error);
        alert('Error deleting lesson plan: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEditLesson = async () => {
    if (!selectedLesson) return;  // Ensure a lesson is selected to edit
    if (!topic || !notes) {
      alert('Please fill in both topic and notes');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/lesson-plans/update', { 
        lessonPlanId: selectedLesson._id, 
        topic, 
        notes 
      });
      alert('Lesson plan updated successfully!');
      setLessonPlans(lessonPlans.map((lesson) =>
        lesson._id === selectedLesson._id ? { ...lesson, topic, notes } : lesson
      ));
      setSelectedLesson(null);  // Reset after editing
      setTopic('');
      setNotes('');
    } catch (error) {
      console.error('Error editing lesson plan:', error);
      alert('Error editing lesson plan: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);  // Set the selected lesson to edit
    setTopic(lesson.topic);  // Pre-fill form with current data
    setNotes(lesson.notes);
  };

  // Filter lessons for the selected date
  const lessonsForSelectedDate = lessonPlans.filter((lesson) => {
    const lessonDate = new Date(lesson.date);
    return lessonDate.toDateString() === date.toDateString();
  });

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Lesson Plan Calendar</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <Calendar onChange={handleDateChange} value={date} />
        </div>

        {/* Form Section */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            {selectedLesson ? (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-gray-800">Edit Lesson Plan</h3>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Topic:</label>
                  <input
                    type="text"
                    placeholder="Enter topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Notes:</label>
                  <textarea
                    placeholder="Enter notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleEditLesson}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Update Lesson
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedLesson(null);
                      setTopic('');
                      setNotes('');
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                  >
                    Cancel Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-gray-800">Add Lesson Plan</h3>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Topic:</label>
                  <input
                    type="text"
                    placeholder="Enter topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Notes:</label>
                  <textarea
                    placeholder="Enter notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-gray-600 text-sm">Selected Date: <strong>{date.toDateString()}</strong></p>
                <button 
                  onClick={handleAddLesson}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Add Lesson
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Display Lessons */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Lesson Plans for {date.toDateString()}</h3>
        {lessonsForSelectedDate.length === 0 ? (
          <p className="text-gray-600">No lesson plans for this date.</p>
        ) : (
          <div className="space-y-4">
            {lessonsForSelectedDate.map((lesson) => (
              <div 
                key={lesson._id} 
                className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded hover:bg-blue-100 cursor-pointer transition"
                onClick={() => handleSelectLesson(lesson)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-800">{lesson.topic}</p>
                    <p className="text-gray-700 mt-2">{lesson.notes}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLesson(lesson._id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Delete
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

export default LessonPlanCalendar;

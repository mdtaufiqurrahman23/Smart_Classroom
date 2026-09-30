// src/App.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import StudentLogin from './components/StudentLogin';
import TeacherLogin from './components/TeacherLogin';
import Signup from './components/Signup';
import ClassroomPage from './components/Classroom/ClassroomPage';
import TeacherDashboard from './components/TeacherDashboard';
import CreateClassroom from './components/Classroom/CreateClassroom';
import StudentDashboard from './components/StudentDashboard';
import LeaveRequestForm from './components/LeaveRequestForm';
import CreateQuiz from './components/CreateQuiz';
import ResourceUpload from './components/ResourceUpload';
import EditProfile from './components/EditProfile';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
// ADD YOUR PAGE IMPORT ABOVE THIS LINE (see your README's "Turn it on" section)

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <Router>
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label="Toggle dark and light mode"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/classroom/:classCode" element={<ClassroomPage />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/create-classroom" element={<CreateClassroom />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/leave-request" element={<LeaveRequestForm />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/resource-upload" element={<ResourceUpload />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        {/* ADD YOUR PAGE ROUTE ABOVE THIS LINE (see your README's "Turn it on" section) */}
      </Routes>
    </Router>
  );
}

export default App;

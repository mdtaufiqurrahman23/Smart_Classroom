// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import StudentLogin from './components/StudentLogin';
import TeacherLogin from './components/TeacherLogin';
import Signup from './components/Signup';
import ClassroomPage from './components/Classroom/ClassroomPage';
// ADD YOUR PAGE IMPORT ABOVE THIS LINE (see your README's "Turn it on" section)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/classroom/:classCode" element={<ClassroomPage />} />
        {/* ADD YOUR PAGE ROUTE ABOVE THIS LINE (see your README's "Turn it on" section) */}
      </Routes>
    </Router>
  );
}

export default App;

// frontend/src/components/LessonPlanCalendar.js
import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';

function LessonPlanCalendar({ classCode, userRole }) {
  const [date, setDate] = useState(new Date());
  const [lessonPlans, setLessonPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Teacher form state
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null); // For editing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Search & View mode
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'timeline'
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  // Determine user role
  const effectiveRole = useMemo(() => {
    if (userRole) return userRole;
    const storedRole = localStorage.getItem('role');
    if (storedRole) return storedRole;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.role || 'student';
      } catch (e) {}
    }
    return 'student';
  }, [userRole]);

  const isTeacher = effectiveRole === 'teacher';

  const fetchLessonPlans = async (currentDate = date) => {
    try {
      setLoading(true);
      // Fetch a generous 6-month window around the active year/month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 4, 0);

      const response = await axios.get(
        `http://localhost:5000/api/lesson-plans/${classCode}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      setLessonPlans(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching lesson plans:', err);
      setError('Failed to fetch lesson plans. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonPlans(date);
  }, [classCode]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setSelectedLesson(null);
    setShowForm(false);
  };

  const handleAddLesson = async (e) => {
    e?.preventDefault();
    if (!topic.trim() || !notes.trim()) {
      showToast('Please provide both a lecture topic and descriptive notes.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const lessonDate = new Date(date);
      lessonDate.setHours(10, 0, 0, 0);

      await axios.post('http://localhost:5000/api/lesson-plans/create', {
        classCode,
        date: lessonDate,
        topic: topic.trim(),
        notes: notes.trim()
      });

      showToast('🎉 Lesson plan added successfully!', 'success');
      setTopic('');
      setNotes('');
      setShowForm(false);
      await fetchLessonPlans(date);
    } catch (err) {
      console.error('Error adding lesson plan:', err);
      showToast('Error adding lesson plan: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLesson = async (e) => {
    e?.preventDefault();
    if (!selectedLesson) return;
    if (!topic.trim() || !notes.trim()) {
      showToast('Please provide both topic and notes.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post('http://localhost:5000/api/lesson-plans/update', {
        lessonPlanId: selectedLesson._id,
        topic: topic.trim(),
        notes: notes.trim()
      });

      showToast('✅ Lesson plan updated successfully!', 'success');
      setLessonPlans(prev =>
        prev.map(l => (l._id === selectedLesson._id ? { ...l, topic: topic.trim(), notes: notes.trim() } : l))
      );
      setSelectedLesson(null);
      setTopic('');
      setNotes('');
      setShowForm(false);
    } catch (err) {
      console.error('Error updating lesson plan:', err);
      showToast('Error updating lesson plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to permanently delete this lesson plan?')) {
      try {
        await axios.post('http://localhost:5000/api/lesson-plans/delete', { lessonPlanId: lessonId });
        showToast('Lesson plan deleted.', 'info');
        setLessonPlans(prev => prev.filter(l => l._id !== lessonId));
        if (selectedLesson?._id === lessonId) {
          setSelectedLesson(null);
          setShowForm(false);
        }
      } catch (err) {
        console.error('Error deleting lesson plan:', err);
        showToast('Error deleting lesson plan', 'error');
      }
    }
  };

  const startEditing = (lesson) => {
    setSelectedLesson(lesson);
    setTopic(lesson.topic);
    setNotes(lesson.notes);
    setShowForm(true);
  };

  // Map of dates with lesson plans for quick dot indicators
  const datesWithLessons = useMemo(() => {
    const set = new Set();
    lessonPlans.forEach(l => {
      const d = new Date(l.date);
      set.add(d.toDateString());
    });
    return set;
  }, [lessonPlans]);

  // Filter lessons for the selected date
  const lessonsForSelectedDate = useMemo(() => {
    return lessonPlans.filter(lesson => {
      const lessonDate = new Date(lesson.date);
      return lessonDate.toDateString() === date.toDateString();
    });
  }, [lessonPlans, date]);

  // Filter lessons for timeline view
  const filteredTimelineLessons = useMemo(() => {
    let list = [...lessonPlans].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => 
        (l.topic && l.topic.toLowerCase().includes(q)) || 
        (l.notes && l.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [lessonPlans, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const past = lessonPlans.filter(l => new Date(l.date) < today).length;
    const upcoming = lessonPlans.filter(l => new Date(l.date) >= today).length;
    return { total: lessonPlans.length, past, upcoming };
  }, [lessonPlans]);

  // Jump to today
  const handleJumpToToday = () => {
    const now = new Date();
    setDate(now);
    setSelectedLesson(null);
    setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', color: '#f8fafc' }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '14px 20px',
          borderRadius: '12px',
          background: toast.type === 'error' ? 'rgba(136, 19, 55, 0.95)' : toast.type === 'info' ? 'rgba(14, 116, 144, 0.95)' : 'rgba(6, 78, 59, 0.95)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(244, 63, 94, 0.5)' : toast.type === 'info' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
          backdropFilter: 'blur(12px)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <span>{toast.type === 'error' ? '🚫' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
          }}>
            📅
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Course Syllabus & Lesson Calendar
              </h3>
              <span className="att-stat-badge att-badge-excellent">
                {stats.total} Lectures
              </span>
              <span className="att-stat-badge att-badge-good">
                {stats.upcoming} Upcoming
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Classroom: <strong style={{ color: '#e2e8f0' }}>{classCode}</strong> • {isTeacher ? 'Schedule topics, add study guides & organize lecture flow' : 'Preview lecture topics, prerequisites & scheduled curriculum'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                background: viewMode === 'calendar' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📅</span>
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              style={{
                background: viewMode === 'timeline' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📜</span>
              <span>Timeline ({stats.total})</span>
            </button>
          </div>

          {/* Jump to Today button */}
          <button
            onClick={handleJumpToToday}
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              padding: '7px 14px',
              color: '#60a5fa',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🎯</span>
            <span>Today</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CALENDAR VIEW MODE */}
      {/* ========================================================================= */}
      {viewMode === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Calendar Widget Card */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🗓️</span> Select Date
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="calendar-event-dot" style={{ display: 'inline-block' }} />
                <span>Has Lecture</span>
              </span>
            </div>

            {/* Custom Styled Dark Calendar */}
            <Calendar
              onChange={handleDateChange}
              value={date}
              className="custom-dark-calendar"
              tileContent={({ date: tileDate, view }) => {
                if (view === 'month' && datesWithLessons.has(tileDate.toDateString())) {
                  return <div className="calendar-event-dot" />;
                }
                return null;
              }}
            />

            {/* Quick legend footer */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Today
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> Selected
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Scheduled
              </span>
            </div>
          </div>

          {/* Details & Management Panel for Selected Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Selected Date Header Box */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#60a5fa', fontWeight: 700 }}>
                  Selected Date
                </span>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '4px 0 0 0' }}>
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h4>
              </div>

              {isTeacher && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    if (selectedLesson) {
                      setSelectedLesson(null);
                      setTopic('');
                      setNotes('');
                    }
                  }}
                  style={{
                    background: showForm && !selectedLesson ? 'rgba(244, 63, 94, 0.2)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: showForm && !selectedLesson ? '1px solid rgba(244, 63, 94, 0.4)' : 'none',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: showForm && !selectedLesson ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{showForm && !selectedLesson ? '✕ Cancel' : '➕ Plan Lecture for This Date'}</span>
                </button>
              )}
            </div>

            {/* Teacher Create / Edit Form Drawer */}
            {isTeacher && showForm && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{selectedLesson ? '✏️ Edit Lecture Plan' : '📝 New Lecture Plan'}</span>
                  </h4>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setSelectedLesson(null);
                      setTopic('');
                      setNotes('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={selectedLesson ? handleEditLesson : handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Lecture Topic / Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Software Architecture & MVC Pattern"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Lecture Notes, Prerequisites & Homework *
                    </label>
                    <textarea
                      placeholder="Provide syllabus subtopics, readings, exercise guidelines, or required lab tools..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="4"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        lineHeight: 1.5
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedLesson(null);
                        setTopic('');
                        setNotes('');
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#94a3b8',
                        borderRadius: '10px',
                        padding: '9px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '9px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1,
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                      }}
                    >
                      {isSubmitting ? '⏳ Saving...' : selectedLesson ? '💾 Save Changes' : '➕ Save Lesson Plan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Lessons for the Selected Date */}
            {lessonsForSelectedDate.length === 0 ? (
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>🏖️</span>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px 0' }}>
                  No Lecture Scheduled
                </h4>
                <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto' }}>
                  {isTeacher
                    ? 'No lesson plan registered for this date. Click "Plan Lecture for This Date" above to add topics.'
                    : 'There is no class scheduled on this date. Click other highlighted calendar dates to view upcoming lectures.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {lessonsForSelectedDate.map((lesson, idx) => (
                  <div
                    key={lesson._id || idx}
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '16px',
                      padding: '22px 24px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          letterSpacing: '0.04em'
                        }}>
                          LECTURE
                        </span>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                          {lesson.topic}
                        </h4>
                      </div>

                      {/* Teacher action buttons */}
                      {isTeacher && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => startEditing(lesson)}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.35)',
                              color: '#93c5fd',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson._id)}
                            style={{
                              background: 'rgba(244, 63, 94, 0.15)',
                              border: '1px solid rgba(244, 63, 94, 0.35)',
                              color: '#fda4af',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notes Box */}
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      color: '#cbd5e1',
                      fontSize: '14px',
                      lineHeight: 1.6
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                        📋 Notes & Study Directives:
                      </div>
                      <p style={{ margin: 0 }}>{lesson.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TIMELINE / CURRICULUM STREAM MODE */}
      {/* ========================================================================= */}
      {viewMode === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search bar inside timeline */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <input
                type="text"
                placeholder="Search lectures by topic or keywords (e.g. Agile, MVC, Testing)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '9px 14px 9px 36px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Showing <strong>{filteredTimelineLessons.length}</strong> of {lessonPlans.length} syllabus modules
            </span>
          </div>

          {filteredTimelineLessons.length === 0 ? (
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔍</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px 0' }}>
                No Lectures Found
              </h4>
              <p style={{ fontSize: '13px' }}>No lecture matches your search query "{searchQuery}".</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {filteredTimelineLessons.map((lesson, idx) => {
                const lessonDate = new Date(lesson.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = lessonDate.toDateString() === today.toDateString();
                const isPast = lessonDate < today && !isToday;

                return (
                  <div
                    key={lesson._id || idx}
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: `1px solid ${isToday ? 'rgba(16, 185, 129, 0.4)' : isPast ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.3)'}`,
                      backdropFilter: 'blur(16px)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Status badge & Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isToday ? 'rgba(16, 185, 129, 0.2)' : isPast ? 'rgba(148, 163, 184, 0.15)' : 'rgba(59, 130, 246, 0.2)',
                          color: isToday ? '#34d399' : isPast ? '#94a3b8' : '#60a5fa',
                          border: `1px solid ${isToday ? 'rgba(16, 185, 129, 0.4)' : isPast ? 'rgba(148, 163, 184, 0.3)' : 'rgba(59, 130, 246, 0.4)'}`
                        }}>
                          {isToday ? '🎯 TODAY\'S LECTURE' : isPast ? '✓ COMPLETED' : '🚀 UPCOMING'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                          📅 {lessonDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Topic Title */}
                      <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>
                        {lesson.topic}
                      </h4>

                      {/* Notes Body */}
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#cbd5e1',
                        lineHeight: 1.5,
                        background: 'rgba(15, 23, 42, 0.4)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        {lesson.notes}
                      </p>
                    </div>

                    {/* Quick Teacher controls */}
                    {isTeacher && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center' }}>
                        <button
                          onClick={() => {
                            setDate(lessonDate);
                            setViewMode('calendar');
                            startEditing(lesson);
                          }}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                            color: '#93c5fd',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson._id)}
                          style={{
                            background: 'rgba(244, 63, 94, 0.15)',
                            border: '1px solid rgba(244, 63, 94, 0.35)',
                            color: '#fda4af',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonPlanCalendar;

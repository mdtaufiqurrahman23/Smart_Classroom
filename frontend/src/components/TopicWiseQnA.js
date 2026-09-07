import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function TopicWiseQnA({ classCode, userRole }) {
  const [qnas, setQnas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [postingAnswer, setPostingAnswer] = useState(false);
  
  // Filter & Search
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unanswered', 'answered'
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  // Resolve user role reliably
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

  useEffect(() => {
    fetchQnAs();
  }, [classCode]);

  const fetchQnAs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/topicwise-qna/${classCode}`);
      setQnas(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching QnAs:', err);
      setError('Failed to fetch Q&A discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async (qnaId) => {
    if (!answerText.trim()) {
      showToast('Please enter an answer before posting.', 'error');
      return;
    }

    try {
      setPostingAnswer(true);
      const token = localStorage.getItem('token');
      let teacherName = 'Instructor';
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          teacherName = decoded.name || decoded.email || 'Instructor';
        } catch (e) {}
      }

      await axios.put(`http://localhost:5000/api/topicwise-qna/${qnaId}`, {
        answer: answerText.trim(),
        answeredBy: teacherName
      });

      showToast('✅ Answer published successfully!', 'success');
      setAnswerText('');
      setAnsweringId(null);
      await fetchQnAs();
    } catch (err) {
      console.error('Error posting answer:', err);
      showToast('Failed to post answer', 'error');
    } finally {
      setPostingAnswer(false);
    }
  };

  const handleDeleteQnA = async (qnaId) => {
    if (window.confirm('Are you sure you want to permanently delete this Q&A entry?')) {
      try {
        await axios.delete(`http://localhost:5000/api/topicwise-qna/${qnaId}`);
        setQnas(prev => prev.filter(q => q._id !== qnaId));
        showToast('Q&A discussion removed.', 'info');
      } catch (err) {
        console.error('Error deleting Q&A:', err);
        showToast('Error deleting Q&A', 'error');
      }
    }
  };

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!newQuestion.trim() || !newTopic.trim()) {
      showToast('Please enter both a topic and your question.', 'error');
      return;
    }

    try {
      setSubmittingQuestion(true);
      const token = localStorage.getItem('token');
      let studentName = 'Student';
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          studentName = decoded.name || decoded.email || 'Student';
        } catch (e) {}
      }

      await axios.post('http://localhost:5000/api/topicwise-qna/create', {
        classCode,
        topic: newTopic.trim(),
        question: newQuestion.trim(),
        askedBy: studentName
      });

      showToast('🎉 Your question was submitted to the instructor!', 'success');
      setNewQuestion('');
      setNewTopic('');
      setAskingQuestion(false);
      await fetchQnAs();
    } catch (err) {
      console.error('Error asking question:', err);
      showToast('Error submitting question: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Extract unique topics for dropdown
  const uniqueTopics = useMemo(() => {
    const set = new Set(qnas.map(q => q.topic).filter(Boolean));
    return Array.from(set);
  }, [qnas]);

  // Filtered discussions
  const filteredQnAs = useMemo(() => {
    return qnas.filter(q => {
      // Filter by answered/unanswered
      if (activeFilter === 'answered' && !q.answer) return false;
      if (activeFilter === 'unanswered' && q.answer) return false;

      // Filter by topic
      if (selectedTopic !== 'all' && q.topic !== selectedTopic) return false;

      // Search query
      if (searchQuery.trim()) {
        const qStr = searchQuery.toLowerCase();
        const inQ = (q.question || '').toLowerCase().includes(qStr);
        const inA = (q.answer || '').toLowerCase().includes(qStr);
        const inT = (q.topic || '').toLowerCase().includes(qStr);
        const inBy = (q.askedBy || '').toLowerCase().includes(qStr);
        return inQ || inA || inT || inBy;
      }

      return true;
    });
  }, [qnas, activeFilter, selectedTopic, searchQuery]);

  const unansweredCount = useMemo(() => qnas.filter(q => !q.answer).length, [qnas]);
  const answeredCount = useMemo(() => qnas.filter(q => q.answer).length, [qnas]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', gap: '14px', color: '#94a3b8' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading Q&A discussions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <div>
          <h4 style={{ fontWeight: 'bold' }}>Error Loading Q&A</h4>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>{error}</p>
          <button onClick={fetchQnAs} style={{ marginTop: '8px', padding: '6px 14px', borderRadius: '8px', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          background: toast.type === 'error' ? 'rgba(136, 19, 55, 0.95)' : toast.type === 'info' ? 'rgba(12, 74, 110, 0.95)' : 'rgba(6, 78, 59, 0.95)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(244, 63, 94, 0.5)' : toast.type === 'info' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)'
          }}>
            ❓
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Topic-Wise Q&A
              </h2>
              <span className={`att-stat-badge ${unansweredCount > 0 ? 'att-badge-warning' : 'att-badge-excellent'}`}>
                {unansweredCount} Questions Pending Answer
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Classroom: <strong style={{ color: '#e2e8f0' }}>{classCode}</strong> • {qnas.length} Total Questions ({answeredCount} Answered by Instructor)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {effectiveRole === 'student' && (
            <button
              onClick={() => setAskingQuestion(!askingQuestion)}
              style={{
                background: askingQuestion ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: askingQuestion ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.35)'
              }}
            >
              <span>{askingQuestion ? '✕ Close Form' : '✏️ Ask a Question'}</span>
            </button>
          )}

          <button
            onClick={fetchQnAs}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Student Ask Question Panel */}
      {effectiveRole === 'student' && askingQuestion && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✍️</span>
              <span>Ask a Topic Question</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#93c5fd' }}>
              Your teacher will be notified and can answer your question here
            </span>
          </div>

          <form onSubmit={handleAskQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Topic Field */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Course Topic:
              </label>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Design Patterns, MongoDB Schema, Agile/Scrum, Testing"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Question Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Your Question Details:
              </label>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Describe what you find confusing or need clarification on..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '100px'
                }}
                required
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setAskingQuestion(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingQuestion}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 22px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: submittingQuestion ? 'not-allowed' : 'pointer',
                  opacity: submittingQuestion ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                }}
              >
                {submittingQuestion ? 'Submitting...' : '🚀 Submit Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Discussions Workspace */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Controls Bar: Filter Tabs & Search */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                background: activeFilter === 'all' ? '#3b82f6' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All ({qnas.length})
            </button>
            <button
              onClick={() => setActiveFilter('unanswered')}
              style={{
                background: activeFilter === 'unanswered' ? '#f59e0b' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Pending Answer ({unansweredCount})
            </button>
            <button
              onClick={() => setActiveFilter('answered')}
              style={{
                background: activeFilter === 'answered' ? '#10b981' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Answered ({answeredCount})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Topic Filter */}
            {uniqueTopics.length > 0 && (
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value="all">All Topics ({uniqueTopics.length})</option>
                {uniqueTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search questions or answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '7px 12px 7px 30px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  minWidth: '200px'
                }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        {filteredQnAs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>💬</span>
            <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
              No Discussions Found
            </h4>
            <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto' }}>
              {searchQuery || selectedTopic !== 'all' || activeFilter !== 'all'
                ? 'No discussions match your filter or search query.'
                : 'No topic-wise questions have been asked in this classroom yet.'}
            </p>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredQnAs.map((qna) => {
              const isAnswered = !!qna.answer;
              const isAnsweringThis = answeringId === qna._id;

              return (
                <div
                  key={qna._id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: isAnswered ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '14px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {/* Top Bar: Topic Badge & Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        📌 {qna.topic}
                      </span>
                      <span className={`att-stat-badge ${isAnswered ? 'att-badge-excellent' : 'att-badge-warning'}`}>
                        {isAnswered ? '✓ Answered' : '⏳ Awaiting Instructor Answer'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {effectiveRole === 'teacher' && !isAnswered && !isAnsweringThis && (
                        <button
                          onClick={() => {
                            setAnsweringId(qna._id);
                            setAnswerText('');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>✍️ Answer</span>
                        </button>
                      )}

                      {effectiveRole === 'teacher' && (
                        <button
                          onClick={() => handleDeleteQnA(qna._id)}
                          style={{
                            background: 'rgba(244, 63, 94, 0.15)',
                            color: '#fda4af',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Delete discussion"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Body */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      Q
                    </span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {qna.question}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👤 Asked by: <strong style={{ color: '#cbd5e1' }}>{qna.askedBy || 'Student'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Answered Box */}
                  {isAnswered && (
                    <div style={{
                      marginLeft: '40px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      borderLeft: '3px solid #10b981',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px' }}>🎓</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Verified Instructor Answer:
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#f1f5f9', margin: '4px 0', lineHeight: 1.5 }}>
                        {qna.answer}
                      </p>
                      <span style={{ fontSize: '11px', color: '#6ee7b7' }}>
                        Answered by: {qna.answeredBy || 'Instructor'}
                      </span>
                    </div>
                  )}

                  {/* Teacher Inline Answer Editor */}
                  {effectiveRole === 'teacher' && isAnsweringThis && (
                    <div style={{
                      marginLeft: '40px',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                        ✍️ Provide Official Answer for Students:
                      </span>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write a clear, comprehensive explanation..."
                        rows="4"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          onClick={() => {
                            setAnsweringId(null);
                            setAnswerText('');
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAnswerQuestion(qna._id)}
                          disabled={postingAnswer || !answerText.trim()}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 18px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: postingAnswer || !answerText.trim() ? 'not-allowed' : 'pointer',
                            opacity: postingAnswer || !answerText.trim() ? 0.6 : 1
                          }}
                        >
                          {postingAnswer ? 'Posting...' : '✓ Publish Answer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicWiseQnA;

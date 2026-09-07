import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function TopicWiseQuiz({ classCode, userRole }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);
  const [expandedQuizzes, setExpandedQuizzes] = useState(new Set());
  const [searchTopic, setSearchTopic] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Student quiz practice state: quizId -> { qIdx: selectedOption }
  const [studentAnswers, setStudentAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});

  // Resolve role reliably
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
    fetchQuizzes();
  }, [classCode]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/topicwise-quiz/${classCode}`);
      const data = response.data || [];
      setQuizzes(data);
      // Auto-expand all quizzes by default so teachers immediately see all questions
      setExpandedQuizzes(new Set(data.map(q => q._id)));
      setError(null);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to fetch quizzes. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (quizId) => {
    setExpandedQuizzes(prev => {
      const next = new Set(prev);
      if (next.has(quizId)) {
        next.delete(quizId);
      } else {
        next.add(quizId);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandedQuizzes.size === filteredQuizzes.length) {
      setExpandedQuizzes(new Set());
    } else {
      setExpandedQuizzes(new Set(filteredQuizzes.map(q => q._id)));
    }
  };

  const handleQuestionChange = (qIdx, field, value) => {
    const updated = [...questions];
    if (field === 'question') {
      updated[qIdx].question = value;
    } else if (field === 'correctAnswer') {
      updated[qIdx].correctAnswer = value;
    } else if (field.startsWith('option-')) {
      const optIdx = parseInt(field.split('-')[1]);
      const prevOptVal = updated[qIdx].options[optIdx];
      updated[qIdx].options[optIdx] = value;
      // If the option being edited was selected as the correct answer, update correctAnswer too
      if (updated[qIdx].correctAnswer === prevOptVal) {
        updated[qIdx].correctAnswer = value;
      }
    }
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: ['', '', '', ''], correctAnswer: '' }
    ]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a quiz topic name');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Question #${i + 1} text is empty.`);
        return;
      }
      const filledOptions = q.options.filter(opt => opt.trim());
      if (filledOptions.length < 2) {
        alert(`Question #${i + 1} must have at least 2 options.`);
        return;
      }
      if (!q.correctAnswer.trim()) {
        alert(`Please select or specify the correct answer for Question #${i + 1}.`);
        return;
      }
      if (!q.options.map(o => o.trim()).includes(q.correctAnswer.trim())) {
        alert(`Correct answer for Question #${i + 1} must match one of the available options.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        classCode,
        topic: topic.trim(),
        questions: questions.map(q => ({
          question: q.question.trim(),
          options: q.options.filter(opt => opt.trim()),
          correctAnswer: q.correctAnswer.trim()
        }))
      };

      await axios.post('http://localhost:5000/api/topicwise-quiz/create', payload);
      alert('🎉 Quiz created successfully!');
      setTopic('');
      setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: '' }]);
      setShowCreateModal(false);
      await fetchQuizzes();
    } catch (err) {
      console.error('Error creating quiz:', err);
      alert('Error creating quiz: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId, quizTopic) => {
    if (window.confirm(`Are you sure you want to permanently delete the quiz for "${quizTopic}"?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/topicwise-quiz/${quizId}`);
        setQuizzes(prev => prev.filter(q => q._id !== quizId));
        alert('Quiz deleted successfully.');
      } catch (err) {
        console.error('Error deleting quiz:', err);
        alert('Error deleting quiz: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Student practice methods
  const handleSelectOption = (quizId, qIdx, option) => {
    setStudentAnswers(prev => ({
      ...prev,
      [quizId]: {
        ...(prev[quizId] || {}),
        [qIdx]: option
      }
    }));
  };

  const handleGradeQuiz = (quiz) => {
    const answers = studentAnswers[quiz._id] || {};
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        score++;
      }
    });

    setQuizResults(prev => ({
      ...prev,
      [quiz._id]: {
        score,
        total: quiz.questions.length,
        percentage: Math.round((score / quiz.questions.length) * 100),
        submitted: true
      }
    }));
  };

  const handleResetQuiz = (quizId) => {
    setStudentAnswers(prev => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
    setQuizResults(prev => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
  };

  // Filter quizzes by search term
  const filteredQuizzes = useMemo(() => {
    if (!searchTopic.trim()) return quizzes;
    return quizzes.filter(q =>
      (q.topic && q.topic.toLowerCase().includes(searchTopic.toLowerCase())) ||
      (q.questions && q.questions.some(qn => qn.question.toLowerCase().includes(searchTopic.toLowerCase())))
    );
  }, [quizzes, searchTopic]);

  const totalQuestions = useMemo(() => {
    return quizzes.reduce((sum, q) => sum + (q.questions ? q.questions.length : 0), 0);
  }, [quizzes]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px', color: '#94a3b8' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '4px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <div>
          <h4 style={{ fontWeight: 'bold' }}>Error Loading Quizzes</h4>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>{error}</p>
          <button onClick={fetchQuizzes} style={{ marginTop: '8px', padding: '6px 14px', borderRadius: '8px', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', color: '#f8fafc' }}>
      {/* Header Banner & Stats */}
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
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 16px rgba(236, 72, 153, 0.25)'
          }}>
            🧩
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Topic-Wise Quizzes
              </h2>
              <span className={`att-stat-badge ${effectiveRole === 'teacher' ? 'att-badge-excellent' : 'att-badge-good'}`}>
                {effectiveRole === 'teacher' ? 'Instructor Management' : 'Student Practice Mode'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Class: <strong style={{ color: '#e2e8f0' }}>{classCode}</strong> • {quizzes.length} Topic Quizzes Available ({totalQuestions} Total Questions)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {effectiveRole === 'teacher' && (
            <button
              onClick={() => setShowCreateModal(!showCreateModal)}
              style={{
                background: showCreateModal ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
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
                boxShadow: showCreateModal ? 'none' : '0 4px 14px rgba(139, 92, 246, 0.35)'
              }}
            >
              <span>{showCreateModal ? '✕ Close Creator' : '➕ Create New Quiz'}</span>
            </button>
          )}

          <button
            onClick={fetchQuizzes}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
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

      {/* Teacher Create Quiz Panel */}
      {effectiveRole === 'teacher' && showCreateModal && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>✏️</span>
              <span>Create New Topic-Wise Quiz</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#a78bfa' }}>
              Add a topic and multiple-choice questions for your students
            </span>
          </div>

          <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Topic Input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                Topic Name: <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Software Design Patterns, REST APIs, Scrum Framework"
                style={{
                  width: '100%',
                  padding: '12px 16px',
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

            {/* Questions Builder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                  Questions ({questions.length})
                </h4>
                <button
                  type="button"
                  onClick={addQuestion}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
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
                  <span>➕ Add Another Question</span>
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Question #{qIdx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.15)',
                          color: '#fda4af',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Remove Question
                      </button>
                    )}
                  </div>

                  {/* Question Text */}
                  <div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                      placeholder={`Enter question #${qIdx + 1}...`}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                      Options & Select Correct Answer:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelectedAsCorrect = q.correctAnswer && q.correctAnswer === opt;
                        return (
                          <div
                            key={oIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: isSelectedAsCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                              border: `1px solid ${isSelectedAsCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                              borderRadius: '8px',
                              padding: '6px 10px'
                            }}
                          >
                            <input
                              type="radio"
                              name={`correct-answer-${qIdx}`}
                              checked={isSelectedAsCorrect}
                              onChange={() => handleQuestionChange(qIdx, 'correctAnswer', opt)}
                              title="Mark this option as correct"
                              style={{ cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleQuestionChange(qIdx, `option-${oIdx}`, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                              style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none'
                              }}
                              required
                            />
                            {isSelectedAsCorrect && (
                              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 800, flexShrink: 0 }}>
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Correct Answer Fallback / Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Correct Answer selected:</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: q.correctAnswer ? '#34d399' : '#fbbf24',
                      background: q.correctAnswer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      padding: '3px 10px',
                      borderRadius: '6px'
                    }}>
                      {q.correctAnswer ? `✓ ${q.correctAnswer}` : '⚠️ Select correct option above'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                }}
              >
                {submitting ? '⏳ Saving Quiz...' : '💾 Save & Publish Quiz'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quizzes List & Toolbar */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* List Header & Search Filter */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📚</span>
              <span>Available Quizzes ({filteredQuizzes.length})</span>
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              {effectiveRole === 'teacher'
                ? 'Review, preview questions, or remove quizzes for this classroom'
                : 'Select options and test your knowledge on each classroom topic'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search topic or question..."
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px 8px 34px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
                🔍
              </span>
              {searchTopic && (
                <button
                  onClick={() => setSearchTopic('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              )}
            </div>

            {filteredQuizzes.length > 0 && (
              <button
                onClick={toggleExpandAll}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {expandedQuizzes.size === filteredQuizzes.length ? '▲ Collapse All' : '▼ Expand All'}
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredQuizzes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🧩</span>
            <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
              No Quizzes Found
            </h4>
            <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
              {searchTopic
                ? `No quizzes match the search term "${searchTopic}".`
                : effectiveRole === 'teacher'
                ? 'No quizzes have been created for this classroom yet. Click "Create New Quiz" above to add your first topic quiz.'
                : 'Your instructor has not posted any quizzes for this classroom yet.'}
            </p>
            {effectiveRole === 'teacher' && !showCreateModal && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  marginTop: '16px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ➕ Create First Quiz
              </button>
            )}
          </div>
        ) : (
          /* Quizzes Grid / Accordion */
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredQuizzes.map((quiz, quizIdx) => {
              const isExpanded = expandedQuizzes.has(quiz._id);
              const qCount = quiz.questions ? quiz.questions.length : 0;
              const result = quizResults[quiz._id];
              const createdDate = quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

              return (
                <div
                  key={quiz._id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: isExpanded ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: isExpanded ? '0 8px 24px rgba(0, 0, 0, 0.3)' : 'none'
                  }}
                >
                  {/* Quiz Header Bar */}
                  <div
                    onClick={() => toggleExpand(quiz._id)}
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                      flexWrap: 'wrap',
                      gap: '12px',
                      background: isExpanded ? 'rgba(30, 41, 59, 0.6)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
                      <span style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '13px',
                        flexShrink: 0
                      }}>
                        #{quizIdx + 1}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
                            {quiz.topic}
                          </h4>
                          <span style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#c084fc',
                            border: '1px solid rgba(139, 92, 246, 0.35)',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {qCount} Questions
                          </span>
                          {createdDate && (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              📅 {createdDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                      {effectiveRole === 'teacher' && (
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id, quiz.topic)}
                          style={{
                            background: 'rgba(244, 63, 94, 0.15)',
                            color: '#fda4af',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Delete this quiz"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(quiz._id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#cbd5e1',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{isExpanded ? '▲ Hide Questions' : '▼ View Questions'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Questions Detail */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {/* Student Score Bar if submitted */}
                      {effectiveRole === 'student' && result && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: result.percentage >= 80 ? 'rgba(16, 185, 129, 0.15)' : result.percentage >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          border: `1px solid ${result.percentage >= 80 ? 'rgba(16, 185, 129, 0.4)' : result.percentage >= 50 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div>
                            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Your Quiz Score:</span>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                              {result.score} / {result.total} ({result.percentage}%)
                            </div>
                          </div>
                          <button
                            onClick={() => handleResetQuiz(quiz._id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            🔄 Retake Quiz
                          </button>
                        </div>
                      )}

                      {/* Question Cards */}
                      {quiz.questions && quiz.questions.map((q, qIdx) => {
                        const selectedAnswer = studentAnswers[quiz._id]?.[qIdx];
                        const showGrading = effectiveRole === 'student' && result?.submitted;

                        return (
                          <div
                            key={q._id || qIdx}
                            style={{
                              background: 'rgba(30, 41, 59, 0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '12px',
                              padding: '16px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                              <span style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {qIdx + 1}
                              </span>
                              <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', margin: 0, lineHeight: 1.4 }}>
                                {q.question}
                              </h5>
                            </div>

                            {/* Options List */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', paddingLeft: '34px' }}>
                              {q.options && q.options.map((opt, oIdx) => {
                                const isCorrect = q.correctAnswer === opt;
                                const isSelected = selectedAnswer === opt;

                                let optBg = 'rgba(15, 23, 42, 0.6)';
                                let optBorder = 'rgba(255, 255, 255, 0.08)';
                                let optColor = '#cbd5e1';

                                if (effectiveRole === 'teacher') {
                                  // In teacher mode, highlight the correct answer clearly
                                  if (isCorrect) {
                                    optBg = 'rgba(16, 185, 129, 0.15)';
                                    optBorder = 'rgba(16, 185, 129, 0.4)';
                                    optColor = '#34d399';
                                  }
                                } else {
                                  // In student mode:
                                  if (showGrading) {
                                    if (isCorrect) {
                                      optBg = 'rgba(16, 185, 129, 0.2)';
                                      optBorder = '#10b981';
                                      optColor = '#34d399';
                                    } else if (isSelected && !isCorrect) {
                                      optBg = 'rgba(244, 63, 94, 0.2)';
                                      optBorder = '#f43f5e';
                                      optColor = '#fda4af';
                                    }
                                  } else if (isSelected) {
                                    optBg = 'rgba(59, 130, 246, 0.25)';
                                    optBorder = '#3b82f6';
                                    optColor = '#93c5fd';
                                  }
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    onClick={() => {
                                      if (effectiveRole === 'student' && !showGrading) {
                                        handleSelectOption(quiz._id, qIdx, opt);
                                      }
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      borderRadius: '8px',
                                      background: optBg,
                                      border: `1px solid ${optBorder}`,
                                      color: optColor,
                                      fontSize: '13px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      cursor: effectiveRole === 'student' && !showGrading ? 'pointer' : 'default',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                                        {String.fromCharCode(65 + oIdx)}.
                                      </span>
                                      <span style={{ fontWeight: isCorrect || isSelected ? 600 : 400 }}>
                                        {opt}
                                      </span>
                                    </div>

                                    {/* Badges */}
                                    {effectiveRole === 'teacher' && isCorrect && (
                                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                                        ✓ Correct Answer
                                      </span>
                                    )}

                                    {showGrading && isCorrect && (
                                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
                                        ✓ Correct
                                      </span>
                                    )}

                                    {showGrading && isSelected && !isCorrect && (
                                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#f43f5e' }}>
                                        ✗ Your Answer
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Student Submit Quiz Button */}
                      {effectiveRole === 'student' && !result?.submitted && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button
                            onClick={() => handleGradeQuiz(quiz)}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '10px 20px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            ✓ Submit Quiz Answers
                          </button>
                        </div>
                      )}
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

export default TopicWiseQuiz;

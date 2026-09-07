import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ViewFeedback = ({ classCode, userRole = 'teacher' }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, [classCode]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/feedback/${classCode}`);
      setFeedbacks(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err.response?.data?.message || 'Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to permanently delete this feedback entry?')) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/feedback/${feedbackId}`);
      setFeedbacks(prev => prev.filter(f => f._id !== feedbackId));
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback entry');
    }
  };

  const filteredFeedbacks = useMemo(() => {
    if (!searchQuery.trim()) return feedbacks;
    const q = searchQuery.toLowerCase();
    return feedbacks.filter(f => f.feedbackMessage && f.feedbackMessage.toLowerCase().includes(q));
  }, [feedbacks, searchQuery]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', gap: '14px', color: '#94a3b8' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading student feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <div>
          <h4 style={{ fontWeight: 'bold' }}>Error Loading Feedback</h4>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>{error}</p>
          <button onClick={fetchFeedback} style={{ marginTop: '8px', padding: '6px 14px', borderRadius: '8px', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', color: '#f8fafc' }}>
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
            background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 16px rgba(236, 72, 153, 0.25)'
          }}>
            💬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Anonymous Student Feedback
              </h3>
              <span className="att-stat-badge att-badge-excellent">
                {feedbacks.length} Submissions
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Classroom: <strong style={{ color: '#e2e8f0' }}>{classCode}</strong> • Unbiased student thoughts to improve course delivery
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '8px 14px 8px 32px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                minWidth: '200px'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={fetchFeedback}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12px',
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

      {/* Feedback Cards List */}
      {filteredFeedbacks.length === 0 ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📭</span>
          <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
            No Feedback Records Found
          </h4>
          <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
            {searchQuery
              ? `No feedback entries match your search query "${searchQuery}".`
              : 'No anonymous feedback has been submitted by students in this class yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredFeedbacks.map((item, idx) => {
            const dateStr = item.feedbackDate || item.createdAt;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent';

            // Extract bracketed tag if present e.g. [Lecture Quality]
            const tagMatch = item.feedbackMessage?.match(/^\[(.*?)\]/);
            const tag = tagMatch ? tagMatch[1] : null;
            const cleanText = tagMatch ? item.feedbackMessage.replace(/^\[(.*?)\]\s*/, '') : item.feedbackMessage;

            return (
              <div
                key={item._id || idx}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Meta Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700
                    }}>
                      🔒
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                          Anonymous Student
                        </span>
                        {tag && (
                          <span style={{
                            background: 'rgba(168, 85, 247, 0.2)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {tag}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        📅 {formattedDate}
                      </span>
                    </div>
                  </div>

                  {userRole === 'teacher' && (
                    <button
                      onClick={() => deleteFeedback(item._id)}
                      style={{
                        background: 'rgba(244, 63, 94, 0.15)',
                        color: '#fda4af',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Delete this feedback entry"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {/* Message Body */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  fontSize: '14px',
                  color: '#f8fafc',
                  lineHeight: 1.6
                }}>
                  "{cleanText}"
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewFeedback;

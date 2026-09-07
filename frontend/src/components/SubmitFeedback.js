import React, { useState } from 'react';
import axios from 'axios';

function SubmitFeedback({ classCode }) {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [category, setCategory] = useState('Lecture Quality');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const categories = [
    'Lecture Quality',
    'Pacing & Clarity',
    'Lab & Assignments',
    'Course Materials',
    'General Suggestion'
  ];

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) {
      showToast('Please enter your feedback message.', 'error');
      return;
    }

    try {
      setLoading(true);
      const fullMessage = category ? `[${category}] ${feedbackMessage.trim()}` : feedbackMessage.trim();

      await axios.post('http://localhost:5000/api/feedback/submit', { 
        classCode, 
        feedbackMessage: fullMessage
      });

      showToast('✅ Anonymous feedback submitted successfully! Thank you.', 'success');
      setFeedbackMessage('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error submitting feedback';
      showToast(`❌ ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Toast notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '14px 20px',
          borderRadius: '12px',
          background: toast.type === 'error' ? 'rgba(136, 19, 55, 0.95)' : 'rgba(6, 78, 59, 0.95)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
          backdropFilter: 'blur(12px)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <span>{toast.type === 'error' ? '🚫' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Feedback Box */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 16px rgba(168, 85, 247, 0.3)'
          }}>
            💡
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>
              Anonymous Class Feedback
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Voice your candid suggestions, questions, or concerns directly to your instructor
            </p>
          </div>
        </div>

        {/* Privacy Assurance Banner */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <div style={{ fontSize: '13px', color: '#93c5fd', lineHeight: 1.4 }}>
            <strong style={{ color: '#bfdbfe' }}>100% Anonymous:</strong> Your identity, name, email, and student ID are strictly hidden and never stored with your message.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Category Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px' }}>
              Select Feedback Topic:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#fff' : '#cbd5e1',
                      border: `1px solid ${isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.12)'}`,
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(168, 85, 247, 0.35)' : 'none'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Message */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                Your Message:
              </label>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {feedbackMessage.length} characters
              </span>
            </div>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="What could be improved in recent lectures? Any concepts you found unclear or topics you'd like more exercises on?"
              rows="6"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.5',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '130px'
              }}
              required
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={loading || !feedbackMessage.trim()}
              style={{
                background: loading || !feedbackMessage.trim() ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading || !feedbackMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !feedbackMessage.trim() ? 0.6 : 1,
                boxShadow: loading || !feedbackMessage.trim() ? 'none' : '0 6px 20px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{loading ? '⏳ Submitting...' : '🚀 Submit Anonymous Feedback'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitFeedback;

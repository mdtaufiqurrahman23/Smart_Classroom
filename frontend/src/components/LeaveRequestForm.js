// frontend/src/components/LeaveRequestForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LeaveRequestForm() {
  const [classCode, setClassCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [reason, setReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('classCode', classCode);
      formData.append('studentId', studentId);
      formData.append('studentName', studentName);
      formData.append('reason', reason);
      formData.append('leaveDate', leaveDate);
      if (document) {
        formData.append('document', document);
      }

      await axios.post('/api/leave-requests/create', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      setMessage('✅ Leave request submitted successfully!');
      setTimeout(() => navigate('/student-dashboard'), 2000);
    } catch (error) {
      setMessage('❌ Error submitting leave request. Please try again.');
      console.error('Error submitting leave request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper min-h-screen">
      <div className="full-screen-container">
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%' }}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📋</div>
            <h1 className="text-4xl font-bold mb-2">Leave Request</h1>
            <p className="text-secondary">Submit your leave request with proper documentation</p>
          </div>

          {message && (
            <div className={`alert mb-6 ${message.includes('successfully') ? 'alert-success' : 'alert-error'}`}>
              <span>{message.includes('✅') ? '✅' : '❌'}</span>
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Class Code *</label>
              <input
                type="text"
                placeholder="e.g., CS101"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                required
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input
                type="text"
                placeholder="e.g., CSE001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student Name *</label>
              <input
                type="text"
                placeholder="Your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Leave Date *</label>
              <input
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Leave *</label>
              <textarea
                placeholder="Explain the reason for your leave request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                maxLength={500}
                rows="4"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supporting Document (Optional)</label>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center cursor-pointer hover:border-white/50 transition-colors">
                <input
                  type="file"
                  onChange={(e) => setDocument(e.target.files[0])}
                  className="hidden"
                  id="fileInput"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label htmlFor="fileInput" className="cursor-pointer block">
                  <p className="text-2xl mb-2">📎</p>
                  <p className="font-semibold mb-1">
                    {document ? document.name : 'Click to upload document'}
                  </p>
                  <p className="text-sm text-secondary">PDF, JPG, PNG, or DOC files</p>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary btn-lg w-full mt-8"
            >
              {loading ? '⏳ Submitting...' : '✓ Submit Leave Request'}
            </button>
          </form>

          <div className="glass-card-sm mt-6">
            <p className="text-xs text-center text-secondary">
              📌 Your leave request will be reviewed by your teacher. You'll receive a notification once it's approved or rejected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaveRequestForm;

// frontend/src/components/LeaveRequests.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function LeaveRequests({ classCode }) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [classCode]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/leave-requests/${classCode}`);
      setLeaveRequests(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      setUpdatingId(requestId);
      await axios.post('http://localhost:5000/api/leave-requests/update-status', { requestId, status });
      showToast(`Leave request marked as ${status}`, 'success');
      setLeaveRequests(prev =>
        prev.map(request => (request._id === requestId ? { ...request, status } : request))
      );
    } catch (err) {
      console.error('Error updating leave request status:', err);
      showToast('Failed to update leave request status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (req.studentName || '').toLowerCase().includes(q);
        const idMatch = (req.studentId || '').toLowerCase().includes(q);
        const reasonMatch = (req.reason || '').toLowerCase().includes(q);
        return nameMatch || idMatch || reasonMatch;
      }
      return true;
    });
  }, [leaveRequests, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: leaveRequests.length,
      pending: leaveRequests.filter(r => r.status === 'Pending').length,
      approved: leaveRequests.filter(r => r.status === 'Approved').length,
      rejected: leaveRequests.filter(r => r.status === 'Rejected').length,
    };
  }, [leaveRequests]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px', color: '#94a3b8' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '4px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading leave requests...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', color: '#f8fafc' }}>
      {/* Floating Toast */}
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
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 16px rgba(14, 165, 233, 0.25)'
          }}>
            📋
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Student Leave Requests
              </h3>
              <span className="att-stat-badge att-badge-excellent">
                {counts.all} Total
              </span>
              {counts.pending > 0 && (
                <span className="att-stat-badge att-badge-warning">
                  {counts.pending} Awaiting Review
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Classroom: <strong style={{ color: '#e2e8f0' }}>{classCode}</strong> • Review and approve student absence justifications
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search student or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'All', count: counts.all },
          { label: 'Pending', count: counts.pending, color: '#fbbf24' },
          { label: 'Approved', count: counts.approved, color: '#34d399' },
          { label: 'Rejected', count: counts.rejected, color: '#f87171' }
        ].map(tab => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.label)}
            style={{
              background: statusFilter === tab.label ? 'rgba(59, 130, 246, 0.25)' : 'rgba(30, 41, 59, 0.6)',
              border: `1px solid ${statusFilter === tab.label ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
              color: statusFilter === tab.label ? '#fff' : '#94a3b8',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              background: statusFilter === tab.label ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '999px',
              fontWeight: 700
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Leave Requests Cards */}
      {filteredRequests.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'rgba(30, 41, 59, 0.4)',
          borderRadius: '16px',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          color: '#94a3b8'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📋</span>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
            No Leave Requests Found
          </h4>
          <p style={{ fontSize: '13px' }}>
            {searchQuery || statusFilter !== 'All' ? 'No leave requests match the selected filters.' : 'No leave requests submitted yet for this classroom.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
          {filteredRequests.map((req) => {
            const isPending = req.status === 'Pending';
            const isApproved = req.status === 'Approved';
            const isRejected = req.status === 'Rejected';
            const leaveDateFormatted = req.leaveDate
              ? new Date(req.leaveDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A';
            const submittedFormatted = req.createdAt
              ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '';

            return (
              <div
                key={req._id}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  backdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Top line: Student info & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {(req.studentName || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#fff' }}>{req.studentName}</strong>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {req.studentId}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: isApproved ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isApproved ? '#34d399' : isRejected ? '#fda4af' : '#fbbf24',
                      border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.3)' : isRejected ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      <span>{isApproved ? '✓' : isRejected ? '✗' : '⏳'}</span>
                      <span>{req.status}</span>
                    </span>
                  </div>

                  {/* Reason Text */}
                  <p style={{
                    fontSize: '14px',
                    color: '#cbd5e1',
                    lineHeight: 1.5,
                    margin: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {req.reason}
                  </p>

                  {/* Meta: Leave Date & Document */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📅 Requested Leave Date:</span>
                      <strong style={{ color: '#60a5fa' }}>{leaveDateFormatted}</strong>
                    </div>

                    {submittedFormatted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🕒 Submitted: {submittedFormatted}</span>
                      </div>
                    )}

                    {req.document && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#a78bfa',
                        background: 'rgba(139, 92, 246, 0.1)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(139, 92, 246, 0.25)'
                      }}>
                        <span>📎</span>
                        <span>{req.document}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons for Teacher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center' }}>
                  <button
                    onClick={() => handleUpdateStatus(req._id, 'Approved')}
                    disabled={updatingId === req._id || isApproved}
                    style={{
                      background: isApproved ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isApproved ? 'default' : 'pointer',
                      opacity: isApproved ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isApproved ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>✓</span>
                    <span>{isApproved ? 'Approved' : 'Approve'}</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(req._id, 'Rejected')}
                    disabled={updatingId === req._id || isRejected}
                    style={{
                      background: isRejected ? 'rgba(244, 63, 94, 0.3)' : 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isRejected ? 'default' : 'pointer',
                      opacity: isRejected ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isRejected ? 'none' : '0 4px 12px rgba(244, 63, 94, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>✕</span>
                    <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LeaveRequests;

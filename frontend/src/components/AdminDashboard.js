import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [view, setView] = useState('pending'); // 'pending' | 'all'
  const [studentIdInputs, setStudentIdInputs] = useState({}); // requestId -> Student ID being assigned

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/pending', { headers: authHeader() }),
        axios.get('http://localhost:5000/api/admin/users', { headers: authHeader() })
      ]);
      setPending(pendingRes.data);
      setAllUsers(allRes.data);
      setError('');

      // Pre-fill the Student ID input with the suggested next ID, but don't
      // clobber anything the admin already typed for a request still showing.
      setStudentIdInputs((prev) => {
        const next = { ...prev };
        pendingRes.data.forEach((r) => {
          if (r.role === 'student' && next[r._id] === undefined) {
            next[r._id] = r.suggestedId || '';
          }
        });
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load requests');
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (request) => {
    const userId = request._id;
    if (request.role === 'student' && !studentIdInputs[userId]?.trim()) {
      alert('Please enter a Student ID before approving');
      return;
    }

    setActioningId(userId);
    try {
      const body = request.role === 'student' ? { studentId: studentIdInputs[userId].trim() } : {};
      await axios.post(`http://localhost:5000/api/admin/approve/${userId}`, body, { headers: authHeader() });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Reject this registration request?')) return;
    setActioningId(userId);
    try {
      await axios.post(`http://localhost:5000/api/admin/reject/${userId}`, {}, { headers: authHeader() });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently remove ${user.name || user.email} (${user.role})? This cannot be undone.`)) return;
    setActioningId(user._id);
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${user._id}`, { headers: authHeader() });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove account');
    } finally {
      setActioningId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/admin-login');
  };

  return (
    <div className="page-wrapper min-h-screen" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <nav className="navbar" style={{ position: 'relative', zIndex: 2 }}>
        <div className="navbar-brand cursor-pointer" onClick={() => navigate('/')}>🛡️ Smart Class Admin</div>
        <ul className="navbar-items">
          <li><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></li>
        </ul>
      </nav>

      <div className="container" style={{ maxWidth: '1200px', marginTop: '40px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        <div className="glass-card-lg mb-8">
          <h1 className="text-4xl font-bold mb-2">🛡️ Administration Dashboard</h1>
          <p className="text-secondary">Review and approve student &amp; teacher registration requests</p>
        </div>

        <div className="flex gap-3 mb-6">
          <button onClick={() => setView('pending')} className={`btn ${view === 'pending' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
            🕓 Pending ({pending.length})
          </button>
          <button onClick={() => setView('all')} className={`btn ${view === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
            📋 All Accounts ({allUsers.length})
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="loader" /></div>
        ) : view === 'pending' ? (
          <div className="glass-card-lg">
            {pending.length === 0 ? (
              <p className="text-secondary text-center py-12">No pending requests right now. 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pending.map((req) => (
                  <div key={req._id} className="glass-card-sm" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <p className="font-bold" style={{ fontSize: '1.1rem' }}>
                        {req.role === 'teacher' ? '👨‍🏫' : '🎓'} {req.name || '(no name)'}
                        <span className="badge badge-secondary" style={{ marginLeft: '10px' }}>{req.role}</span>
                      </p>
                      <p className="text-secondary text-sm">{req.email}</p>
                      {req.role === 'student' && (
                        <p className="text-secondary text-sm">Dept: {req.department}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                      {req.role === 'student' && (
                        <input
                          type="text"
                          placeholder="Assign Student ID"
                          value={studentIdInputs[req._id] ?? ''}
                          onChange={(e) => setStudentIdInputs((prev) => ({ ...prev, [req._id]: e.target.value.toUpperCase() }))}
                          style={{ width: '160px', margin: 0 }}
                          title="This ID is what the student will use to identify themselves going forward"
                        />
                      )}
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={actioningId === req._id}
                        className="btn btn-primary btn-sm"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleReject(req._id)}
                        disabled={actioningId === req._id}
                        className="btn btn-danger btn-sm"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card-lg">
            {allUsers.length === 0 ? (
              <p className="text-secondary text-center py-12">No accounts yet.</p>
            ) : (
              <div className="att-table-container">
                <table className="att-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Unique ID</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u._id}>
                        <td>{u.name || '—'}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>
                          <span className={`badge ${u.status === 'active' ? 'badge-success' : u.status === 'rejected' ? 'badge-danger' : 'badge-secondary'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td>{u.uniqueId || '—'}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={actioningId === u._id}
                            className="btn btn-danger btn-sm"
                          >
                            🗑️ Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

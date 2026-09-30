import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        expectedRole: 'admin'
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.user.role);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div className="glass-card" style={{ maxWidth: '420px', width: '100%' }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">🛡️ Administration</h1>
            <p className="text-secondary">Sign in to manage registrations</p>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="admin@smartclass.local"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center pt-4">
              <Link to="/" className="text-accent font-semibold hover:underline">← Back to Home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

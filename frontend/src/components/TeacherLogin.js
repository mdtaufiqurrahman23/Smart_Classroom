import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function TeacherLogin() {
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
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', 'teacher');
      navigate('/teacher-dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid credentials. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      {/* Animated background overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{ width: '100%', maxWidth: '450px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="text-center mb-8">
            <h2 className="text-sm font-semibold mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ✨ Revolutionizing Academic Attendance
            </h2>
            <h1 className="text-5xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Smart Attendance</h1>
            <p className="text-secondary text-lg font-semibold">Lecture Companion</p>
            <p className="text-secondary text-sm mt-4">Manage your classes & students</p>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '25px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: loading ? 0.7 : 1,
                width: '100%',
                marginTop: '20px'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center pt-4">
              <p className="text-secondary mb-4">
                Don't have an account? 
                <Link to="/signup" className="text-accent ml-2 font-semibold hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>

          <div className="glass-card-sm mt-6">
            <p className="text-sm text-center text-secondary">
              💡 Demo account: Use your registered email and password to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email || !password || !role) return 'Email, password, and role required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Valid email required';
    if (password.length < 6) return 'Password must be 6+ characters';
    if (role === 'student' && (!name || !studentId || !department)) {
      return 'All student fields required';
    }
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const userData = role === 'student'
      ? { email, password, role, name, studentId, department }
      : { email, password, role };

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData, {
        headers: { 'Content-Type': 'application/json' }
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', role); // Store role for dashboard routing
      navigate(role === 'student' ? '/student-dashboard' : '/teacher-dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Signup failed. Try again.';
      setError(errorMsg);
      console.error('Signup error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields when role changes
  useEffect(() => {
    if (role) {
      setEmail('');
      setPassword('');
      setName('');
      setStudentId('');
      setDepartment('');
      setError('');
    }
  }, [role]);

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
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="text-center mb-8">
            <h2 className="text-sm font-semibold mb-4" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ✨ Revolutionizing Academic Attendance
            </h2>
            <h1 className="text-5xl font-bold text-center mb-2" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Create Account
            </h1>
            <p className="text-secondary mt-2">Join Smart Attendance & Lecture Companion</p>
          </div>

          {/* Role Selection */}
          {!role && (
            <div className="flex flex-row gap-4 mb-8" style={{ justifyContent: 'center' }}>
              <button 
                onClick={() => setRole('student')}
                className="flex-1"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '40px 30px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  maxWidth: '260px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🎓</div>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '10px' }}>Student</h3>
                <p style={{ fontSize: '1rem', opacity: 0.9 }}>Join classes & track attendance</p>
              </button>
              <button 
                onClick={() => setRole('teacher')}
                className="flex-1"
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '40px 30px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  maxWidth: '260px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>👨‍🏫</div>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '10px' }}>Teacher</h3>
                <p style={{ fontSize: '1rem', opacity: 0.9 }}>Manage classes & attendance</p>
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="alert alert-error mb-6">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Student Form */}
          {role === 'student' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input
                  type="text"
                  placeholder="e.g., CSE001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  required
                  pattern="[A-Z0-9]{3,10}"
                  title="Student ID: 3-10 uppercase letters/numbers"
                  maxLength={10}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  placeholder="e.g., CSE"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                  required
                  pattern="[A-Z ]+"
                  title="Department: Uppercase letters only"
                  maxLength={30}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
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
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                {loading ? 'Creating Account...' : 'Sign Up as Student'}
              </button>
              <button
                type="button"
                onClick={() => setRole(null)}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  padding: '12px 25px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                ← Back to role selection
              </button>
            </form>
          )}

          {/* Teacher Form */}
          {role === 'teacher' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Email</label>
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
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                {loading ? 'Creating Account...' : 'Sign Up as Teacher'}
              </button>
              <button
                type="button"
                onClick={() => setRole(null)}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  padding: '12px 25px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                ← Back to role selection
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Signup;

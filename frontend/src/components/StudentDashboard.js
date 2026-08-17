import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [error, setError] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classCode || null);

  // Fetch joined classes on component mount
  useEffect(() => {
    const fetchJoinedClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching classes with token:', token ? 'present' : 'missing');
        const response = await fetch('http://localhost:5000/api/classrooms/student/my-classes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Classes response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Joined classes:', data);
          setJoinedClasses(data);
          
          // Auto-select first class if no classCode in URL
          if (!classCode && data.length > 0) {
            setSelectedClass(data[0].classCode);
          } else if (classCode) {
            setSelectedClass(classCode);
          }
        } else {
          const error = await response.json();
          console.error('Error fetching classes:', error);
        }
      } catch (error) {
        console.error('Error fetching joined classes:', error);
      }
    };

    fetchJoinedClasses();
  }, []);

  // Fetch classroom details when selected class changes
  useEffect(() => {
    if (selectedClass) {
      const fetchClassroom = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/classrooms/${selectedClass}`);
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.message || 'Failed to fetch classroom');
            return;
          }
          const data = await response.json();
          setClassroom(data);
          setError(null);
        } catch (error) {
          setError('Error fetching classroom');
        }
      };

      fetchClassroom();
    }
  }, [selectedClass]);

  // Join a class with code
  const handleJoinClass = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/classrooms/student/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classCode: joinCode.trim().toUpperCase() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setJoinError(errorData.message || 'Failed to join class');
        setJoinLoading(false);
        return;
      }

      const data = await response.json();
      const newClass = data.classroom;
      
      // Refresh the joined classes list
      const classesResponse = await fetch('http://localhost:5000/api/classrooms/student/my-classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (classesResponse.ok) {
        const updatedClasses = await classesResponse.json();
        setJoinedClasses(updatedClasses);
      }
      
      setSelectedClass(newClass.classCode);
      setJoinCode('');
      setJoinError('');
      setJoinLoading(false);
    } catch (error) {
      console.error('Error joining class:', error);
      setJoinError('Error joining class');
      setJoinLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/student-login');
  };

  if (!selectedClass) {
    return (
      <div className="page-wrapper min-h-screen" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
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
        {/* Navbar */}
        <nav className="navbar" style={{ position: 'relative', zIndex: 2 }}>
          <div className="navbar-brand cursor-pointer" onClick={() => navigate('/')}>
            📚 Smart Class
          </div>
          <ul className="navbar-items">
            <li><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></li>
          </ul>
        </nav>

        <div className="container" style={{ maxWidth: '800px', marginTop: '30px', position: 'relative', zIndex: 1 }}>
          <div className="glass-card-lg text-center">
            <h1 className="text-4xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Welcome, Student! 👋</h1>
            <p className="text-secondary text-lg mb-8">Join your first classroom to get started</p>

            {/* Join Class Form */}
            <div className="glass-card mb-8">
              <h2 className="text-2xl font-semibold mb-6" style={{ fontSize: '1.8rem' }}>Join a Class</h2>
              <form onSubmit={handleJoinClass}>
                <div className="form-group mb-4">
                  <label className="form-label" style={{ fontSize: '1.1rem' }}>Enter Class Code</label>
                  <input
                    type="text"
                    placeholder="e.g., ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    className="text-center text-lg font-semibold"
                    style={{ fontSize: '1.2rem', padding: '20px' }}
                  />
                </div>

                {joinError && (
                  <div className="alert alert-error mb-4">
                    <span>⚠️</span>
                    <p>{joinError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={joinLoading || !joinCode.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: '25px',
                    cursor: joinLoading || !joinCode.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: joinLoading || !joinCode.trim() ? 0.7 : 1,
                    width: '100%',
                    marginTop: '20px'
                  }}
                >
                  {joinLoading ? 'Joining...' : 'Join Class'}
                </button>
              </form>
            </div>

            <div className="glass-card-sm">
              <p className="text-sm text-secondary">
                💡 Ask your teacher for the class code to join their classroom
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper min-h-screen" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
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
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'relative', zIndex: 2 }}>
        <div className="navbar-brand cursor-pointer" onClick={() => navigate('/')}>
          📚 Smart Class
        </div>
        <ul className="navbar-items">
          <li><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></li>
        </ul>
      </nav>

      <div className="container" style={{ maxWidth: '1200px', marginTop: '30px', position: 'relative', zIndex: 1 }}>
        <div className="glass-card-lg">
          <div className="flex-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Student Dashboard</h1>
              {classroom && (
                <div>
                  <h2 className="text-2xl font-semibold text-accent mb-2">{classroom.name}</h2>
                  <div className="flex gap-6 text-secondary">
                    <span className="badge badge-primary">Code: {classroom.classCode}</span>
                    {classroom.teacher && <span className="badge">👨‍🏫 {classroom.teacher.name || classroom.teacher.email}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Class Selector - Big Card Grid */}
          <div className="mb-8">
            <h3 className="text-3xl font-bold mb-8" style={{ fontSize: '2.2rem' }}>Your Classes ({joinedClasses.length})</h3>
            
            {joinedClasses.length === 0 ? (
              <div className="glass-card-lg text-center py-12" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '40px 20px',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
                <h2 className="text-2xl font-bold mb-4" style={{
                  color: '#c1c1c1'
                }}>No Classes Yet</h2>
                <p className="text-secondary text-lg mb-6">
                  Join a class using the class code to get started
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                {joinedClasses.map((cls) => (
                  <div 
                    key={cls._id}
                    onClick={() => navigate(`/classroom/${cls.classCode}`)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '15px',
                      padding: '28px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '300px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '3rem' }}>📚</div>
                        {cls.students && (
                          <span style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {cls.students?.length || 0} Students
                          </span>
                        )}
                      </div>
                      
                      <h3 style={{
                        fontSize: '1.6rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '12px',
                        transition: 'color 0.3s ease'
                      }}>
                        {cls.name}
                      </h3>
                      
                      <p style={{
                        color: '#c1c1c1',
                        fontSize: '1rem',
                        marginBottom: '16px',
                        minHeight: '50px'
                      }}>
                        {cls.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ fontSize: '1rem' }}>
                        <p style={{ color: '#c1c1c1', marginBottom: '4px', fontSize: '0.9rem' }}>Class Code:</p>
                        <p style={{ 
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color: '#a1d8ff',
                          fontSize: '1.2rem'
                        }}>
                          {cls.classCode}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/classroom/${cls.classCode}`);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Open →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Join New Class Section */}
            <div style={{
              marginTop: '32px',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '15px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)'
            }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'white',
                marginBottom: '16px'
              }}>Join a New Class</h4>
            <form onSubmit={handleJoinClass} className="flex gap-3" style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Enter class code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ 
                  flex: 1, 
                  minWidth: '200px', 
                  fontSize: '1rem', 
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              />
              <button
                type="submit"
                disabled={joinLoading || !joinCode.trim()}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  cursor: joinLoading || !joinCode.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  opacity: joinLoading || !joinCode.trim() ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!joinLoading && joinCode.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                }}
              >
                {joinLoading ? 'Joining...' : 'Join New'}
              </button>
            </form>
            {joinError && (
              <div className="alert alert-error mt-3">
                <span>⚠️</span>
                <p>{joinError}</p>
              </div>
            )}
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/classrooms/teacher/my-classes', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch classrooms');
                }

                const data = await response.json();
                setClassrooms(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchClassrooms();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/teacher-login');
    };

    const handleCreateClass = () => {
        navigate('/create-classroom');
    };

    if (error) return (
        <div className="page-wrapper" style={{
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
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div className="alert alert-error max-w-2xl mx-auto mt-8">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            </div>
        </div>
    );

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

            <div className="container" style={{ maxWidth: '1200px', marginTop: '40px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div className="glass-card-lg mb-12">
                    <div className="flex-between">
                        <div>
                            <h1 className="text-5xl font-bold mb-2" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>👨‍🏫 Teacher Dashboard</h1>
                            <p className="text-secondary text-lg">Manage your classrooms and engage with students</p>
                        </div>
                        <button 
                            onClick={handleCreateClass}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '18px 35px',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            ➕ Create New Class
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="loading-container">
                        <div className="loader"></div>
                    </div>
                )}

                {/* Classrooms Grid */}
                {!loading && (
                    <>
                        {classrooms.length === 0 ? (
                            <div className="glass-card-lg text-center py-16">
                                <div className="text-6xl mb-6">📭</div>
                                <h2 className="text-3xl font-bold mb-4" style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>No Classrooms Yet</h2>
                                <p className="text-secondary text-lg mb-8">
                                    Create your first classroom to get started with engaging students
                                </p>
                                <button 
                                    onClick={handleCreateClass}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '18px 35px',
                                        borderRadius: '25px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                                    }}
                                >
                                    Create  Classroom
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold mb-8" style={{ fontSize: '2.2rem' }}>Your Classrooms ({classrooms.length})</h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '24px',
                                    marginBottom: '32px'
                                }}>
                                    {classrooms.map((classroom) => (
                                        <div 
                                            key={classroom._id}
                                            className="card group"
                                            onClick={() => navigate(`/classroom/${classroom.classCode}`)}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: '15px',
                                                padding: '24px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                backdropFilter: 'blur(15px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                minHeight: '280px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-4" style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '16px'
                                            }}>
                                                <div className="text-4xl">🎓</div>
                                                <span style={{
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {classroom.students?.length || 0} Students
                                                </span>
                                            </div>
                                            
                                            <h3 className="card-title group-hover:text-accent transition-colors">
                                                {classroom.name}
                                            </h3>
                                            
                                            <p className="card-text mb-4">
                                                {classroom.description || 'No description provided'}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="text-sm" style={{ fontSize: '1.1rem' }}>
                                                    <p className="text-secondary mb-1">Class Code:</p>
                                                    <p className="font-mono font-bold text-accent">{classroom.classCode}</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/classroom/${classroom.classCode}`);
                                                    }}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '12px 24px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Open →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Stats Section */}
                <div className="mt-16 pt-12 border-t border-white/10">
                    <h3 className="text-2xl font-bold mb-8">Quick Stats</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="glass-card-sm text-center" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '30px 20px',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <div className="text-4xl mb-3">🎓</div>
                            <p className="text-3xl font-bold" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>{classrooms.length}</p>
                            <p className="text-secondary">Total Classes</p>
                        </div>
                        <div className="glass-card-sm text-center" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '30px 20px',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <div className="text-4xl mb-3">👥</div>
                            <p className="text-3xl font-bold" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {classrooms.reduce((sum, c) => sum + (c.students?.length || 0), 0)}
                            </p>
                            <p className="text-secondary">Total Students</p>
                        </div>
                        <div className="glass-card-sm text-center" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '30px 20px',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <div className="text-4xl mb-3">📊</div>
                            <p className="text-3xl font-bold" style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>Active</p>
                            <p className="text-secondary">Status</p>
                        </div>
                        <div className="glass-card-sm text-center" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '30px 20px',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <div className="text-4xl mb-3">✨</div>
                            <p className="text-3xl font-bold" style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>Premium</p>
                            <p className="text-secondary">Plan</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;

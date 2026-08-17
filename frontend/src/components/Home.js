import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      padding: '60px 20px 40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
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
      {/* Signup Button - Top Right */}
      <div style={{
        position: 'absolute',
        top: '30px',
        right: '30px',
        zIndex: 10
      }}>
        <button 
          onClick={() => navigate('/signup')}
          className="btn btn-primary"
          style={{
            padding: '12px 30px',
            fontSize: '16px'
          }}
        >
          Sign Up
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', width: '100%' }}>
          <h2 className="text-sm font-semibold mb-4" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '18px',
            letterSpacing: '1px',
            margin: '0 0 20px 0'
          }}>
            ✨ Revolutionizing Academic Attendance
          </h2>
          <h1 style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.2',
            fontSize: '4.5rem',
            fontWeight: 'bold',
            margin: '0 0 20px 0'
          }}>Smart Attendance & Lecture Companion</h1>
          <p style={{ color: '#c1c1c1', fontSize: '22px', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto' }}>A comprehensive MERN-stack solution for proxy-resistant attendance,<br/>lecture resource management, and academic engagement tracking.</p>
        </div>

        {/* Student & Teacher Login Buttons - Centered */}
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
          {/* Student Login Button */}
          <button 
            onClick={() => navigate('/student-login')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '50px 45px',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              width: '320px',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '4.5rem', marginBottom: '15px' }}>🎓</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '15px', color: 'white', margin: '0 0 15px 0' }}>Student Login</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0', fontSize: '18px', margin: 0 }}>
              Join classes, attend lectures, and track your progress
            </p>
          </button>

          {/* Teacher Login Button */}
          <button 
            onClick={() => navigate('/teacher-login')}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              padding: '50px 45px',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              width: '320px',
              boxShadow: '0 8px 20px rgba(245, 87, 108, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '4.5rem', marginBottom: '15px' }}>👨‍🏫</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '15px', color: 'white', margin: '0 0 15px 0' }}>Teacher Login</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0', fontSize: '18px', margin: 0 }}>
              Create classes, manage attendance, and engage students
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;

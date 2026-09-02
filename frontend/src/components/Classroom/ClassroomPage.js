// src/components/Classroom/ClassroomPage.js

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';  // To access classCode from URL params
import QRAttendance from './QRAttendance';
import AttendanceDashboard from '../Attendance/AttendanceDashboard';
import CreateAnnouncement from '../TeacherDashboard/Announcement/CreateAnnouncement';
import ViewAnnouncements from '../TeacherDashboard/Announcement/ViewAnnouncements';
import SendTextMessage from '../TeacherDashboard/Announcement/SendTextMessage';
import ViewTextMessages from '../TeacherDashboard/Announcement/ViewTextMessages';
import CreateAssignment from '../TeacherDashboard/Announcement/CreateAssignment';
import ViewAssignments from '../TeacherDashboard/Announcement/ViewAssignments';
import Gradesheet from '../TeacherDashboard/Announcement/Gradesheet';
import Leaderboard from '../TeacherDashboard/Announcement/Leaderboard';
import CreatePoll from '../TeacherDashboard/Announcement/CreatePoll';
import ViewPolls from '../TeacherDashboard/Announcement/ViewPolls';
// ADD YOUR COMPONENT IMPORT ABOVE THIS LINE (see your README's "Turn it on" section)

const ClassroomPage = () => {
    const { classCode } = useParams();  // Retrieve classCode from the URL
    const [classroom, setClassroom] = useState(null);
    const [error, setError] = useState(null);  // For handling errors
    const [activeTab, setActiveTab] = useState('qr');  // Tab state for QR and Attendance
    const [userRole, setUserRole] = useState(null);  // User role (teacher or student)

    // These refs let a "Create" component tell the matching "View" component to refresh.
    // They're kept here permanently so no one has to add ref lines — just use the one your
    // component needs (or ignore the rest).
    const announcementsRef = useRef(null);  // Reference to ViewAnnouncements component
    const assignmentsRef = useRef(null);  // Reference to ViewAssignments component
    const pollsRef = useRef(null);  // Reference to ViewPolls component
    const messagesRef = useRef(null);  // Reference to ViewTextMessages component
    const marksheetRef = useRef(null);  // Reference to Gradesheet component
    const attendanceDashboardRef = useRef(null);  // Reference to AttendanceDashboard component

    useEffect(() => {
        const fetchClassroom = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/classrooms/${classCode}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(errorData.message || 'Failed to fetch classroom');
                    return;
                }

                const data = await response.json();
                setClassroom(data);  // Set classroom data
            } catch (error) {
                setError('Error fetching classroom');
            }
        };

        // Decode JWT to get user role
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                setUserRole(decoded.role);
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }

        fetchClassroom();  // Fetch classroom data on component mount
    }, [classCode]);  // Re-fetch data if classCode changes

    if (error) return <p className="text-red-600 p-4">{error}</p>;
    if (!classroom) return <p className="p-4">Loading...</p>;

    // These handlers are kept here permanently too — safe no-ops until the matching
    // ref above is actually attached to a component.
    const handleAnnouncementCreated = () => {
        if (announcementsRef.current) {
            announcementsRef.current.refreshAnnouncements();
        }
    };

    const handleAssignmentCreated = () => {
        if (assignmentsRef.current) {
            assignmentsRef.current.refreshAssignments();
        }
    };

    const handlePollCreated = () => {
        if (pollsRef.current) {
            pollsRef.current.refreshPolls();
        }
    };

    const handleMessageSent = () => {
        if (messagesRef.current) {
            messagesRef.current.refreshMessages();
        }
    };

    const handleMarksheetCreated = () => {
        if (marksheetRef.current) {
            marksheetRef.current.refreshMarksheets();
        }
    };

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
            <div className="container" style={{ maxWidth: '1400px', marginTop: '40px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                {/* Role-Based Header */}
                <div className="glass-card-lg mb-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-l-4 border-blue-600">
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`text-4xl ${userRole === 'teacher' ? '👨‍🏫' : '👨‍🎓'}`}></span>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {userRole === 'teacher' ? '👨‍🏫 Teacher Dashboard' : '👨‍🎓 Student Dashboard'}
                            </h1>
                        </div>
                        <p className="text-lg text-secondary mb-4">{classroom.name}</p>
                        <div className="flex gap-4 flex-wrap">
                            <span className="badge badge-primary">📍 Code: {classroom.classCode}</span>
                            <span className="badge badge-success">✨ Active</span>
                            <span className={`badge ${userRole === 'teacher' ? 'badge-info' : 'badge-secondary'}`}>
                                {userRole === 'teacher' ? '🎓 Instructor' : '📚 Learner'}
                            </span>
                        </div>
                    </div>
                    {classroom.details && (
                        <p className="text-secondary text-lg italic border-l-2 border-blue-400 pl-4">{classroom.details}</p>
                    )}
                </div>

                {/* Feature Button Grid */}
                <div className="mb-8">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '16px',
                        width: '100%'
                    }}>
                        <button className={`feature-tab-btn ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
                            <span className="feature-tab-icon">📱</span>
                            QR Code
                        </button>
                        <button className={`feature-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                            <span className="feature-tab-icon">✅</span>
                            Attendance
                        </button>
                        <button className={`feature-tab-btn ${activeTab === 'announcement' ? 'active' : ''}`} onClick={() => setActiveTab('announcement')}>
                            <span className="feature-tab-icon">📢</span>
                            Announcement
                        </button>
                        <button className={`feature-tab-btn ${activeTab === 'text-message' ? 'active' : ''}`} onClick={() => setActiveTab('text-message')}>
                            <span className="feature-tab-icon">💬</span>
                            Messages
                        </button>
                        <button className={`feature-tab-btn ${activeTab === 'assignment' ? 'active' : ''}`} onClick={() => setActiveTab('assignment')}>
                            <span className="feature-tab-icon">✏️</span>
                            Assignment
                        </button>
                        <button className={`feature-tab-btn ${activeTab === 'marksheet' ? 'active' : ''}`} onClick={() => setActiveTab('marksheet')}>
                            <span className="feature-tab-icon">📊</span>
                            Gradesheet
                        </button>
                        <button className={`feature-tab-btn ${activeTab === 'poll' ? 'active' : ''}`} onClick={() => setActiveTab('poll')}>
                            <span className="feature-tab-icon">📊</span>
                            Poll
                        </button>
                        <button className={`feature-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
                            <span className="feature-tab-icon">🏆</span>
                            Leaderboard
                        </button>
                        {/* ADD YOUR <button> BLOCK(S) ABOVE THIS LINE (see your README's "Turn it on" section) */}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="glass-card-lg">
                    {activeTab === 'qr' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <QRAttendance classCode={classroom.classCode} userRole={userRole} onQRScanned={() => {
                                if (attendanceDashboardRef.current) {
                                    attendanceDashboardRef.current.refreshAttendance();
                                }
                            }} />
                        </div>
                    )}
                    {activeTab === 'attendance' && (
                        <div>
                            <AttendanceDashboard ref={attendanceDashboardRef} classCode={classroom.classCode} />
                        </div>
                    )}
                    {activeTab === 'announcement' && (
                        <div className="space-y-8">
                            {userRole === 'teacher' && (
                                <div>
                                    <h3 className="text-2xl font-bold mb-6">📢 Create Announcement</h3>
                                    <CreateAnnouncement classCode={classroom.classCode} onAnnouncementCreated={handleAnnouncementCreated} />
                                </div>
                            )}
                            <div className={userRole === 'teacher' ? 'border-t border-white/20 pt-8' : ''}>
                                <h3 className="text-2xl font-bold mb-6">📌 Recent Announcements</h3>
                                <ViewAnnouncements ref={announcementsRef} classCode={classroom.classCode} userRole={userRole} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'text-message' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold mb-6">💬 Send Message</h3>
                                <SendTextMessage classCode={classroom.classCode} teacherId="teacher-id" onMessageSent={handleMessageSent} userRole={userRole} />
                            </div>
                            <div className="border-t border-white/20 pt-8">
                                <h3 className="text-2xl font-bold mb-6">📬 Message History</h3>
                                <ViewTextMessages ref={messagesRef} classCode={classroom.classCode} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'assignment' && (
                        <div className="space-y-8">
                            {userRole === 'teacher' && (
                                <div>
                                    <h3 className="text-2xl font-bold mb-6">✏️ Create Assignment</h3>
                                    <CreateAssignment classCode={classroom.classCode} onAssignmentCreated={handleAssignmentCreated} />
                                </div>
                            )}
                            <div className={userRole === 'teacher' ? 'border-t border-white/20 pt-8' : ''}>
                                <h3 className="text-2xl font-bold mb-6">📚 View Assignments</h3>
                                <ViewAssignments ref={assignmentsRef} classCode={classroom.classCode} userRole={userRole} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'marksheet' && (
                        <div className="space-y-8">
                            <Gradesheet ref={marksheetRef} classCode={classroom.classCode} userRole={userRole} />
                        </div>
                    )}
                    {activeTab === 'poll' && (
                        <div className="space-y-8">
                            {userRole === 'teacher' && (
                                <div>
                                    <h3 className="text-2xl font-bold mb-6">📊 Create Poll</h3>
                                    <CreatePoll classCode={classroom.classCode} onPollCreated={handlePollCreated} />
                                </div>
                            )}
                            <div className={userRole === 'teacher' ? 'border-t border-white/20 pt-8' : ''}>
                                <h3 className="text-2xl font-bold mb-6">📈 View Polls</h3>
                                <ViewPolls ref={pollsRef} classCode={classroom.classCode} userRole={userRole} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'leaderboard' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">🏆 Leaderboard</h2>
                            <p className="text-secondary mb-6">{userRole === 'teacher' ? 'Manage' : 'View'} student rankings</p>
                            <Leaderboard classCode={classroom.classCode} userRole={userRole} />
                        </div>
                    )}
                    {/* ADD YOUR {activeTab === '...' && (...)} BLOCK(S) ABOVE THIS LINE (see your README's "Turn it on" section) */}
                </div>
            </div>
        </div>
    );
};

export default ClassroomPage;

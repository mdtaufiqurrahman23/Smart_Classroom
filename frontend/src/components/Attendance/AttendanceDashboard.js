// src/components/Attendance/AttendanceDashboard.js

import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import axios from 'axios';

const AttendanceDashboard = forwardRef(({ classCode, userRole: propUserRole }, ref) => {
    const [students, setStudents] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(propUserRole || localStorage.getItem('role') || null);
    const [currentUser, setCurrentUser] = useState(null);
    const [rawAttendanceRecords, setRawAttendanceRecords] = useState([]);
    const [dateRange, setDateRange] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [qrScannedStudents, setQrScannedStudents] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [studentStatusFilter, setStudentStatusFilter] = useState('all');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [activeDateForBulk, setActiveDateForBulk] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
        refreshAttendance: () => {
            console.log('🔄 Refreshing attendance data after QR scan...');
            fetchQRScans();
            if (dateRange.length > 0) {
                fetchExistingAttendanceFromDB(dateRange);
            } else {
                autoLoadExistingAttendance();
            }
        }
    }));

    useEffect(() => {
        // Decode JWT to get user role and details
        if (propUserRole) {
            setUserRole(propUserRole);
        }

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                if (!propUserRole && decoded.role) {
                    setUserRole(decoded.role);
                }
                setCurrentUser(decoded);
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }

        fetchStudents();
        fetchQRScans();
        autoLoadExistingAttendance();
        
        // Restore saved start date from localStorage (teacher only)
        const savedStartDate = localStorage.getItem(`attendance_startDate_${classCode}`);
        if (savedStartDate) {
            setStartDate(savedStartDate);
            const dates = [];
            const startDateObj = new Date(savedStartDate);
            for (let i = 0; i < 30; i++) {
                const currentDate = new Date(startDateObj);
                currentDate.setDate(currentDate.getDate() + i);
                dates.push(currentDate.toISOString().split('T')[0]);
            }
            setDateRange(dates);
            if (dates.length > 0 && !activeDateForBulk) {
                setActiveDateForBulk(dates[0]);
            }
            setTimeout(() => fetchExistingAttendance(dates), 500);
        }
    }, [classCode, propUserRole]);

    useEffect(() => {
        if (dateRange.length > 0 && !activeDateForBulk) {
            setActiveDateForBulk(dateRange[0]);
        }
    }, [dateRange]);

    const autoLoadExistingAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const existingRecords = response.data || [];
            setRawAttendanceRecords(existingRecords);

            if (existingRecords.length > 0) {
                const uniqueDates = [...new Set(existingRecords.map(record => 
                    new Date(record.date).toISOString().split('T')[0]
                ))].sort();

                if (uniqueDates.length > 0) {
                    setDateRange(uniqueDates);
                    setActiveDateForBulk(uniqueDates[uniqueDates.length - 1]);
                    
                    const newAttendance = {};
                    students.forEach(student => {
                        newAttendance[student._id] = {};
                        uniqueDates.forEach(date => {
                            const record = existingRecords.find(
                                r => r.studentId === student._id && 
                                    new Date(r.date).toISOString().split('T')[0] === date
                            );
                            newAttendance[student._id][date] = record 
                                ? (record.status === 'Present' ? 'present' : 'absent')
                                : 'present';
                        });
                    });
                    setAttendance(newAttendance);
                }
            }
        } catch (err) {
            console.error('Error auto-loading attendance:', err);
        }
    };

    const fetchQRScans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const todayScans = (response.data || []).filter(record => {
                const recordDate = new Date(record.date).toLocaleDateString();
                const today = new Date().toLocaleDateString();
                return recordDate === today && record.sessionId;
            });
            setQrScannedStudents(new Set(todayScans.map(record => record.studentId)));
        } catch (err) {
            console.error('Error fetching QR scans:', err);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/classrooms/${classCode}`);
            const classroom = response.data;
            setStudents(classroom.students || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to fetch classroom students');
        } finally {
            setLoading(false);
        }
    };

    const handleStartDateChange = (e) => {
        const date = e.target.value;
        setStartDate(date);
        
        if (date) {
            localStorage.setItem(`attendance_startDate_${classCode}`, date);
            const dates = [];
            const startDateObj = new Date(date);
            
            for (let i = 0; i < 30; i++) {
                const currentDate = new Date(startDateObj);
                currentDate.setDate(currentDate.getDate() + i);
                dates.push(currentDate.toISOString().split('T')[0]);
            }
            
            setDateRange(dates);
            setActiveDateForBulk(dates[0]);
            initializeAttendance(dates);
            fetchExistingAttendance(dates);
            showToast(`Generated 30 days attendance sheet starting from ${date}`, 'info');
        }
    };

    const fetchExistingAttendanceFromDB = async (dates) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const existingRecords = response.data || [];
            setRawAttendanceRecords(existingRecords);

            const newAttendance = {};
            students.forEach(student => {
                newAttendance[student._id] = {};
                dates.forEach(date => {
                    const existingRecord = existingRecords.find(
                        record => 
                            record.studentId === student._id && 
                            new Date(record.date).toISOString().split('T')[0] === date
                    );
                    newAttendance[student._id][date] = existingRecord 
                        ? (existingRecord.status === 'Present' ? 'present' : 'absent')
                        : 'present';
                });
            });
            setAttendance(newAttendance);
        } catch (err) {
            console.error('Error fetching existing attendance from DB:', err);
        }
    };

    const fetchExistingAttendance = async (dates) => {
        try {
            const cachedAttendance = localStorage.getItem(`attendance_data_${classCode}`);
            if (cachedAttendance) {
                setAttendance(JSON.parse(cachedAttendance));
                return;
            }
            
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const existingRecords = response.data || [];
            setRawAttendanceRecords(existingRecords);

            const newAttendance = {};
            students.forEach(student => {
                newAttendance[student._id] = {};
                dates.forEach(date => {
                    const existingRecord = existingRecords.find(
                        record => 
                            record.studentId === student._id && 
                            new Date(record.date).toISOString().split('T')[0] === date
                    );
                    newAttendance[student._id][date] = existingRecord 
                        ? (existingRecord.status === 'Present' ? 'present' : 'absent')
                        : 'present';
                });
            });
            setAttendance(newAttendance);
        } catch (err) {
            console.error('Error fetching existing attendance:', err);
        }
    };

    const initializeAttendance = (dates) => {
        const newAttendance = {};
        students.forEach(student => {
            newAttendance[student._id] = {};
            dates.forEach(date => {
                newAttendance[student._id][date] = 'present';
            });
        });
        setAttendance(newAttendance);
    };

    const handleToggleAttendance = (studentId, date) => {
        if (userRole !== 'teacher') return;
        const currentStatus = attendance[studentId]?.[date] || 'present';
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';

        const updatedAttendance = {
            ...attendance,
            [studentId]: {
                ...attendance[studentId],
                [date]: newStatus,
            },
        };
        setAttendance(updatedAttendance);
        localStorage.setItem(`attendance_data_${classCode}`, JSON.stringify(updatedAttendance));
    };

    const handleBulkMark = (targetDate, statusToSet) => {
        if (!targetDate || userRole !== 'teacher') return;
        const updatedAttendance = { ...attendance };
        students.forEach(student => {
            if (!updatedAttendance[student._id]) {
                updatedAttendance[student._id] = {};
            }
            updatedAttendance[student._id][targetDate] = statusToSet;
        });
        setAttendance(updatedAttendance);
        localStorage.setItem(`attendance_data_${classCode}`, JSON.stringify(updatedAttendance));
        showToast(`Marked all students as ${statusToSet.toUpperCase()} for ${targetDate}`, 'info');
    };

    const handleDeleteDate = (dateToDelete) => {
        if (window.confirm(`Are you sure you want to remove column for ${dateToDelete}?`)) {
            const newDateRange = dateRange.filter(date => date !== dateToDelete);
            setDateRange(newDateDate => newDateDate !== dateToDelete);
            if (activeDateForBulk === dateToDelete && newDateRange.length > 0) {
                setActiveDateForBulk(newDateRange[0]);
            }

            const newAttendance = { ...attendance };
            Object.keys(newAttendance).forEach(studentId => {
                delete newAttendance[studentId][dateToDelete];
            });
            setAttendance(newAttendance);
            showToast(`Removed date ${dateToDelete}`, 'info');
        }
    };

    const handleSaveAttendance = async () => {
        try {
            setIsSaving(true);
            const attendanceData = [];
            Object.keys(attendance).forEach(studentId => {
                const studentObj = students.find(s => s._id === studentId);
                const studentName = studentObj?.name || studentObj?.email || 'Student';
                Object.keys(attendance[studentId]).forEach(date => {
                    attendanceData.push({
                        studentId,
                        name: studentName,
                        studentName: studentName,
                        classCode,
                        date,
                        status: attendance[studentId][date] === 'present' ? 'Present' : 'Absent',
                    });
                });
            });

            const token = localStorage.getItem('token');
            const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

            await axios.post(`http://localhost:5000/api/attendance/bulk-save`, {
                classCode,
                attendanceData,
            }, config);

            localStorage.removeItem(`attendance_data_${classCode}`);
            showToast('✅ Attendance saved successfully to database!', 'success');
        } catch (err) {
            console.error('Error saving attendance:', err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to save attendance';
            showToast(`❌ ${errMsg}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Current student information
    const currentStudentInfo = useMemo(() => {
        const currentId = currentUser?.id || currentUser?._id;
        const currentEmail = currentUser?.email?.toLowerCase();
        return students.find(s => 
            s._id === currentId || (currentEmail && s.email?.toLowerCase() === currentEmail)
        ) || {
            name: currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Student'),
            email: currentUser?.email,
            studentId: currentUser?.studentId || ''
        };
    }, [students, currentUser]);

    // Compute student's personal attendance history
    const myAttendanceRecords = useMemo(() => {
        if (!rawAttendanceRecords || rawAttendanceRecords.length === 0) return [];

        const currentId = currentUser?.id || currentUser?._id;
        const currentEmail = currentUser?.email?.toLowerCase();
        const matchedStudent = students.find(s => 
            s._id === currentId || (currentEmail && s.email?.toLowerCase() === currentEmail)
        );
        const myId = currentId || matchedStudent?._id;
        const myName = matchedStudent?.name;
        const myStudentId = matchedStudent?.studentId;

        // Filter records matching this student
        const filtered = rawAttendanceRecords.filter(record => {
            if (myId && (record.studentId === myId || record.studentId === myId.toString())) return true;
            if (myStudentId && record.studentId === myStudentId) return true;
            if (myName && record.name === myName) return true;
            if (currentEmail && (record.name === currentEmail || record.email === currentEmail)) return true;
            // Fallback if backend strictly returned records for this student
            if (userRole === 'student' && rawAttendanceRecords.length > 0 && !rawAttendanceRecords.some(r => r.name !== record.name && r.studentId !== record.studentId)) {
                return true;
            }
            return false;
        });

        // Deduplicate records by date (keep latest)
        const dateMap = new Map();
        filtered.forEach(record => {
            const dKey = new Date(record.date).toISOString().split('T')[0];
            if (!dateMap.has(dKey)) {
                dateMap.set(dKey, record);
            }
        });

        return Array.from(dateMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [rawAttendanceRecords, currentUser, students, userRole]);

    // Student Analytics
    const studentAnalytics = useMemo(() => {
        const total = myAttendanceRecords.length;
        const presentCount = myAttendanceRecords.filter(r => (r.status || '').toLowerCase() === 'present').length;
        const absentCount = myAttendanceRecords.filter(r => (r.status || '').toLowerCase() === 'absent').length;
        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 100;

        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = myAttendanceRecords.find(r => 
            new Date(r.date).toISOString().split('T')[0] === todayStr
        );

        const myId = currentUser?.id || currentUser?._id;
        const isQrScannedToday = myId ? qrScannedStudents.has(myId) : false;

        return {
            total,
            presentCount,
            absentCount,
            rate,
            todayRecord,
            isQrScannedToday
        };
    }, [myAttendanceRecords, currentUser, qrScannedStudents]);

    // Filtered records for student view
    const filteredStudentRecords = useMemo(() => {
        return myAttendanceRecords.filter(record => {
            const status = (record.status || '').toLowerCase();
            if (studentStatusFilter === 'present' && status !== 'present') return false;
            if (studentStatusFilter === 'absent' && status !== 'absent') return false;

            if (studentSearchTerm.trim()) {
                const q = studentSearchTerm.toLowerCase();
                const d = new Date(record.date);
                const dStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'long' }).toLowerCase();
                if (!dStr.includes(q)) return false;
            }
            return true;
        });
    }, [myAttendanceRecords, studentStatusFilter, studentSearchTerm]);

    // Filtered students for teacher search query
    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s => 
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.studentId && s.studentId.toLowerCase().includes(q))
        );
    }, [students, searchQuery]);

    // Teacher Attendance analytics metrics
    const analytics = useMemo(() => {
        if (!students.length || !dateRange.length) return null;

        let totalRecords = 0;
        let presentRecords = 0;

        const studentStats = students.map(student => {
            let sPresent = 0;
            const sTotal = dateRange.length;
            dateRange.forEach(date => {
                const st = attendance[student._id]?.[date] || 'present';
                if (st === 'present') sPresent++;
            });
            totalRecords += sTotal;
            presentRecords += sPresent;
            const pct = sTotal > 0 ? Math.round((sPresent / sTotal) * 100) : 100;
            return { studentId: student._id, presentCount: sPresent, totalCount: sTotal, percentage: pct };
        });

        const overallPct = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
        const qrScannedCount = qrScannedStudents.size;

        return {
            overallPct,
            totalStudents: students.length,
            trackedDaysCount: dateRange.length,
            qrScannedCount,
            studentStatsMap: Object.fromEntries(studentStats.map(s => [s.studentId, s]))
        };
    }, [students, dateRange, attendance, qrScannedStudents]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px', color: '#94a3b8' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>Loading attendance records...</p>
        </div>
    );

    if (error) return (
        <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
                <h4 style={{ fontWeight: 'bold' }}>Error loading attendance</h4>
                <p style={{ fontSize: '13px', opacity: 0.9 }}>{error}</p>
            </div>
        </div>
    );

    // ==========================================
    // STUDENT VIEW: ONLY PERSONAL ATTENDANCE HISTORY
    // ==========================================
    if (userRole === 'student') {
        return (
            <div className="att-workspace">
                {/* Toast Notification */}
                {toast.show && (
                    <div style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 9999,
                        padding: '16px 20px',
                        borderRadius: '14px',
                        background: toast.type === 'error' ? 'rgba(136, 19, 55, 0.95)' : toast.type === 'info' ? 'rgba(12, 74, 110, 0.95)' : 'rgba(6, 78, 59, 0.95)',
                        border: `1px solid ${toast.type === 'error' ? 'rgba(244, 63, 94, 0.5)' : toast.type === 'info' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                        backdropFilter: 'blur(12px)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                        fontSize: '14px',
                        fontWeight: 600
                    }}>
                        <span style={{ fontSize: '18px' }}>
                            {toast.type === 'error' ? '🚫' : toast.type === 'info' ? 'ℹ️' : '✅'}
                        </span>
                        <span>{toast.message}</span>
                    </div>
                )}

                {/* Student Personal Banner */}
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
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)'
                        }}>
                            🎓
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                                    {currentStudentInfo?.name || currentUser?.email || 'My Attendance History'}
                                </h2>
                                <span className="att-stat-badge att-badge-excellent">
                                    Student View • Personal History
                                </span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                Class: <strong style={{ color: '#e2e8f0' }}>{classCode}</strong>
                                {currentStudentInfo?.studentId && (
                                    <> • Student ID: <strong style={{ color: '#e2e8f0' }}>{currentStudentInfo.studentId}</strong></>
                                )}
                                {currentStudentInfo?.email && (
                                    <> • Email: <strong style={{ color: '#e2e8f0' }}>{currentStudentInfo.email}</strong></>
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="att-btn att-btn-secondary"
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            padding: '10px 18px',
                            borderRadius: '12px'
                        }}
                    >
                        <span>🖨️</span>
                        <span>Print My History</span>
                    </button>
                </div>

                {/* Personal Analytics Grid */}
                <div className="att-stats-grid">
                    {/* Card 1: Attendance Rate */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>My Attendance Rate</span>
                            <span style={{ fontSize: '20px' }}>📈</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span className="att-stat-value">{studentAnalytics.rate}%</span>
                            <span className={`att-stat-badge ${
                                studentAnalytics.rate >= 85 ? 'att-badge-excellent' : studentAnalytics.rate >= 75 ? 'att-badge-good' : 'att-badge-warning'
                            }`}>
                                {studentAnalytics.rate >= 85 ? 'Excellent' : studentAnalytics.rate >= 75 ? 'Good' : 'Needs Review'}
                            </span>
                        </div>
                        <div className="att-progress-track" style={{ width: '100%', marginTop: '12px' }}>
                            <div 
                                className="att-progress-bar"
                                style={{ 
                                    width: `${studentAnalytics.rate}%`,
                                    background: studentAnalytics.rate >= 85 ? '#10b981' : studentAnalytics.rate >= 75 ? '#f59e0b' : '#f43f5e'
                                }} 
                            />
                        </div>
                    </div>

                    {/* Card 2: Classes Attended */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>Classes Attended</span>
                            <span style={{ fontSize: '20px' }}>✅</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span className="att-stat-value" style={{ color: '#34d399' }}>{studentAnalytics.presentCount}</span>
                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {studentAnalytics.total} sessions</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                            Verified attendance record
                        </p>
                    </div>

                    {/* Card 3: Classes Missed */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>Classes Missed</span>
                            <span style={{ fontSize: '20px' }}>⚠️</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span className="att-stat-value" style={{ color: studentAnalytics.absentCount > 0 ? '#fda4af' : '#94a3b8' }}>
                                {studentAnalytics.absentCount}
                            </span>
                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>sessions</span>
                        </div>
                        <p style={{ fontSize: '12px', color: studentAnalytics.absentCount > 0 ? '#fda4af' : '#34d399', marginTop: '6px' }}>
                            {studentAnalytics.absentCount === 0 ? '✓ Perfect attendance record!' : 'Unexcused absences'}
                        </p>
                    </div>

                    {/* Card 4: Today's Status */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>Today's Status</span>
                            <span style={{ fontSize: '20px' }}>📱</span>
                        </div>
                        <div>
                            {studentAnalytics.todayRecord ? (
                                (studentAnalytics.todayRecord.status || '').toLowerCase() === 'present' ? (
                                    <span className="att-stat-badge att-badge-excellent" style={{ fontSize: '13px', padding: '6px 12px' }}>
                                        ✓ Present Today
                                    </span>
                                ) : (
                                    <span className="att-stat-badge att-badge-warning" style={{ fontSize: '13px', padding: '6px 12px' }}>
                                        ✗ Marked Absent
                                    </span>
                                )
                            ) : studentAnalytics.isQrScannedToday ? (
                                <span className="att-stat-badge att-badge-excellent" style={{ fontSize: '13px', padding: '6px 12px' }}>
                                    ✓ QR Scanned (Present)
                                </span>
                            ) : (
                                <span className="att-stat-badge att-badge-good" style={{ fontSize: '13px', padding: '6px 12px' }}>
                                    ⏳ Pending Check-In
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                            {studentAnalytics.todayRecord?.sessionId ? 'Verified via QR scanner' : studentAnalytics.todayRecord ? 'Marked by instructor' : 'Scan live class QR to mark attendance'}
                        </p>
                    </div>
                </div>

                {/* Personal Attendance History Table */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📜</span>
                                <span>My Attendance History ({filteredStudentRecords.length} Sessions)</span>
                            </h3>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                View your individual attendance records across all lectures
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            {/* Filter by Status */}
                            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <button
                                    onClick={() => setStudentStatusFilter('all')}
                                    style={{
                                        background: studentStatusFilter === 'all' ? '#3b82f6' : 'transparent',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    All ({studentAnalytics.total})
                                </button>
                                <button
                                    onClick={() => setStudentStatusFilter('present')}
                                    style={{
                                        background: studentStatusFilter === 'present' ? '#10b981' : 'transparent',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Present ({studentAnalytics.presentCount})
                                </button>
                                <button
                                    onClick={() => setStudentStatusFilter('absent')}
                                    style={{
                                        background: studentStatusFilter === 'absent' ? '#f43f5e' : 'transparent',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Absent ({studentAnalytics.absentCount})
                                </button>
                            </div>

                            {/* Search filter */}
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Filter by date..."
                                    value={studentSearchTerm}
                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.8)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '10px',
                                        padding: '6px 12px 6px 30px',
                                        color: '#fff',
                                        fontSize: '12px',
                                        outline: 'none'
                                    }}
                                />
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>
                                    🔍
                                </span>
                            </div>
                        </div>
                    </div>

                    {filteredStudentRecords.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📅</span>
                            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                                No Attendance Records Found
                            </h4>
                            <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
                                {studentSearchTerm || studentStatusFilter !== 'all'
                                    ? 'No records match the selected filter or search keyword.'
                                    : 'No attendance records have been registered for your account in this class yet.'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="att-table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '160px' }}>Session Date</th>
                                        <th style={{ minWidth: '130px' }}>Day of Week</th>
                                        <th style={{ minWidth: '130px', textAlign: 'center' }}>Status</th>
                                        <th style={{ minWidth: '180px' }}>Verification Method</th>
                                        <th style={{ minWidth: '130px' }}>Recorded At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudentRecords.map((record, index) => {
                                        const isPresent = (record.status || '').toLowerCase() === 'present';
                                        const d = new Date(record.date);
                                        const ts = record.timestamp ? new Date(record.timestamp) : d;
                                        return (
                                            <tr key={record._id || index}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '16px' }}>📅</span>
                                                        <span style={{ fontWeight: 600, color: '#fff' }}>
                                                            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                                                        {d.toLocaleDateString('en-US', { weekday: 'long' })}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`att-pill ${isPresent ? 'att-pill-present' : 'att-pill-absent'}`} style={{ cursor: 'default' }}>
                                                        <span>{isPresent ? '✓' : '✗'}</span>
                                                        <span>{isPresent ? 'Present' : 'Absent'}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: record.sessionId ? '#34d399' : '#94a3b8'
                                                    }}>
                                                        <span>{record.sessionId ? '📱' : '📋'}</span>
                                                        <span>{record.sessionId ? 'Mobile QR Check-in' : 'Instructor Roll Call'}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                                                        {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // TEACHER VIEW: FULL ATTENDANCE MANAGEMENT
    // ==========================================
    return (
        <div className="att-workspace">
            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    padding: '16px 20px',
                    borderRadius: '14px',
                    background: toast.type === 'error' ? 'rgba(136, 19, 55, 0.95)' : toast.type === 'info' ? 'rgba(12, 74, 110, 0.95)' : 'rgba(6, 78, 59, 0.95)',
                    border: `1px solid ${toast.type === 'error' ? 'rgba(244, 63, 94, 0.5)' : toast.type === 'info' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                    backdropFilter: 'blur(12px)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    <span style={{ fontSize: '18px' }}>
                        {toast.type === 'error' ? '🚫' : toast.type === 'info' ? 'ℹ️' : '✅'}
                    </span>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Top Overview & Analytics Header */}
            {analytics && (
                <div className="att-stats-grid">
                    {/* Class Overall Attendance */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>Class Overall Attendance</span>
                            <span style={{ fontSize: '20px' }}>📊</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span className="att-stat-value">{analytics.overallPct}%</span>
                            <span className={`att-stat-badge ${
                                analytics.overallPct >= 85 ? 'att-badge-excellent' : analytics.overallPct >= 75 ? 'att-badge-good' : 'att-badge-warning'
                            }`}>
                                {analytics.overallPct >= 85 ? 'Excellent' : analytics.overallPct >= 75 ? 'Good' : 'Needs Review'}
                            </span>
                        </div>
                        <div className="att-progress-track" style={{ width: '100%', marginTop: '12px' }}>
                            <div 
                                className="att-progress-bar"
                                style={{ 
                                    width: `${analytics.overallPct}%`,
                                    background: analytics.overallPct >= 85 ? '#10b981' : analytics.overallPct >= 75 ? '#f59e0b' : '#f43f5e'
                                }} 
                            />
                        </div>
                    </div>

                    {/* Total Enrolled Students */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>Total Enrolled Students</span>
                            <span style={{ fontSize: '20px' }}>🎓</span>
                        </div>
                        <div className="att-stat-value">{analytics.totalStudents}</div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                            Tracked across {analytics.trackedDaysCount} session dates
                        </p>
                    </div>

                    {/* Today QR Code Scans */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>Today's QR Code Scans</span>
                            <span style={{ fontSize: '20px' }}>📱</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span className="att-stat-value" style={{ color: '#34d399' }}>{analytics.qrScannedCount}</span>
                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {analytics.totalStudents} scanned</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#34d399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Live QR Sync Active
                        </p>
                    </div>

                    {/* Quick Save Card */}
                    <div className="att-stat-card">
                        <div className="att-stat-header">
                            <span>Quick Action Mode</span>
                            <span style={{ fontSize: '20px' }}>⚡</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>
                            Click cell pills to toggle status
                        </div>
                        <button
                            onClick={handleSaveAttendance}
                            disabled={isSaving}
                            className="att-btn att-btn-primary"
                            style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                        >
                            {isSaving ? '⏳ Saving...' : '💾 Save All Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* Today QR Scan Live Panel */}
            {qrScannedStudents.size > 0 && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '16px',
                    padding: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>📱</span>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Live QR Scan Activity (Today)</h3>
                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Students who checked in using mobile QR code</p>
                            </div>
                        </div>
                        <span className="att-stat-badge att-badge-excellent">
                            {qrScannedStudents.size} Checked In
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {students.map((student) => {
                            const isScanned = qrScannedStudents.has(student._id);
                            return (
                                <div 
                                    key={student._id}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background: isScanned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                                        border: `1px solid ${isScanned ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: isScanned ? '#34d399' : '#94a3b8' }}>
                                        {student.name || student.email}
                                    </span>
                                    <span className={`att-stat-badge ${isScanned ? 'att-badge-excellent' : 'att-badge-warning'}`}>
                                        {isScanned ? '✓ Scanned' : '✗ Pending'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Teacher Toolbar & Controls */}
            <div className="att-toolbar">
                <div className="att-toolbar-row">
                    {/* Left: Start Date Picker (Teacher only) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📅</span>
                            <span>Attendance Start Date:</span>
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            style={{
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                        {startDate && (
                            <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 500 }}>
                                Tracking 30 days from {new Date(startDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Right: Search Filter */}
                    <div className="att-search-box">
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="att-search-input"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Teacher Bulk Actions */}
                {dateRange.length > 0 && (
                    <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Bulk Actions:</span>
                            <select
                                value={activeDateForBulk}
                                onChange={(e) => setActiveDateForBulk(e.target.value)}
                                style={{
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    outline: 'none'
                                }}
                            >
                                {dateRange.map(d => (
                                    <option key={d} value={d}>
                                        {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => handleBulkMark(activeDateForBulk, 'present')}
                                className="att-btn att-btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                                <span>✓ Mark All Present</span>
                            </button>

                            <button
                                onClick={() => handleBulkMark(activeDateForBulk, 'absent')}
                                className="att-btn att-btn-danger"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                                <span>✗ Mark All Absent</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                            <button
                                onClick={handleSaveAttendance}
                                disabled={isSaving}
                                className="att-btn att-btn-primary"
                            >
                                {isSaving ? '⏳ Saving...' : '💾 Save Attendance'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="att-btn att-btn-secondary"
                            >
                                <span>🖨️</span>
                                <span>Print</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Attendance Matrix Table */}
            {dateRange.length > 0 ? (
                <div className="att-table-container">
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📋</span>
                            <span>Attendance Matrix ({filteredStudents.length} Students)</span>
                        </h3>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            💡 Click any status pill to toggle Present/Absent
                        </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '220px' }}>Student Info</th>
                                    <th style={{ minWidth: '120px', textAlign: 'center' }}>Overall Stats</th>
                                    {dateRange.map((date) => (
                                        <th key={date} style={{ minWidth: '105px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <span style={{ color: '#fff' }}>
                                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>
                                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteDate(date)}
                                                    style={{
                                                        marginTop: '4px',
                                                        background: 'rgba(244, 63, 94, 0.8)',
                                                        border: 'none',
                                                        color: '#fff',
                                                        borderRadius: '50%',
                                                        width: '16px',
                                                        height: '16px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Delete column"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={dateRange.length + 2} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                            No students found matching "{searchQuery}"
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const sStats = analytics?.studentStatsMap[student._id];
                                        const pct = sStats ? sStats.percentage : 100;

                                        return (
                                            <tr key={student._id}>
                                                {/* Student Name */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '34px',
                                                            height: '34px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                                                            color: '#fff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            fontSize: '13px',
                                                            flexShrink: 0
                                                        }}>
                                                            {(student.name || student.email || 'S')[0].toUpperCase()}
                                                        </div>
                                                        <div style={{ overflow: 'hidden' }}>
                                                            <div style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {student.name || 'Student'}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {student.email || student.studentId || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Attendance Progress Column */}
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <span className={`att-stat-badge ${
                                                            pct >= 85 ? 'att-badge-excellent' : pct >= 75 ? 'att-badge-good' : 'att-badge-warning'
                                                        }`}>
                                                            {pct}%
                                                        </span>
                                                        <div className="att-progress-track">
                                                            <div 
                                                                className="att-progress-bar"
                                                                style={{ 
                                                                    width: `${pct}%`,
                                                                    background: pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e'
                                                                }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Date Status Cells */}
                                                {dateRange.map((date) => {
                                                    const isPresent = (attendance[student._id]?.[date] || 'present') === 'present';
                                                    return (
                                                        <td key={date} style={{ textAlign: 'center' }}>
                                                            <button
                                                                onClick={() => handleToggleAttendance(student._id, date)}
                                                                className={`att-pill ${isPresent ? 'att-pill-present' : 'att-pill-absent'}`}
                                                            >
                                                                <span>{isPresent ? '✓' : '✗'}</span>
                                                                <span>{isPresent ? 'Present' : 'Absent'}</span>
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{
                    padding: '32px',
                    borderRadius: '16px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                }}>
                    <span style={{ fontSize: '32px' }}>📅</span>
                    <div>
                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fef3c7' }}>No Attendance Starting Date Configured</h4>
                        <p style={{ fontSize: '14px', marginTop: '6px', opacity: 0.9 }}>
                            Please select a starting date using the date selector above to generate the 30-day attendance matrix.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AttendanceDashboard;

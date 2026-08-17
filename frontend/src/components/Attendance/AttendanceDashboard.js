// src/components/Attendance/AttendanceDashboard.js

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const AttendanceDashboard = forwardRef(({ classCode }, ref) => {
    const [students, setStudents] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [dateRange, setDateRange] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [qrScannedStudents, setQrScannedStudents] = useState(new Set());

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
        refreshAttendance: () => {
            console.log('🔄 Refreshing attendance data after QR scan...');
            fetchQRScans();
            if (dateRange.length > 0) {
                // Refresh from database, don't use cache
                fetchExistingAttendanceFromDB(dateRange);
            } else {
                autoLoadExistingAttendance();
            }
        }
    }));

    useEffect(() => {
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

        fetchStudents();
        fetchQRScans();
        
        // Auto-load existing attendance records
        autoLoadExistingAttendance();
        
        // Restore saved start date from localStorage
        const savedStartDate = localStorage.getItem(`attendance_startDate_${classCode}`);
        if (savedStartDate) {
            setStartDate(savedStartDate);
            // Regenerate date range
            const dates = [];
            const startDateObj = new Date(savedStartDate);
            for (let i = 0; i < 30; i++) {
                const currentDate = new Date(startDateObj);
                currentDate.setDate(currentDate.getDate() + i);
                dates.push(currentDate.toISOString().split('T')[0]);
            }
            setDateRange(dates);
            // Fetch existing attendance for the restored date range
            setTimeout(() => fetchExistingAttendance(dates), 500);
        }
    }, [classCode]);

    const autoLoadExistingAttendance = async () => {
        try {
            // Fetch all attendance records for this classroom
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const existingRecords = response.data;

            if (existingRecords && existingRecords.length > 0) {
                // Extract unique dates from the records
                const uniqueDates = [...new Set(existingRecords.map(record => 
                    new Date(record.date).toISOString().split('T')[0]
                ))].sort();

                if (uniqueDates.length > 0) {
                    setDateRange(uniqueDates);
                    
                    // Build attendance object
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
            // Fetch today's QR scans
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const todayScans = response.data.filter(record => {
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
            setError('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleStartDateChange = (e) => {
        const date = e.target.value;
        setStartDate(date);
        
        if (date) {
            // Save start date to localStorage for persistence
            localStorage.setItem(`attendance_startDate_${classCode}`, date);
            
            // Generate 30 days of dates starting from the selected date
            const dates = [];
            const startDateObj = new Date(date);
            
            for (let i = 0; i < 30; i++) {
                const currentDate = new Date(startDateObj);
                currentDate.setDate(currentDate.getDate() + i);
                dates.push(currentDate.toISOString().split('T')[0]);
            }
            
            setDateRange(dates);
            initializeAttendance(dates);
            fetchExistingAttendance(dates);
        }
    };

    const fetchExistingAttendanceFromDB = async (dates) => {
        try {
            // Fetch existing attendance records from database (skip localStorage cache)
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const existingRecords = response.data;

            const newAttendance = {};
            students.forEach(student => {
                newAttendance[student._id] = {};
                dates.forEach(date => {
                    // Check if there's an existing record for this student and date
                    const existingRecord = existingRecords.find(
                        record => 
                            record.studentId === student._id && 
                            new Date(record.date).toISOString().split('T')[0] === date
                    );
                    newAttendance[student._id][date] = existingRecord 
                        ? (existingRecord.status === 'Present' ? 'present' : 'absent')
                        : 'present'; // Default to present if no record exists
                });
            });
            setAttendance(newAttendance);
        } catch (err) {
            console.error('Error fetching existing attendance from DB:', err);
        }
    };

    const fetchExistingAttendance = async (dates) => {
        try {
            // First check localStorage for unsaved changes
            const cachedAttendance = localStorage.getItem(`attendance_data_${classCode}`);
            if (cachedAttendance) {
                setAttendance(JSON.parse(cachedAttendance));
                return;
            }
            
            // Fetch existing attendance records from database
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/attendance/${classCode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const existingRecords = response.data;

            const newAttendance = {};
            students.forEach(student => {
                newAttendance[student._id] = {};
                dates.forEach(date => {
                    // Check if there's an existing record for this student and date
                    const existingRecord = existingRecords.find(
                        record => 
                            record.studentId === student._id && 
                            new Date(record.date).toISOString().split('T')[0] === date
                    );
                    newAttendance[student._id][date] = existingRecord 
                        ? (existingRecord.status === 'Present' ? 'present' : 'absent')
                        : 'present'; // Default to present if no record exists
                });
            });
            setAttendance(newAttendance);
        } catch (err) {
            console.error('Error fetching existing attendance:', err);
            // Continue with default attendance even if fetch fails
        }
    };

    const initializeAttendance = (dates) => {
        const newAttendance = {};
        students.forEach(student => {
            newAttendance[student._id] = {};
            dates.forEach(date => {
                newAttendance[student._id][date] = 'present'; // Default to present
            });
        });
        setAttendance(newAttendance);
    };

    const handleAttendanceChange = (studentId, date, status) => {
        const updatedAttendance = {
            ...attendance,
            [studentId]: {
                ...attendance[studentId],
                [date]: status,
            },
        };
        setAttendance(updatedAttendance);
        // Save to localStorage for persistence
        localStorage.setItem(`attendance_data_${classCode}`, JSON.stringify(updatedAttendance));
    };

    const handleDeleteDate = (dateToDelete) => {
        if (window.confirm(`Are you sure you want to remove ${dateToDelete}?`)) {
            // Remove the date from dateRange
            const newDateRange = dateRange.filter(date => date !== dateToDelete);
            setDateRange(newDateRange);

            // Remove attendance data for this date
            const newAttendance = { ...attendance };
            Object.keys(newAttendance).forEach(studentId => {
                delete newAttendance[studentId][dateToDelete];
            });
            setAttendance(newAttendance);
        }
    };

    const handleSaveAttendance = async () => {
        try {
            setIsSaving(true);
            
            // Format attendance data for API
            const attendanceData = [];
            Object.keys(attendance).forEach(studentId => {
                Object.keys(attendance[studentId]).forEach(date => {
                    attendanceData.push({
                        studentId,
                        studentName: students.find(s => s._id === studentId)?.name,
                        classCode,
                        date,
                        status: attendance[studentId][date] === 'present' ? 'Present' : 'Absent',
                    });
                });
            });

            // Save attendance
            await axios.post(`http://localhost:5000/api/attendance/bulk-save`, {
                classCode,
                attendanceData,
            });

            // Clear localStorage cache after successful save
            localStorage.removeItem(`attendance_data_${classCode}`);
            
            alert('✅ Attendance saved successfully!');
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('Failed to save attendance');
        } finally {
            setIsSaving(false);
        }
    };;

    if (loading) return <p className="text-gray-600">Loading attendance...</p>;
    if (error) return <p className="text-red-600">Error: {error}</p>;

    return (
        <div className="w-full">
            {/* QR Scan Status - Always visible */}
            {qrScannedStudents.size > 0 && (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-300">
                    <h3 className="text-xl font-bold text-green-900 mb-4">📱 QR Code Scan Status (Today)</h3>
                    <div className="space-y-2">
                        {students.map((student) => (
                            <div key={student._id} className="flex items-center gap-3">
                                <span className={`text-2xl font-bold ${qrScannedStudents.has(student._id) ? 'text-green-600' : 'text-red-600'}`}>
                                    {qrScannedStudents.has(student._id) ? '✅' : '❌'}
                                </span>
                                <span className="text-gray-800 font-semibold">
                                    {student.name || student.email}
                                </span>
                                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${
                                    qrScannedStudents.has(student._id)
                                        ? 'bg-green-200 text-green-800'
                                        : 'bg-red-200 text-red-800'
                                }`}>
                                    {qrScannedStudents.has(student._id) ? 'Scanned' : 'Not Scanned'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Start Date Selector - Only for Teachers */}
            {userRole === 'teacher' && (
                <div className="mb-6 bg-blue-50 p-6 rounded-lg">
                    <label className="block text-sm font-bold text-gray-700 mb-2">📅 Set Starting Date for Attendance:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {startDate && <p className="text-sm text-gray-600 mt-2">📊 Tracking 30 days from {startDate}</p>}
                </div>
            )}

            {/* Attendance Table */}
            {dateRange.length > 0 ? (
                <div>
                    <h3 className="text-xl font-bold mb-4">📋 Attendance Sheet - {students.length} Students</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse bg-white shadow-lg rounded">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0">
                                    <th className="border border-gray-300 px-4 py-3 text-left font-bold min-w-40">Student Name</th>
                                    {dateRange.map((date) => (
                                        <th
                                            key={date}
                                            className="border border-gray-300 px-3 py-2 text-center font-bold min-w-24 text-xs relative group"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                {userRole === 'teacher' && (
                                                    <button
                                                        onClick={() => handleDeleteDate(date)}
                                                        className="mt-1 hidden group-hover:block bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold transition-colors"
                                                        title="Delete this date"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => (
                                    <tr key={student._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-800">
                                            {student.name || student.email}
                                        </td>
                                        {dateRange.map((date) => (
                                            <td key={date} className="border border-gray-300 px-3 py-3 text-center">
                                                {userRole === 'teacher' ? (
                                                    <select
                                                        value={attendance[student._id]?.[date] || 'present'}
                                                        onChange={(e) => handleAttendanceChange(student._id, date, e.target.value)}
                                                        className={`px-2 py-1 rounded text-sm font-bold cursor-pointer border-0 ${
                                                            attendance[student._id]?.[date] === 'present'
                                                                ? 'bg-green-300 text-green-800'
                                                                : 'bg-red-300 text-red-800'
                                                        }`}
                                                    >
                                                        <option value="present">✓ P</option>
                                                        <option value="absent">✗ A</option>
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={`px-3 py-1 rounded text-sm font-bold ${
                                                            attendance[student._id]?.[date] === 'present'
                                                                ? 'bg-green-200 text-green-800'
                                                                : 'bg-red-200 text-red-800'
                                                        }`}
                                                    >
                                                        {attendance[student._id]?.[date] === 'present' ? '✓' : '✗'}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Save Button - Only for Teachers */}
                    {userRole === 'teacher' && (
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleSaveAttendance}
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold transition-colors disabled:opacity-50"
                            >
                                {isSaving ? '⏳ Saving...' : '💾 Save Attendance'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold transition-colors"
                            >
                                📥 Print
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-6">
                    <p className="text-yellow-800 font-semibold">
                        {userRole === 'teacher' 
                            ? '👆 Please select a starting date above to begin marking attendance'
                            : '📋 Attendance will be displayed once the teacher sets a starting date'}
                    </p>
                </div>
            )}
        </div>
    );
});

export default AttendanceDashboard;

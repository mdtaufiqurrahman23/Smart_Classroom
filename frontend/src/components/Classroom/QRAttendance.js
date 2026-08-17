// src/components/Classroom/QRAttendance.js

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRAttendance.css';

const QRAttendance = ({ classCode, userRole, onQRScanned }) => {
    const [isActive, setIsActive] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [sessionId, setSessionId] = useState(null);
    const [scannedStudents, setScannedStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Student scanner states
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [scanStatus, setScanStatus] = useState(''); // 'success', 'error', ''
    const videoRef = useRef(null);
    const qrScannerRef = useRef(null);
    const [userData, setUserData] = useState(null);

    // Load user data on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                setUserData(decoded);
                console.log('✅ User data loaded:', decoded);
            } catch (err) {
                console.error('❌ Failed to decode token:', err);
            }
        }
    }, []);

    // Teacher: Start attendance session
    const handleStartAttendance = async () => {
        try {
            setLoading(true);
            console.log('🔄 Starting attendance session for classCode:', classCode);
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:5000/api/attendance/start-session`, {
                classCode,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Session started:', response.data);
            setSessionId(response.data.sessionId);
            setIsActive(true);
            setTimeLeft(60);
            setScannedStudents([]);
            setLoading(false);
        } catch (err) {
            console.error('❌ Error starting attendance session:', err.response?.data || err.message);
            alert(`Failed to start attendance session: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        }
    };

    // Teacher: Stop attendance session
    const handleStopAttendance = async () => {
        try {
            setLoading(true);
            console.log('⏹️ Stopping attendance session:', sessionId);
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/attendance/end-session`, {
                classCode,
                sessionId,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Session stopped successfully');
            setIsActive(false);
            setSessionId(null);
            setQrCode('');
            setLoading(false);
            alert('✅ Attendance session ended');
        } catch (err) {
            console.error('❌ Error stopping attendance session:', err.response?.data || err.message);
            alert(`Failed to stop attendance session: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        }
    };

    // Student: Initialize camera for scanning with Html5QrcodeScanner
    const handleOpenScanner = async () => {
        try {
            console.log('📱 Opening scanner...');
            setIsScannerActive(true);
            setScanMessage('🔄 Initializing camera...');
            setScanStatus('');
        } catch (err) {
            console.error('❌ Error opening scanner:', err);
            setScanMessage('❌ Error: ' + (err.message || 'Unknown error'));
            setScanStatus('error');
            setIsScannerActive(false);
        }
    };

    // Initialize scanner when isScannerActive becomes true
    useEffect(() => {
        if (!isScannerActive) return;

        // Delay to ensure DOM is ready
        const timer = setTimeout(() => {
            try {
                console.log('📱 Initializing Html5QrcodeScanner...');
                
                const qrReaderDiv = document.getElementById('qr-reader');
                if (!qrReaderDiv) {
                    throw new Error('qr-reader div not found in DOM');
                }
                console.log('✅ Found qr-reader element');

                // Initialize Html5QrcodeScanner
                const scanner = new Html5QrcodeScanner(
                    'qr-reader',
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        videoConstraints: {
                            facingMode: 'environment'
                        }
                    },
                    false
                );

                qrScannerRef.current = scanner;
                console.log('📱 Scanner object created');

                scanner.render(
                    (decodedText) => {
                        console.log('✅ QR Code detected:', decodedText);
                        handleManualQRInput(decodedText);
                        // Stop scanner after successful scan
                        if (qrScannerRef.current) {
                            qrScannerRef.current.clear().catch(err => console.log('Clear error:', err));
                        }
                    },
                    (error) => {
                        // Ignore scanning errors - scanner will keep trying
                        if (error && error.message) {
                            console.log('🔍 Scanner running...');
                        }
                    }
                );

                setScanMessage('✅ Camera initialized. Point at the QR code...');
            } catch (err) {
                console.error('❌ Scanner initialization error:', err);
                setScanMessage('❌ ' + err.message);
                setScanStatus('error');
                setIsScannerActive(false);
            }
        }, 100); // 100ms delay to ensure DOM is ready

        return () => clearTimeout(timer);
    }, [isScannerActive]);

    // Student: Stop camera
    const stopCamera = () => {
        console.log('🛑 Stopping scanner...');
        if (qrScannerRef.current) {
            qrScannerRef.current.clear().catch(err => {
                console.log('Scanner cleanup note:', err);
            });
            qrScannerRef.current = null;
        }
        setIsScannerActive(false);
        setScanMessage('');
        setScanStatus('');
    };

    // Student: Handle QR code detection
    const handleManualQRInput = async (qrValue) => {
        try {
            // Parse QR value: classCode|sessionId|timestamp
            const [qrClassCode, qrSessionId] = qrValue.split('|');

            if (qrClassCode !== classCode) {
                setScanMessage('❌ Invalid class code. Please scan the correct class QR code.');
                setScanStatus('error');
                return;
            }

            if (!userData) {
                setScanMessage('❌ Unable to get user information. Please login again.');
                setScanStatus('error');
                return;
            }

            setScanMessage('⏳ Processing attendance...');
            setScanStatus('');

            // Send scan data to backend
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:5000/api/attendance/scan-qr`, {
                classCode,
                sessionId: qrSessionId,
                studentId: userData._id || userData.id,
                studentName: userData.name || userData.email,
                timestamp: Math.floor(Date.now() / 1000),
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setScanMessage('✅ Attendance marked successfully! You are present.');
            setScanStatus('success');
            stopCamera();
            
            // Notify parent to refresh attendance table
            if (onQRScanned) {
                onQRScanned();
            }
        } catch (err) {
            console.error('Error marking attendance:', err);
            setScanMessage(`❌ ${err.response?.data?.message || 'Failed to mark attendance'}`);
            setScanStatus('error');
        }
    };

    // Generate new QR code every 60 seconds
    useEffect(() => {
        if (!isActive || !sessionId) return;

        // Generate initial QR code
        const generateQR = () => {
            const timestamp = Math.floor(Date.now() / 1000);
            const qrValue = `${classCode}|${sessionId}|${timestamp}`;
            setQrCode(qrValue);
            setTimeLeft(60);
        };

        generateQR();

        // Change QR code every 60 seconds
        const qrInterval = setInterval(generateQR, 60000);

        // Countdown timer
        const timerInterval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(qrInterval);
            clearInterval(timerInterval);
        };
    }, [isActive, sessionId, classCode]);

    // Teacher view
    if (userRole === 'teacher') {
        return (
            <div className="w-full max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold text-blue-900 mb-6">📱 QR Code Attendance</h2>

                    {!isActive ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                                <p className="text-yellow-800 text-lg font-semibold mb-4">
                                    🔓 Attendance session is not active
                                </p>
                                <p className="text-yellow-700 mb-6">
                                    Click "Start Attendance" to generate QR codes for students to scan
                                </p>
                            </div>
                            <button
                                onClick={handleStartAttendance}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50"
                            >
                                {loading ? '⏳ Starting...' : '▶️ Start Attendance'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            {/* Timer */}
                            <div className="text-center">
                                <p className="text-gray-700 text-sm font-semibold mb-2">QR Code expires in:</p>
                                <div className="text-6xl font-bold text-blue-600 animate-pulse">
                                    {timeLeft}s
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="bg-white p-8 rounded-lg shadow-lg border-4 border-blue-500">
                                {qrCode && (
                                    <QRCodeCanvas
                                        value={qrCode}
                                        size={300}
                                        level="H"
                                        includeMargin={true}
                                    />
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 p-4 rounded-lg text-center text-sm">
                                <p className="text-gray-700">
                                    📲 Students can scan this QR code to mark attendance
                                </p>
                                <p className="text-gray-600 text-xs mt-2">
                                    New QR code will be generated every 60 seconds
                                </p>
                            </div>

                            {/* Stop Button */}
                            <button
                                onClick={handleStopAttendance}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                            >
                                {loading ? '⏳ Stopping...' : '⏹️ Stop Attendance'}
                            </button>

                            {/* Scanned Count */}
                            {scannedStudents.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <p className="text-green-700 font-bold text-lg">
                                        ✅ {scannedStudents.length} students scanned so far
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Student view
    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-green-900 mb-6">📱 Mark Attendance</h2>

                {!isScannerActive ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-8 rounded-lg shadow-lg border-4 border-green-500 text-center">
                            <p className="text-gray-700 text-lg font-semibold mb-4">
                                📷 Camera Scanner
                            </p>
                            <p className="text-gray-600 mb-6">
                                Use your device camera to scan the QR code displayed by your teacher
                            </p>
                            <button
                                onClick={handleOpenScanner}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all"
                            >
                                🔍 Open Scanner
                            </button>
                        </div>

                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                            <p className="text-yellow-800 font-semibold mb-2">⏰ Time Limit</p>
                            <p className="text-yellow-700">
                                You have 60 seconds to scan the QR code before it changes
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        {/* QR Scanner Container with proper dimensions */}
                        <div className="w-full max-w-sm bg-black rounded-lg overflow-hidden">
                            <div id="qr-reader" style={{
                                width: '100%',
                                minHeight: '300px'
                            }}></div>
                        </div>

                        {/* Status Message */}
                        {scanMessage && (
                            <div
                                className={`p-4 rounded-lg w-full text-center font-bold ${
                                    scanStatus === 'success'
                                        ? 'bg-green-100 border-2 border-green-500 text-green-800'
                                        : scanStatus === 'error'
                                        ? 'bg-red-100 border-2 border-red-500 text-red-800'
                                        : 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                                }`}
                            >
                                {scanMessage}
                            </div>
                        )}

                        {/* Manual QR Input as Fallback */}
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                📝 Or paste the QR code text below:
                            </label>
                            <input
                                type="text"
                                placeholder="Paste QR code content here"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        handleManualQRInput(e.target.value.trim());
                                        e.target.value = '';
                                    }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-600 mt-2">Press Enter to submit</p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={stopCamera}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition-all w-full"
                        >
                            ✕ Close Scanner
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRAttendance;

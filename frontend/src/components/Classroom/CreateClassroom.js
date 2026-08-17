// src/components/Classroom/CreateClassroom.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateClassroom = () => {
    const [classroomName, setClassroomName] = useState('');
    const [classroomDetails, setClassroomDetails] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!classroomName.trim() || !classroomDetails.trim()) {
            setMessage('Please provide both classroom name and details.');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/classrooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: classroomName,
                    details: classroomDetails,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Classroom created successfully! Redirecting...');
                setTimeout(() => {
                    navigate(`/classroom/${data.classCode}`);
                }, 1500);
            } else {
                setMessage(data.message || 'Failed to create classroom. Please try again.');
            }
        } catch (error) {
            setMessage('Error creating classroom. Please check your connection or try again later.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper min-h-screen">
            <div className="full-screen-container">
                <div className="glass-card" style={{ maxWidth: '600px', width: '100%' }}>
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🎓</div>
                        <h1 className="text-4xl font-bold mb-2">Create Classroom</h1>
                        <p className="text-secondary">Set up a new classroom for your students</p>
                    </div>

                    {message && (
                        <div className={`alert mb-6 ${message.includes('successfully') ? 'alert-success' : message.includes('Error') ? 'alert-error' : 'alert-warning'}`}>
                            <span>{message.includes('successfully') ? '✅' : '⚠️'}</span>
                            <p>{message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-group">
                            <label className="form-label">Classroom Name *</label>
                            <input
                                type="text"
                                id="classroomName"
                                placeholder="e.g., Data Structures - Batch A"
                                value={classroomName}
                                onChange={(e) => setClassroomName(e.target.value)}
                                required
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Classroom Details *</label>
                            <textarea
                                id="classroomDetails"
                                placeholder="Describe the classroom, topics covered, schedule, etc."
                                value={classroomDetails}
                                onChange={(e) => setClassroomDetails(e.target.value)}
                                required
                                maxLength={500}
                                rows="5"
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-primary btn-lg flex-1"
                            >
                                {loading ? '⏳ Creating...' : '✓ Create Classroom'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate('/teacher-dashboard')}
                                className="btn btn-ghost btn-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div className="glass-card-sm mt-8">
                        <h3 className="font-bold mb-3">💡 Tips for creating a classroom:</h3>
                        <ul className="text-sm text-secondary space-y-2">
                            <li>✓ Use a clear, descriptive name for your classroom</li>
                            <li>✓ Include the subject and batch/section in the name</li>
                            <li>✓ Provide details about course objectives and topics</li>
                            <li>✓ You'll receive a unique class code to share with students</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateClassroom;

// frontend/src/components/TeacherDashboard/LeaveRequests.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LeaveRequests({ classCode }) {
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const response = await axios.get(`/api/leave-requests/${classCode}`);
        setLeaveRequests(response.data);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      }
    };

    fetchLeaveRequests();
  }, [classCode]);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await axios.post('/api/leave-requests/update-status', { requestId, status });
      alert(`Leave request ${status}`);
      setLeaveRequests(leaveRequests.map(request => request._id === requestId ? { ...request, status } : request));
    } catch (error) {
      console.error('Error updating leave request status:', error);
    }
  };

  return (
    <div>
      <h2>Leave Requests for Class: {classCode}</h2>
      <ul>
        {leaveRequests.map((request) => (
          <li key={request._id}>
            <p><strong>{request.studentName}</strong> (ID: {request.studentId})</p>
            <p>Reason: {request.reason}</p>
            <p>Status: {request.status}</p>
            <button onClick={() => handleUpdateStatus(request._id, 'Approved')}>Approve</button>
            <button onClick={() => handleUpdateStatus(request._id, 'Rejected')}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LeaveRequests;

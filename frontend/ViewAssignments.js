// frontend/src/components/TeacherDashboard/Announcement/ViewAssignments.js
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const ViewAssignments = forwardRef(({ classCode, userRole }, ref) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    if (!classCode) {
      console.log('❌ Cannot fetch: classCode is not set');
      return;
    }
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/assignments/${classCode}`;
      console.log('🔍 Fetching assignments from:', url);
      const response = await axios.get(url);
      console.log('✅ Response received:', response);
      console.log('✅ Response.data:', response.data);
      console.log('✅ Type of response.data:', typeof response.data);
      console.log('✅ Is array:', Array.isArray(response.data));
      console.log('✅ Length:', Array.isArray(response.data) ? response.data.length : 'N/A');
      
      const assignmentArray = Array.isArray(response.data) ? response.data : [];
      console.log('📊 Setting assignments to:', assignmentArray);
      setAssignments(assignmentArray);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      console.error('❌ Error response:', error.response);
      setError('Failed to fetch assignments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId, assignmentTitle) => {
    if (window.confirm(`Are you sure you want to delete "${assignmentTitle}"? This action cannot be undone.`)) {
      try {
        console.log('Deleting assignment:', assignmentId);
        await axios.delete(`http://localhost:5000/api/assignments/${assignmentId}`);
        console.log('Assignment deleted successfully');
        // Remove from local state
        setAssignments(assignments.filter(a => a._id !== assignmentId));
        setExpandedAssignment(null);
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment. Please try again.');
      }
    }
  };

  const handleSubmitAssignment = async (e, assignmentId) => {
    e.preventDefault();

    if (!submissionFile) {
      alert('Please select a PDF file to submit');
      return;
    }

    if (submissionFile.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const userData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const studentName = userData?.name || userData?.email || 'Anonymous';

      const formData = new FormData();
      formData.append('studentName', studentName);
      formData.append('submissionFile', submissionFile);

      const response = await axios.post(
        `http://localhost:5000/api/assignments/${assignmentId}/submit`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('Assignment submitted successfully!');
      setSubmissionFile(null);
      await fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (assignmentId, submissionIndex) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await axios.delete(`http://localhost:5000/api/assignments/${assignmentId}/submission/${submissionIndex}`);
        alert('Submission deleted successfully!');
        await fetchAssignments();
      } catch (error) {
        console.error('Error deleting submission:', error);
        alert('Error deleting submission: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  useEffect(() => {
    console.log('ViewAssignments mounted/updated with classCode:', classCode);
    console.log('Ref object:', ref);
    if (classCode) {
      fetchAssignments();
    }
  }, [classCode]);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refreshAssignments: () => {
      console.log('refreshAssignments called from parent');
      fetchAssignments();
    }
  }));

  if (loading) {
    return <p className="text-gray-600">Loading assignments... (classCode: {classCode})</p>;
  }

  if (error) {
    return <p className="text-red-600">{error} (classCode: {classCode})</p>;
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No assignments yet. (classCode: {classCode}, total in state: {assignments.length})</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Assignments</h3>
      {assignments.map((assignment) => (
        <div key={assignment._id} className="bg-white border-l-4 border-purple-600 p-6 rounded-lg shadow-md">
          <div 
            className="cursor-pointer"
            onClick={() => setExpandedAssignment(expandedAssignment === assignment._id ? null : assignment._id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">{assignment.title}</h4>
                <p className="text-gray-700 mb-2">{assignment.description}</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>📅 Due: <strong>{formatDate(assignment.dueDate)}</strong></span>
                  <span>📤 Submissions: <strong>{assignment.studentSubmissions?.length || 0}</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">{expandedAssignment === assignment._id ? '▼' : '▶'}</span>
              </div>
            </div>
          </div>

          {expandedAssignment === assignment._id && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {userRole === 'teacher' && (
                <>
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">Student Submissions</h5>
                  
                  {assignment.studentSubmissions && assignment.studentSubmissions.length > 0 ? (
                    <div className="space-y-3">
                      {assignment.studentSubmissions.map((submission, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded border border-gray-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-800">{submission.studentName}</p>
                              <p className="text-sm text-gray-600">ID: {submission.studentId}</p>
                              <p className="text-sm text-gray-500">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={submission.submissionPDF}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-sm"
                              >
                                👁️ View
                              </a>
                              <button
                                onClick={() => handleDeleteSubmission(assignment._id, idx)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold text-sm"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No submissions yet.</p>
                  )}

                  {assignment.assignmentPDF && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <a
                        href={assignment.assignmentPDF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold"
                      >
                        📄 View Assignment PDF
                      </a>
                    </div>
                  )}
                </>
              )}

              {userRole !== 'teacher' && (
                <>
                  {assignment.assignmentPDF && (
                    <div className="mb-6">
                      <a
                        href={assignment.assignmentPDF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold mb-6"
                      >
                        📄 View Assignment PDF
                      </a>
                    </div>
                  )}

                  {/* Student's own submissions section */}
                  <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">📋 Your Submissions</h5>
                    {assignment.studentSubmissions && assignment.studentSubmissions.length > 0 ? (
                      <div className="space-y-2">
                        {assignment.studentSubmissions.map((submission, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                            <div className="text-sm">
                              <p className="font-semibold text-gray-800">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={submission.submissionPDF}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold text-sm"
                              >
                                👁️ View
                              </a>
                              <button
                                onClick={() => handleDeleteSubmission(assignment._id, idx)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold text-sm"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No submissions yet.</p>
                    )}
                  </div>
                  
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">Submit Your Answer</h5>
                  <form className="space-y-4" onSubmit={(e) => handleSubmitAssignment(e, assignment._id)}>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Upload PDF</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSubmissionFile(e.target.files[0])}
                        className="w-full px-4 py-2 border border-gray-300 rounded hover:border-purple-600 focus:outline-none focus:border-purple-600"
                      />
                      {submissionFile && (
                        <p className="text-sm text-green-600 mt-2">✓ Selected: {submissionFile.name}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !submissionFile}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitting ? '⏳ Submitting...' : '✅ Submit Assignment'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

ViewAssignments.displayName = 'ViewAssignments';

export default ViewAssignments;

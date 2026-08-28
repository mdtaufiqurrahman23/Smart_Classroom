// frontend/src/components/TeacherDashboard/Announcement/ViewMarksheet.js
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const ViewMarksheet = forwardRef(({ classCode, userRole }, ref) => {
  const [marksheets, setMarksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useImperativeHandle(ref, () => ({
    refreshMarksheets,
  }));

  useEffect(() => {
    refreshMarksheets();
  }, [classCode]);

  const refreshMarksheets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/marksheets/${classCode}`);
      setMarksheets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching marksheets:', err);
      setError('Failed to fetch marksheets');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (marksheet) => {
    setEditingId(marksheet._id);
    setEditData({
      quizMarks: marksheet.quizMarks,
      labMarks: marksheet.labMarks,
      assignmentMarks: marksheet.assignmentMarks,
      midtermMarks: marksheet.midtermMarks,
      finalMarks: marksheet.finalMarks,
    });
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: Number(value),
    });
  };

  const handleSaveEdit = async (marksheetId) => {
    try {
      await axios.put(`http://localhost:5000/api/marksheets/${marksheetId}`, editData);
      alert('Marksheet updated successfully!');
      setEditingId(null);
      refreshMarksheets();
    } catch (err) {
      console.error('Error updating marksheet:', err);
      alert('Failed to update marksheet');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  if (loading) {
    return <p className="text-gray-600">Loading marksheets...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Class Marksheet</h3>
      
      {marksheets.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No marksheets yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Student ID</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Student Name</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Quiz (15)</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Lab (25)</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Assignment (10)</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Midterm (20)</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Final (30)</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total (100)</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Grade</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {marksheets.map((marksheet, index) => (
                <tr key={marksheet._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-2">{marksheet.studentId}</td>
                  <td className="border border-gray-300 px-4 py-2">{marksheet.studentName}</td>
                  {editingId === marksheet._id ? (
                    <>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="number"
                          value={editData.quizMarks}
                          onChange={(e) => handleEditChange('quizMarks', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="number"
                          value={editData.labMarks}
                          onChange={(e) => handleEditChange('labMarks', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="number"
                          value={editData.assignmentMarks}
                          onChange={(e) => handleEditChange('assignmentMarks', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="number"
                          value={editData.midtermMarks}
                          onChange={(e) => handleEditChange('midtermMarks', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="number"
                          value={editData.finalMarks}
                          onChange={(e) => handleEditChange('finalMarks', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                        {editData.quizMarks + editData.labMarks + editData.assignmentMarks + editData.midtermMarks + editData.finalMarks}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                          {marksheet.grade}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => handleSaveEdit(marksheet._id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm mr-2 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.quizMarks}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.labMarks}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.assignmentMarks}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.midtermMarks}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.finalMarks}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-bold">{marksheet.totalMarks}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                          {marksheet.grade}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => handleEditClick(marksheet)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          style={{ display: userRole === 'teacher' ? 'inline-block' : 'none' }}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

ViewMarksheet.displayName = 'ViewMarksheet';

export default ViewMarksheet;

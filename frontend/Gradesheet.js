import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const Gradesheet = forwardRef(({ classCode, userRole }, ref) => {
  const [marksheets, setMarksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('gradesheet'); // 'gradesheet' or 'marksheet'
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useImperativeHandle(ref, () => ({
    refreshMarksheets: fetchMarksheets,
  }));

  useEffect(() => {
    fetchMarksheets();
  }, [classCode]);

  const fetchMarksheets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch classroom to get enrolled students
      let classroom = null;
      try {
        const classroomResponse = await axios.get(`http://localhost:5000/api/classrooms/${classCode}`);
        classroom = classroomResponse.data;
      } catch (err) {
        console.error('Error fetching classroom:', err);
        // Continue even if classroom fetch fails
      }

      const enrolledStudents = classroom?.students || [];

      // Fetch existing marksheets
      let existingMarksheets = [];
      try {
        const marksheetResponse = await axios.get(`http://localhost:5000/api/marksheets/${classCode}`);
        existingMarksheets = marksheetResponse.data || [];
      } catch (err) {
        console.error('Error fetching existing marksheets:', err);
        existingMarksheets = [];
      }

      // Find students without marksheets and auto-create them
      if (enrolledStudents.length > 0) {
        const existingStudentIds = existingMarksheets.map(m => m.studentId);
        const studentsWithoutMarksheets = enrolledStudents.filter(
          student => !existingStudentIds.includes(student._id)
        );

        // Auto-create marksheets for students without them
        if (studentsWithoutMarksheets.length > 0) {
          console.log(`Creating ${studentsWithoutMarksheets.length} new marksheets...`);
          for (const student of studentsWithoutMarksheets) {
            try {
              await axios.post(`http://localhost:5000/api/marksheets/create`, {
                studentId: student._id,
                studentName: student.name || student.email,
                classCode: classCode,
              });
              console.log(`✓ Created marksheet for ${student.name}`);
            } catch (err) {
              console.error(`Failed to create marksheet for student ${student.name}:`, err.response?.data || err.message);
            }
          }
        }
      }

      // Fetch all marksheets again after creating new ones
      const finalMarksheetResponse = await axios.get(`http://localhost:5000/api/marksheets/${classCode}`);
      setMarksheets(finalMarksheetResponse.data || []);
      console.log(`✓ Fetched ${finalMarksheetResponse.data?.length || 0} marksheets`);
    } catch (err) {
      console.error('Error in fetchMarksheets:', err);
      setError('Failed to load gradesheet data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate best 3 average from 4 scores
  const calculateBest3Avg = (scores) => {
    const scoreArray = Object.values(scores).filter(s => s > 0);
    if (scoreArray.length === 0) return 0;
    scoreArray.sort((a, b) => b - a);
    const best3 = scoreArray.slice(0, 3);
    return best3.length > 0 ? (best3.reduce((a, b) => a + b, 0) / 3).toFixed(2) : 0;
  };

  const calculateTotal = (marksheet) => {
    const quiz = marksheet.finalQuizMarks || 0;
    const lab = marksheet.finalLabMarks || 0;
    const assignment = marksheet.assignmentMarks || 0;
    const midterm = marksheet.midtermMarks || 0;
    const finalExam = marksheet.finalExamMarks || 0;
    return quiz + lab + assignment + midterm + finalExam;
  };

  const getGrade = (total) => {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    return 'F';
  };

  const handleEditClick = (marksheet) => {
    setEditingId(marksheet._id);
    setEditData({
      quiz1: marksheet.quizScores?.quiz1 || 0,
      quiz2: marksheet.quizScores?.quiz2 || 0,
      quiz3: marksheet.quizScores?.quiz3 || 0,
      quiz4: marksheet.quizScores?.quiz4 || 0,
      lab1: marksheet.labScores?.lab1 || 0,
      lab2: marksheet.labScores?.lab2 || 0,
      lab3: marksheet.labScores?.lab3 || 0,
      lab4: marksheet.labScores?.lab4 || 0,
      assignmentMarks: marksheet.assignmentMarks || 0,
      midtermMarks: marksheet.midtermMarks || 0,
      finalExamMarks: marksheet.finalExamMarks || 0,
    });
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: Math.max(0, Number(value)),
    });
  };

  const handleSaveEdit = async (marksheetId) => {
    try {
      await axios.put(`http://localhost:5000/api/marksheets/${marksheetId}`, editData);
      alert('Gradesheet updated successfully!');
      setEditingId(null);
      fetchMarksheets();
    } catch (err) {
      console.error('Error updating gradesheet:', err);
      alert('Failed to update gradesheet');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  if (loading) {
    return <div className="bg-blue-50 p-6 rounded-lg"><p className="text-blue-700 font-semibold">⏳ Loading gradesheet data...</p></div>;
  }

  if (error) {
    return <div className="bg-red-50 p-6 rounded-lg border border-red-200"><p className="text-red-700 font-semibold">❌ Error: {error}</p><p className="text-red-600 text-sm mt-2">Please check the console for more details</p></div>;
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('gradesheet')}
          className={`px-6 py-3 font-semibold text-lg ${
            activeTab === 'gradesheet'
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📊 Tabular Gradesheet
        </button>
        {userRole === 'teacher' && (
          <button
            onClick={() => setActiveTab('marksheet')}
            className={`px-6 py-3 font-semibold text-lg ${
              activeTab === 'marksheet'
                ? 'border-b-4 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ✏️ Marksheet Entry
          </button>
        )}
      </div>

      {/* GRADESHEET TAB */}
      {activeTab === 'gradesheet' && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Gradesheet - Final Scores</h3>
          
          {marksheets.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No grades yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Student ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Student Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Quiz<br/>(15)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Lab<br/>(25)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Assignment<br/>(10)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Midterm<br/>(20)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Final<br/>(30)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center font-bold">Total<br/>(100)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {marksheets.map((marksheet, index) => {
                    const total = calculateTotal(marksheet);
                    const grade = getGrade(total);
                    return (
                      <tr key={marksheet._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2">{marksheet.studentId}</td>
                        <td className="border border-gray-300 px-4 py-2">{marksheet.studentName}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{marksheet.finalQuizMarks?.toFixed(1) || 0}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{marksheet.finalLabMarks?.toFixed(1) || 0}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.assignmentMarks || 0}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.midtermMarks || 0}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{marksheet.finalExamMarks || 0}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center font-bold text-lg bg-yellow-50">{total.toFixed(1)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={`px-3 py-1 rounded text-sm font-bold text-white ${
                            grade === 'A+' || grade === 'A' ? 'bg-green-500' :
                            grade === 'B' ? 'bg-blue-500' :
                            grade === 'C' ? 'bg-yellow-500' :
                            grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                          }`}>
                            {grade}
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
      )}

      {/* MARKSHEET ENTRY TAB (Teacher Only) */}
      {activeTab === 'marksheet' && userRole === 'teacher' && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">✏️ Marksheet Entry - Quiz & Lab Marks</h3>
          
          {marksheets.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No students to grade</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-lg rounded">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold">Student Name</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Q1</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Q2</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Q3</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Q4</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Best Q</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">L1</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">L2</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">L3</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">L4</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Best L</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Assign</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Mid</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold">Final</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {marksheets.map((marksheet, index) => (
                    <tr key={marksheet._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-3 font-semibold">{marksheet.studentName}</td>
                      
                      {/* Quiz Scores */}
                      {editingId === marksheet._id ? (
                        <>
                          {['quiz1', 'quiz2', 'quiz3', 'quiz4'].map((quiz) => (
                            <td key={quiz} className="border border-gray-300 px-3 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                value={editData[quiz] || 0}
                                onChange={(e) => handleEditChange(quiz, e.target.value)}
                                className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              />
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-3 text-center font-bold bg-blue-50">
                            {calculateBest3Avg({
                              quiz1: editData.quiz1,
                              quiz2: editData.quiz2,
                              quiz3: editData.quiz3,
                              quiz4: editData.quiz4,
                            })}/15
                          </td>
                          
                          {/* Lab Scores */}
                          {['lab1', 'lab2', 'lab3', 'lab4'].map((lab) => (
                            <td key={lab} className="border border-gray-300 px-3 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="25"
                                value={editData[lab] || 0}
                                onChange={(e) => handleEditChange(lab, e.target.value)}
                                className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              />
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-3 text-center font-bold bg-green-50">
                            {calculateBest3Avg({
                              lab1: editData.lab1,
                              lab2: editData.lab2,
                              lab3: editData.lab3,
                              lab4: editData.lab4,
                            })}/25
                          </td>
                          
                          {/* Other Marks */}
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={editData.assignmentMarks || 0}
                              onChange={(e) => handleEditChange('assignmentMarks', e.target.value)}
                              className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={editData.midtermMarks || 0}
                              onChange={(e) => handleEditChange('midtermMarks', e.target.value)}
                              className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={editData.finalExamMarks || 0}
                              onChange={(e) => handleEditChange('finalExamMarks', e.target.value)}
                              className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                          </td>
                          
                          {/* Action Buttons */}
                          <td className="border border-gray-300 px-3 py-3 text-center space-x-2">
                            <button
                              onClick={() => handleSaveEdit(marksheet._id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold"
                            >
                              ✅
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold"
                            >
                              ❌
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          {['quiz1', 'quiz2', 'quiz3', 'quiz4'].map((quiz) => (
                            <td key={quiz} className="border border-gray-300 px-3 py-3 text-center">
                              {marksheet.quizScores?.[quiz] || 0}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-3 text-center font-bold bg-blue-50">
                            {marksheet.finalQuizMarks?.toFixed(1) || 0}/15
                          </td>
                          
                          {['lab1', 'lab2', 'lab3', 'lab4'].map((lab) => (
                            <td key={lab} className="border border-gray-300 px-3 py-3 text-center">
                              {marksheet.labScores?.[lab] || 0}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-3 text-center font-bold bg-green-50">
                            {marksheet.finalLabMarks?.toFixed(1) || 0}/25
                          </td>
                          
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            {marksheet.assignmentMarks || 0}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            {marksheet.midtermMarks || 0}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            {marksheet.finalExamMarks || 0}
                          </td>
                          
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            <button
                              onClick={() => handleEditClick(marksheet)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-bold"
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
      )}
    </div>
  );
});

Gradesheet.displayName = 'Gradesheet';

export default Gradesheet;

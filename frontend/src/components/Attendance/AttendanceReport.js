// frontend/src/components/TeacherDashboard/Attendance/AttendanceReport.js
import React, { useState } from 'react';
import axios from 'axios';

function AttendanceReport() {
  const [classCode, setClassCode] = useState('');
  const [date, setDate] = useState('');
  const [reportLink, setReportLink] = useState('');

  const handleGenerateReport = async () => {
    try {
      const response = await axios.post('/api/attendance-report/generate-report', { classCode, date });
      setReportLink(response.data.filePath); // Set the path of the generated report
      alert('Attendance report generated successfully!');
    } catch (error) {
      console.error('Error generating attendance report:', error);
      alert('Error generating attendance report');
    }
  };

  return (
    <div>
      <h2>Generate Attendance Report</h2>
      <form>
        <div>
          <label>Class Code:</label>
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <button type="button" onClick={handleGenerateReport}>
          Generate Report
        </button>
      </form>

      {reportLink && (
        <div>
          <a href={reportLink} download>
            Download Attendance Report
          </a>
        </div>
      )}
    </div>
  );
}

export default AttendanceReport;

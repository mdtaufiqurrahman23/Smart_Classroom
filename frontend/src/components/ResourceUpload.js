import React, { useState } from 'react';
import axios from 'axios';

function ResourceUpload({ classCode: propClassCode, onResourceUploaded }) {
  const [classCode, setClassCode] = useState(propClassCode || '');
  const [resourceType, setResourceType] = useState('PDF');
  const [resourceFile, setResourceFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Update classCode if prop changes
  React.useEffect(() => {
    if (propClassCode) {
      setClassCode(propClassCode);
    }
  }, [propClassCode]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResourceFile(e.target.files[0]);
      setStatusMessage({ text: '', type: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resourceFile) {
      setStatusMessage({ text: 'Please select a file to upload.', type: 'error' });
      return;
    }

    const targetClassCode = classCode || propClassCode;
    if (!targetClassCode) {
      setStatusMessage({ text: 'Class code is missing.', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      setStatusMessage({ text: 'Uploading file locally to server...', type: 'info' });

      // Get teacher name/info from stored token
      let uploadedBy = 'Teacher';
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          uploadedBy = decoded.name || decoded.email || 'Teacher';
        } catch (err) {}
      }

      const formData = new FormData();
      formData.append('classCode', targetClassCode.trim());
      formData.append('resourceType', resourceType);
      formData.append('uploadedBy', uploadedBy);
      // Append as 'file' (standard) and 'resourceFile' for full compatibility
      formData.append('file', resourceFile);
      formData.append('resourceFile', resourceFile);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      };

      const response = await axios.post('http://localhost:5000/api/resources/upload', formData, config);

      setStatusMessage({ 
        text: `✅ File "${resourceFile.name}" uploaded successfully! Saved locally in uploads folder.`, 
        type: 'success' 
      });
      setResourceFile(null);
      // Reset file input element
      const fileInput = document.getElementById('resource-file-input');
      if (fileInput) fileInput.value = '';

      if (onResourceUploaded) {
        onResourceUploaded(response.data.resource);
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      const errMsg = error.response?.data?.message || error.message || 'Error uploading file';
      setStatusMessage({ text: `❌ Upload failed: ${errMsg}`, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(16px)',
      borderRadius: '16px',
      padding: '24px',
      color: '#fff',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          📤
        </span>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>
            Upload Learning Resource
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            Files are stored locally on the server and made instantly available to your students
          </p>
        </div>
      </div>

      {statusMessage.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: 600,
          background: statusMessage.type === 'error' ? 'rgba(244, 63, 94, 0.15)' : statusMessage.type === 'info' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${statusMessage.type === 'error' ? 'rgba(244, 63, 94, 0.35)' : statusMessage.type === 'info' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
          color: statusMessage.type === 'error' ? '#fda4af' : statusMessage.type === 'info' ? '#93c5fd' : '#34d399'
        }}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Class Code */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Class Code:
            </label>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="e.g. CSE470"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* Resource Type */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Resource Category:
            </label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            >
              <option value="PDF">📄 PDF Document</option>
              <option value="Notes">📝 Lecture Notes</option>
              <option value="Presentation">📊 Presentation Slides (PPT/PPTX)</option>
              <option value="Assignment">✏️ Assignment Material</option>
              <option value="Other">📁 Other Resource</option>
            </select>
          </div>
        </div>

        {/* File Drop / Select Area */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
            Choose File from Local Computer:
          </label>
          <div style={{
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.4)',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input
              id="resource-file-input"
              type="file"
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
              required
            />
            {resourceFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '32px' }}>📄</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>
                  {resourceFile.name}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {(resourceFile.size / 1024).toFixed(1)} KB • Ready to upload locally
                </span>
                <span style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>
                  Click to choose a different file
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '32px' }}>📁</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                  Click or drag and drop a file here
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Supports PDF, Word (.docx), PowerPoint (.pptx), Text, Images up to 50MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={uploading || !resourceFile}
            style={{
              background: uploading || !resourceFile ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: uploading || !resourceFile ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: uploading || !resourceFile ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{uploading ? '⏳ Uploading Locally...' : '📤 Upload Resource to Server'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ResourceUpload;

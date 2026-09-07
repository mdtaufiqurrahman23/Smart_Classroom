import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function ViewStudentResources({ classCode, userRole, refreshTrigger }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Resolve role reliably
  const effectiveRole = useMemo(() => {
    if (userRole) return userRole;
    const storedRole = localStorage.getItem('role');
    if (storedRole) return storedRole;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.role || 'student';
      } catch (e) {}
    }
    return 'student';
  }, [userRole]);

  useEffect(() => {
    fetchResources();
  }, [classCode, refreshTrigger]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/resources/${classCode}`);
      setResources(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load classroom resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId, resourceTitle) => {
    if (window.confirm(`Are you sure you want to delete this resource (${resourceTitle || 'selected file'})?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/resources/${resourceId}`);
        setResources(prev => prev.filter(r => r._id !== resourceId));
      } catch (err) {
        console.error('Error deleting resource:', err);
        alert('Failed to delete resource: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      if (filterType !== 'all' && res.resourceType !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fname = (res.fileName || res.resourceFile || '').toLowerCase();
        const rtype = (res.resourceType || '').toLowerCase();
        const uploader = (res.uploadedBy || '').toLowerCase();
        return fname.includes(q) || rtype.includes(q) || uploader.includes(q);
      }
      return true;
    });
  }, [resources, searchQuery, filterType]);

  const getFileIcon = (type, filename = '') => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf' || type === 'PDF') return '📄';
    if (['ppt', 'pptx'].includes(ext) || type === 'Presentation') return '📊';
    if (['doc', 'docx', 'txt'].includes(ext) || type === 'Notes') return '📝';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return '🖼️';
    if (['zip', 'rar'].includes(ext)) return '📦';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', gap: '14px', color: '#94a3b8' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading class resources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <div>
          <h4 style={{ fontWeight: 'bold' }}>Error loading resources</h4>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>{error}</p>
          <button onClick={fetchResources} style={{ marginTop: '8px', padding: '6px 14px', borderRadius: '8px', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(16px)',
      borderRadius: '16px',
      overflow: 'hidden',
      color: '#fff',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📁</span>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>
              Classroom Resource Library ({resources.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Download official course lecture slides, readings, and reference documents
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            <option value="all">All Categories</option>
            <option value="PDF">PDF Documents</option>
            <option value="Notes">Lecture Notes</option>
            <option value="Presentation">Presentations</option>
            <option value="Assignment">Assignments</option>
            <option value="Other">Other</option>
          </select>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '8px 12px 8px 30px',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
                minWidth: '180px'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>
              🔍
            </span>
          </div>

          <button
            onClick={fetchResources}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>📂</span>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
            No Resources Found
          </h4>
          <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto' }}>
            {searchQuery || filterType !== 'all'
              ? 'No files match your search filter criteria.'
              : 'No learning resources have been uploaded to this classroom yet.'}
          </p>
        </div>
      ) : (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredResources.map((res) => {
            const displayName = res.fileName || res.resourceFile.split('/').pop();
            const icon = getFileIcon(res.resourceType, displayName);
            const sizeStr = formatFileSize(res.fileSize);
            const dateStr = res.providedAt ? new Date(res.providedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

            return (
              <div
                key={res._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                  <span style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    {icon}
                  </span>

                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, wordBreak: 'break-all' }}>
                        {displayName}
                      </h4>
                      <span style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: '#c084fc',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {res.resourceType}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>👤 {res.uploadedBy || 'Instructor'}</span>
                      {dateStr && <span>📅 {dateStr}</span>}
                      {sizeStr && <span>📦 {sizeStr}</span>}
                      <span style={{ color: '#34d399', fontSize: '11px' }}>● Stored Locally</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Download Local File Button */}
                  <a
                    href={res.resourceFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={displayName}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <span>📥</span>
                    <span>Download</span>
                  </a>

                  {/* Teacher Delete Button */}
                  {effectiveRole === 'teacher' && (
                    <button
                      onClick={() => handleDeleteResource(res._id, displayName)}
                      style={{
                        background: 'rgba(244, 63, 94, 0.15)',
                        color: '#fda4af',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Delete this resource from server"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ViewStudentResources;

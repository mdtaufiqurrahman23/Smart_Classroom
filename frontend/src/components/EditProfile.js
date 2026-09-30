// frontend/src/components/EditProfile.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function EditProfile() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        setRole(data.role);
        setName(data.name || '');
        setPhone(data.phone || '');
        setBio(data.bio || '');
        setDepartment(data.department || '');
        setStudentId(data.studentId || '');
        setEmail(data.email || '');
        setProfileImage(data.profileImage || '');
      } catch (err) {
        setError('Failed to load your profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('bio', bio);
      if (role === 'student') formData.append('department', department);
      if (imageFile) formData.append('profileImage', imageFile);

      await axios.put('http://localhost:5000/api/auth/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Profile updated!');
      setTimeout(() => {
        navigate(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
      }, 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
  };

  const avatarSrc = imagePreview || (profileImage ? `http://localhost:5000${profileImage}` : '');

  return (
    <div className="page-wrapper min-h-screen" style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>
        <div className="glass-card" style={{ maxWidth: '560px', width: '100%' }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">✏️ Edit Profile</h1>
            <p className="text-secondary">Update your info and profile picture</p>
          </div>

          {loading ? (
            <div className="loading-container"><div className="loader" /></div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-error mb-6">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="alert alert-success mb-6">
                  <span>✅</span>
                  <p>{success}</p>
                </div>
              )}

              {/* Avatar */}
              <div className="flex flex-col items-center mb-8" style={{ gap: '14px' }}>
                <div style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--border-strong)',
                  boxShadow: 'var(--glow-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--panel-solid)',
                  fontSize: '48px'
                }}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{role === 'teacher' ? '👨‍🏫' : '🎓'}</span>
                  )}
                </div>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  📷 Change Photo
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>

              {role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Student ID</label>
                    <input type="text" value={studentId} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      placeholder="e.g., CSE"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                      maxLength={30}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  placeholder="A short line about yourself (optional)"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditProfile;

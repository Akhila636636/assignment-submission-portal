import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import './SubmissionForm.css';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function SubmissionForm() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [form, setForm] = useState({ projectTitle: '', abstract: '' });
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/assignments/${assignmentId}`)
      .then((r) => setAssignment(r.data))
      .catch(() => setError('Assignment not found.'))
      .finally(() => setFetchLoading(false));
  }, [assignmentId]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('File exceeds the 10MB limit.');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please attach your PDF report.'); return; }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('projectTitle', form.projectTitle);
    formData.append('abstract', form.abstract);
    formData.append('pdf', file);

    try {
      await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Submission successful! Redirecting...');
      setTimeout(() => navigate('/student/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div className="page-wrapper">
      <Navbar />
      <div className="loading-center" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
        <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px', maxWidth: 720 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          ← Back
        </button>

        <div className="section-header">
          <div>
            <h1 className="section-title">Submit Report</h1>
            {assignment && (
              <p className="section-subtitle">
                {assignment.title} — Due {new Date(assignment.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {assignment && (
          <div className="card instructions-card animate-in">
            <h3>📋 Instructions</h3>
            <p>{assignment.instructions}</p>
          </div>
        )}

        <div className="card submission-card animate-in">
          {error   && <div className="alert alert-error"   style={{ marginBottom: 20 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>{success}</div>}

          <form onSubmit={handleSubmit} className="submission-form">
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input
                className="form-input"
                type="text"
                name="projectTitle"
                placeholder="e.g. Smart Attendance System using Face Recognition"
                value={form.projectTitle}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Abstract *</label>
              <textarea
                className="form-textarea"
                name="abstract"
                placeholder="Briefly describe your project — its objective, methodology, and outcome. (150–400 words recommended)"
                value={form.abstract}
                onChange={handleChange}
                required
                rows={6}
              />
              <span className="form-hint">{form.abstract.length} characters</span>
            </div>

            <div className="form-group">
              <label className="form-label">PDF Report * <span className="form-hint">(Max 10MB)</span></label>
              <div
                className={`drop-zone ${dragOver ? 'drop-zone-active' : ''} ${file ? 'drop-zone-filled' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="drop-zone-filled-content">
                    <span className="drop-file-icon">📄</span>
                    <div>
                      <p className="drop-file-name">{file.name}</p>
                      <p className="drop-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="drop-icon">☁️</span>
                    <p className="drop-label">Drag & drop your PDF here</p>
                    <p className="drop-sub">or <strong>click to browse</strong></p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !!success} style={{ width: '100%' }}>
              {loading ? <><span className="spinner" /> Uploading...</> : '🚀 Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

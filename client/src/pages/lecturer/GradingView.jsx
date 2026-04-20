import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Badge from '../../components/Badge';
import api from '../../services/api';
import './GradingView.css';

export default function GradingView() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [grade, setGrade]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [saved, setSaved]           = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');

  useEffect(() => {
    let objectUrl = null;
    
    api.get(`/submissions/${submissionId}`)
      .then((r) => {
        setSubmission(r.data);
        setGrade(r.data.grade || '');
        
        if (r.data.pdfFilename) {
          api.get(`/files/${r.data.pdfFilename}`, { responseType: 'blob' })
            .then((fileRes) => {
              objectUrl = URL.createObjectURL(fileRes.data);
              setPdfBlobUrl(objectUrl);
            })
            .catch((err) => console.error('Failed to load PDF blob:', err));
        }
      })
      .catch(() => setError('Submission not found or access denied.'))
      .finally(() => setLoading(false));
      
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [submissionId]);

  const handleSave = async () => {
    if (!grade.trim()) { setError('Please enter a grade before saving.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/submissions/${submissionId}/grade`, { grade });
      setSubmission(data.submission);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
        <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
      </div>
    </div>
  );

  if (error && !submission) return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '40px 24px' }}>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Back</button>
      </div>
    </div>
  );

  return (
    <div className="grading-layout">
      <Navbar />

      {/* PDF Viewer Panel */}
      <div className="pdf-panel">
        {submission?.pdfFilename ? (
          <iframe
            src={pdfBlobUrl ? `${pdfBlobUrl}#toolbar=0&navpanes=0` : ''}
            title="Student PDF Report"
            className="pdf-iframe"
          />
        ) : (
          <div className="pdf-placeholder">
            <span style={{ fontSize: '3rem' }}>📄</span>
            <p>PDF was purged from storage.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Only text metadata remains.</p>
          </div>
        )}
      </div>

      {/* Grading Side Panel */}
      <div className="grade-panel">
        <div className="grade-panel-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <Badge status={submission?.status} />
        </div>

        <div className="grade-panel-body">
          <h2 className="grade-student-name">{submission?.student?.fullName}</h2>
          <p className="grade-email">{submission?.student?.email}</p>

          <div className="divider" />

          <div className="grade-meta">
            <div className="grade-meta-row">
              <span className="grade-meta-label">Assignment</span>
              <span>{submission?.assignment?.title}</span>
            </div>
            <div className="grade-meta-row">
              <span className="grade-meta-label">Project Title</span>
              <span style={{ fontWeight: 600 }}>{submission?.projectTitle}</span>
            </div>
            <div className="grade-meta-row">
              <span className="grade-meta-label">Submitted</span>
              <span>{new Date(submission?.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          <div className="divider" />

          <div className="grade-abstract">
            <h4>Abstract</h4>
            <p>{submission?.abstract}</p>
          </div>

          <div className="divider" />

          <div className="form-group">
            <label className="form-label">Grade / Marks</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. A, 85/100, Distinction"
              value={grade}
              onChange={(e) => { setGrade(e.target.value); setError(''); setSaved(false); }}
            />
            {error && <span className="form-error">{error}</span>}
          </div>

          {saved && <div className="alert alert-success">✅ Grade saved successfully!</div>}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Grade'}
          </button>
        </div>
      </div>
    </div>
  );
}

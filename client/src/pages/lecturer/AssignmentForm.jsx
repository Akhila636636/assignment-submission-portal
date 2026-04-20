import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

export default function AssignmentForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', instructions: '', deadline: '', section: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    api.get('/sections')
      .then(res => setSections(res.data))
      .catch(err => console.error('Failed to load sections', err));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/assignments', form);
      navigate('/lecturer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setLoading(false);
    }
  };

  // Min datetime is right now (no past deadlines)
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px', maxWidth: 680 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          ← Back
        </button>
        <div className="section-header">
          <div>
            <h1 className="section-title">New Assignment</h1>
            <p className="section-subtitle">Students will see this on their dashboard immediately.</p>
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div className="form-group">
              <label className="form-label">Assignment Title *</label>
              <input
                className="form-input"
                type="text"
                name="title"
                placeholder="e.g. Mini Project Phase 2 – Final Report"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Instructions *</label>
              <textarea
                className="form-textarea"
                name="instructions"
                placeholder="Describe what students need to submit, formatting requirements, evaluation criteria, etc."
                value={form.instructions}
                onChange={handleChange}
                required
                rows={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign to Section *</label>
              <select
                className="form-select"
                name="section"
                value={form.section}
                onChange={handleChange}
                required
              >
                <option value="" disabled>-- Select a Section --</option>
                {sections.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Submission Deadline *</label>
              <input
                className="form-input"
                type="datetime-local"
                name="deadline"
                min={minDateTime}
                value={form.deadline}
                onChange={handleChange}
                required
              />
              <span className="form-hint">Students cannot submit after this date and time.</span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
              {loading ? <><span className="spinner" /> Creating...</> : '✅ Create Assignment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

export default function HodDashboard() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSectionName, setNewSectionName] = useState('');
  const [rollNumbers, setRollNumbers] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSections = () => {
    setLoading(true);
    api.get('/hod/sections')
      .then((res) => setSections(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to fetch sections'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    setError(''); setSuccess('');
    try {
      await api.post('/hod/sections', { name: newSectionName });
      setNewSectionName('');
      setSuccess('Section created successfully.');
      fetchSections();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create section.');
    }
  };

  const handleAddStudents = async (e) => {
    e.preventDefault();
    if (!selectedSection || !rollNumbers.trim()) return;
    setError(''); setSuccess('');
    try {
      const res = await api.post(`/hod/sections/${selectedSection}/students`, { rollNumbers });
      setRollNumbers('');
      setSuccess(res.data.message);
      fetchSections();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add students.');
    }
  };

  if (loading) return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
        <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <h1 className="section-title">HOD Dashboard</h1>
        <p className="section-subtitle">Manage sections and bulk enroll students.</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Create Section Card */}
          <div className="card" style={{ padding: 24, paddingBottom: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Create New Section</h3>
            <form onSubmit={handleCreateSection}>
              <div className="form-group">
                <label className="form-label">Section Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. IT-A"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Create Section</button>
            </form>
          </div>

          {/* Add Students Card */}
          <div className="card" style={{ padding: 24, paddingBottom: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Bulk Add Students</h3>
            <form onSubmit={handleAddStudents}>
              <div className="form-group">
                <label className="form-label">Select Section</label>
                <select 
                  className="form-select" 
                  value={selectedSection || ''} 
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="">-- Choose a Section --</option>
                  {sections.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Roll Numbers</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="20071A0512, 20071A0513, ..."
                  value={rollNumbers}
                  onChange={(e) => setRollNumbers(e.target.value)}
                />
                <span className="form-helper" style={{ color: 'var(--color-muted)' }}>Comma separated list</span>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add to Section</button>
            </form>
          </div>
        </div>

        {/* Existing Sections */}
        <h2 style={{ marginTop: 40, marginBottom: 16 }}>Existing Sections ({sections.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {sections.map(section => (
            <div key={section._id} className="card" style={{ padding: 24 }}>
              <h3>{section.name}</h3>
              <p style={{ color: 'var(--color-muted)', marginBottom: 12 }}>{section.students.length} Students enrolled</p>
              
              {section.students.length > 0 && (
                <div style={{ maxHeight: 150, overflowY: 'auto', background: '#f8f9fa', padding: 12, borderRadius: 6, fontSize: '0.9rem' }}>
                  {section.students.map(s => s.email.split('@')[0].toUpperCase()).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

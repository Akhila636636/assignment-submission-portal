import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Badge from '../../components/Badge';
import api from '../../services/api';

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null); // selected assignment filter
  const [sortBy, setSortBy]           = useState('date'); // 'date' | 'name' | 'status'

  useEffect(() => {
    Promise.all([api.get('/assignments'), api.get('/submissions')])
      .then(([aRes, sRes]) => {
        setAssignments(aRes.data);
        setSubmissions(sRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const visibleSubs = submissions
    .filter((s) => s.assignment?._id === selected?._id)
    .sort((a, b) => {
      if (sortBy === 'date')   return new Date(b.submittedAt) - new Date(a.submittedAt);
      if (sortBy === 'name')   return a.student?.fullName?.localeCompare(b.student?.fullName);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

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
        
        {!selected ? (
          <>
            <div className="section-header">
              <div>
                <h1 className="section-title">Assignments Overview</h1>
                <p className="section-subtitle">You have created {assignments.length} assignments.</p>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/lecturer/new-assignment')}>
                + New Assignment
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No assignments yet.</h3>
                <p>Create your first assignment to start receiving submissions.</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/lecturer/new-assignment')}>
                  + Create Assignment
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {assignments.map(a => {
                  const subsForA = submissions.filter(s => s.assignment?._id === a._id);
                  const gradedSubs = subsForA.filter(s => s.status === 'graded');
                  return (
                    <div 
                      key={a._id} 
                      className="card" 
                      style={{ padding: 24, cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--border-color)' }}
                      onClick={() => setSelected(a)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <h3 style={{ marginBottom: 8, fontSize: '1.25rem', color: 'var(--color-text)' }}>{a.title}</h3>
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                        Section: <strong>{a.section?.name || 'N/A'}</strong>
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{subsForA.length}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Submissions</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-success)' }}>{gradedSubs.length}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Graded</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⏱</span> Deadline: {new Date(a.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: 16 }}>
              ← Back to Assignments
            </button>
            <div className="section-header">
              <div>
                <h1 className="section-title">{selected.title}</h1>
                <p className="section-subtitle">
                  Section: <strong>{selected.section?.name || 'N/A'}</strong> • {visibleSubs.length} Submissions
                </p>
              </div>
              <select
                className="form-select"
                style={{ maxWidth: 160 }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Sort: Newest</option>
                <option value="name">Sort: Name A–Z</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>

            {visibleSubs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No submissions yet.</h3>
                <p>Students haven't submitted for this assignment.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Project Title</th>
                      <th>Submitted</th>
                      <th>Grade</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSubs.map((sub) => (
                      <tr key={sub._id}>
                        <td style={{ fontWeight: 600 }}>{sub.student?.fullName}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.projectTitle}
                        </td>
                        <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                          {new Date(sub.submittedAt).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ fontWeight: 600 }}>{sub.grade ?? <span style={{ color: 'var(--color-muted)' }}>—</span>}</td>
                        <td><Badge status={sub.status} /></td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/lecturer/grade/${sub._id}`)}
                          >
                            {sub.status === 'pending' ? 'Grade' : 'Review'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

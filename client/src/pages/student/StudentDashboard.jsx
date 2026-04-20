import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Badge from '../../components/Badge';
import api from '../../services/api';
import './StudentDashboard.css';

function DeadlineCountdown({ deadline }) {
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return <span className="deadline-passed">Deadline passed</span>;

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <span className={`deadline-badge ${days <= 1 ? 'deadline-urgent' : ''}`}>
      ⏱ {days}d {hours}h left
    </span>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [assignments, setAssignments]   = useState([]);
  const [submissions, setSubmissions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('active'); // 'active' | 'submitted'

  useEffect(() => {
    const init = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/submissions'),
        ]);
        setAssignments(aRes.data);
        setSubmissions(sRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const getSubmission = (assignmentId) =>
    submissions.find((s) => s.assignment?._id === assignmentId);

  const activeAssignments = assignments.filter(
    (a) => new Date(a.deadline) > new Date() && !getSubmission(a._id)
  );
  const submittedAssignments = assignments.filter((a) => getSubmission(a._id));

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="loading-center">
          <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="section-header">
          <div>
            <h1 className="section-title">My Assignments</h1>
            <p className="section-subtitle">Submit your project reports here.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/student/archive')}>
            📁 Browse Archive
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'active' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Pending ({activeAssignments.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'submitted' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('submitted')}
          >
            Submitted ({submittedAssignments.length})
          </button>
        </div>

        {/* Active Assignments */}
        {activeTab === 'active' && (
          activeAssignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <h3>All caught up!</h3>
              <p>You have no pending assignments to submit.</p>
            </div>
          ) : (
            <div className="assignment-grid">
              {activeAssignments.map((a) => (
                <div className="card assignment-card animate-in" key={a._id}>
                  <div className="assignment-card-top">
                    <span className="assignment-icon">📋</span>
                    <DeadlineCountdown deadline={a.deadline} />
                  </div>
                  <h3 className="assignment-title">{a.title}</h3>
                  <p className="assignment-instructions">{a.instructions}</p>
                  <div className="assignment-meta">
                    <span>👤 {a.createdBy?.fullName}</span>
                    <span>📅 Due: {new Date(a.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 16 }}
                    onClick={() => navigate(`/student/submit/${a._id}`)}
                  >
                    Submit Report →
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Submitted */}
        {activeTab === 'submitted' && (
          submittedAssignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No submissions yet.</h3>
              <p>Submit your first assignment from the Pending tab.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ marginTop: 8 }}>
              <table>
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Project Title</th>
                    <th>Submitted On</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedAssignments.map((a) => {
                    const sub = getSubmission(a._id);
                    return (
                      <tr key={a._id}>
                        <td style={{ fontWeight: 500 }}>{a.title}</td>
                        <td>{sub?.projectTitle}</td>
                        <td style={{ color: 'var(--color-muted)' }}>
                          {new Date(sub?.submittedAt).toLocaleDateString('en-IN')}
                        </td>
                        <td>{sub?.grade ?? <span style={{ color: 'var(--color-muted)' }}>Pending</span>}</td>
                        <td><Badge status={sub?.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

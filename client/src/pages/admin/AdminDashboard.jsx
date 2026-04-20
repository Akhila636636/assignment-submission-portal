import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import api from '../../services/api';
import './AdminDashboard.css';

const ROLES = ['student', 'lecturer', 'admin'];

export default function AdminDashboard() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('users'); // 'users' | 'actions'
  const [showAddModal, setShowAddModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [purgeModal, setPurgeModal]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg]     = useState(null); // { type, text }

  const [newUser, setNewUser] = useState({
    fullName: '', email: '', password: '', role: 'student', department: 'Computer Science & Engineering',
  });
  const [formError, setFormError]     = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/users')
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const { data } = await api.post('/admin/users', newUser);
      setUsers((prev) => [{ ...data, _id: data.id }, ...prev]);
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'student', department: 'Computer Science & Engineering' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post('/admin/archive');
      setActionMsg({ type: 'success', text: data.message });
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Archive failed.' });
    } finally {
      setActionLoading(false);
      setArchiveModal(false);
    }
  };

  const handlePurge = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post('/admin/purge');
      setActionMsg({ type: 'success', text: data.message });
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Purge failed.' });
    } finally {
      setActionLoading(false);
      setPurgeModal(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="section-header">
          <div>
            <h1 className="section-title">Admin Controls</h1>
            <p className="section-subtitle">Manage users and control the academic lifecycle.</p>
          </div>
        </div>

        {actionMsg && (
          <div className={`alert alert-${actionMsg.type}`} style={{ marginBottom: 20 }}>
            {actionMsg.text}
            <button className="btn btn-ghost btn-sm" style={{ float: 'right', marginTop: -2 }} onClick={() => setActionMsg(null)}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab-btn ${activeTab === 'users' ? 'tab-active' : ''}`} onClick={() => setActiveTab('users')}>
            👥 Users ({users.length})
          </button>
          <button className={`tab-btn ${activeTab === 'actions' ? 'tab-active' : ''}`} onClick={() => setActiveTab('actions')}>
            ⚙️ Semester Actions
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                + Add User
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                        <td style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'lecturer' ? 'badge-graded' : 'badge-pending'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{u.department}</td>
                        <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            Delete
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

        {/* Semester Actions Tab */}
        {activeTab === 'actions' && (
          <div className="actions-grid">
            <div className="action-card card">
              <div className="action-card-icon">📦</div>
              <h3>Archive Semester</h3>
              <p>
                Move all active and graded submissions into the <strong>archived</strong> state.
                Project titles and abstracts will be visible to all students in the Archive tab.
                PDFs remain accessible until purged.
              </p>
              <button className="btn btn-secondary" style={{ marginTop: 'auto' }} onClick={() => setArchiveModal(true)}>
                Run Archive
              </button>
            </div>

            <div className="action-card card">
              <div className="action-card-icon" style={{ color: 'var(--color-danger)' }}>🗑️</div>
              <h3>Purge PDF Files</h3>
              <p>
                <strong>Permanently delete</strong> all PDF files from server storage for archived submissions.
                This action is <strong>irreversible</strong>. Project titles, abstracts, and grades will remain
                in the database permanently as an institutional record.
              </p>
              <button className="btn btn-danger" style={{ marginTop: 'auto' }} onClick={() => setPurgeModal(true)}>
                Purge PDFs
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add New User</h2>
            {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Full Name" value={newUser.fullName}
                  onChange={(e) => setNewUser((p) => ({ ...p, fullName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="email@example.com" value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Min 6 characters" value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={newUser.role}
                  onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" type="text" value={newUser.department}
                  onChange={(e) => setNewUser((p) => ({ ...p, department: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <span className="spinner" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation */}
      {archiveModal && (
        <Modal
          title="Archive This Semester?"
          body="This will move all pending and graded submissions to 'archived' status. Students will be able to see project titles and abstracts in the Archive tab. You can still purge PDFs later."
          confirmLabel="Yes, Archive"
          confirmVariant="btn-secondary"
          onConfirm={handleArchive}
          onCancel={() => setArchiveModal(false)}
          loading={actionLoading}
        />
      )}

      {/* Purge Confirmation */}
      {purgeModal && (
        <Modal
          title="⚠️ Permanently Delete All PDFs?"
          body="This will PERMANENTLY delete all PDF files from the server for archived submissions. This cannot be undone. Project titles, abstracts, and grades will be preserved in the database."
          confirmLabel="Delete All PDFs"
          confirmVariant="btn-danger"
          onConfirm={handlePurge}
          onCancel={() => setPurgeModal(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

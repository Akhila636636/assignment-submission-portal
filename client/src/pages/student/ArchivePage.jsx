import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

export default function ArchivePage() {
  const [archive, setArchive]   = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/submissions/archive')
      .then((r) => setArchive(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = archive.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.projectTitle?.toLowerCase().includes(q) ||
      item.abstract?.toLowerCase().includes(q) ||
      item.student?.fullName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <div className="section-header">
          <div>
            <h1 className="section-title">📁 Project Archive</h1>
            <p className="section-subtitle">Browse completed project summaries from past semesters.</p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            className="form-input"
            style={{ maxWidth: 400 }}
            type="text"
            placeholder="🔍  Search by title, abstract, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗂️</div>
            <h3>{search ? 'No results found.' : 'Archive is empty.'}</h3>
            <p>{search ? 'Try a different search term.' : 'Projects will appear here after the semester archive.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((item) => (
              <div className="card animate-in" key={item._id} style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>
                  {item.projectTitle}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: 14 }}>
                  {item.abstract}
                </p>
                <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                  <span>👤 {item.student?.fullName}</span>
                  <span>📋 {item.assignment?.title}</span>
                  <span>📅 {new Date(item.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

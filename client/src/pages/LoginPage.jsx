import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Information Technology',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const getRoleRedirect = (role) => {
    if (role === 'student')  return '/student/dashboard';
    if (role === 'lecturer') return '/lecturer/dashboard';
    if (role === 'admin')    return '/admin/dashboard';
    return '/login';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;

      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
      navigate(getRoleRedirect(data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-logo">🎓</span>
          <h1 className="login-college">VNRVJIET</h1>
          <p className="login-dept">Department of Information Technology</p>
        </div>
        <div className="login-quote">
          <blockquote>
            "Organizing knowledge, one submission at a time."
          </blockquote>
          <p className="login-quote-sub">Assignment Submission & Archive Portal</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card animate-in">
          <div className="login-card-header">
            <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{mode === 'login' ? 'Sign in to your portal account' : 'Register with your institutional email'}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    name="fullName"
                    placeholder="e.g. Ravi Kumar"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin (HOD)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    className="form-input"
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div className="login-switch">
            {mode === 'login' ? (
              <p>New here? <button type="button" className="link-btn" onClick={() => setMode('register')}>Create an account</button></p>
            ) : (
              <p>Already have an account? <button type="button" className="link-btn" onClick={() => setMode('login')}>Sign in</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

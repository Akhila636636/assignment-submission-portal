import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getHomeLink = () => {
    if (!user) return '/login';
    if (user.role === 'student')  return '/student/dashboard';
    if (user.role === 'lecturer') return '/lecturer/dashboard';
    if (user.role === 'admin')    return '/admin/dashboard';
    if (user.role === 'hod')      return '/hod/dashboard';
    return '/login';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <NavLink to={getHomeLink()} className="navbar-brand">
          <span className="navbar-logo">🎓</span>
          <div className="navbar-brand-text">
            <span className="navbar-name">VNRVJIET</span>
            <span className="navbar-tagline">Assignment Portal</span>
          </div>
        </NavLink>

        {user && (
          <div className="navbar-right">
            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="navbar-user-info">
                <span className="navbar-user-name">{user.fullName}</span>
                <span className="navbar-user-role">{user.role}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

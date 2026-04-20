import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

// Pages
import LoginPage           from './pages/LoginPage';
import StudentDashboard    from './pages/student/StudentDashboard';
import SubmissionForm      from './pages/student/SubmissionForm';
import ArchivePage         from './pages/student/ArchivePage';
import LecturerDashboard   from './pages/lecturer/LecturerDashboard';
import GradingView         from './pages/lecturer/GradingView';
import AssignmentForm      from './pages/lecturer/AssignmentForm';
import AdminDashboard      from './pages/admin/AdminDashboard';
import HodDashboard        from './pages/hod/HodDashboard';

// ─── Protected Route Guard ────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
}

// ─── Root Redirect based on role ─────────────────────────────────────────────
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student')  return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'lecturer') return <Navigate to="/lecturer/dashboard" replace />;
  if (user.role === 'admin')    return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'hod')      return <Navigate to="/hod/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root — redirect based on role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/submit/:assignmentId" element={
            <ProtectedRoute allowedRole="student"><SubmissionForm /></ProtectedRoute>
          } />
          <Route path="/student/archive" element={
            <ProtectedRoute allowedRole="student"><ArchivePage /></ProtectedRoute>
          } />

          {/* Lecturer Routes */}
          <Route path="/lecturer/dashboard" element={
            <ProtectedRoute allowedRole="lecturer"><LecturerDashboard /></ProtectedRoute>
          } />
          <Route path="/lecturer/grade/:submissionId" element={
            <ProtectedRoute allowedRole="lecturer"><GradingView /></ProtectedRoute>
          } />
          <Route path="/lecturer/new-assignment" element={
            <ProtectedRoute allowedRole="lecturer"><AssignmentForm /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
          } />

          {/* HOD Routes */}
          <Route path="/hod/dashboard" element={
            <ProtectedRoute allowedRole="hod"><HodDashboard /></ProtectedRoute>
          } />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

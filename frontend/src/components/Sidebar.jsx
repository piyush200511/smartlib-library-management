import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper to highlight the active link
  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (!user) return null;

  return (
    <div style={{ width: '240px', background: '#1e293b', color: 'white', minHeight: '100vh', padding: '1.5rem 1rem', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 20 }}>
      
      <h1 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '2rem', color: '#38bdf8' }}>📖 LibManager</h1>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>📊 Dashboard</Link>
        <Link to="/books" className={`nav-link ${isActive('/books')}`}>📚 Books</Link>
        <Link to="/transactions" className={`nav-link ${isActive('/transactions')}`}>📖 Transactions</Link>

        {/* 👇 ONLY ADMIN AND LIBRARIAN CAN SEE THE ACTIVITY LOG */}
        {(user.role === 'admin' || user.role === 'librarian') && (
          <Link to="/notifications" className={`nav-link ${isActive('/notifications')}`}>📋 Activity Log</Link>
        )}

        {/* Only Admin can see Users */}
        {user.role === 'admin' && (
          <Link to="/users" className={`nav-link ${isActive('/users')}`}>👥 Users</Link>
        )}
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.2rem' }}>{user.name}</div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '1rem' }}>{user.role}</div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Logout
        </button>
      </div>

    </div>
  );
}
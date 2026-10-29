import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/api/users/${editingUser.id}/role?role=${newRole}`);
      addToast('Role updated successfully', 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to change role', 'error');
    }
  };

  const handleBlockToggle = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus === 'active' ? 'block' : 'unblock';
      await api.put(`/api/users/${userId}/${endpoint}`);
      addToast(`User ${endpoint}ed successfully`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Action failed', 'error');
    }
  };

  // Helper for Role Badge colors
  const getRoleBadge = (role) => {
    if (role === 'admin') return { bg: '#e0f2fe', color: '#0369a1', label: 'Admin 👑' };
    if (role === 'librarian') return { bg: '#dcfce7', color: '#166534', label: 'Librarian 📚' };
    return { bg: '#f3f4f6', color: '#4b5563', label: 'Member 🎓' };
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem' }}>Manage Users</h1>

      <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSuperAdmin = u.role === 'admin';
              const badge = getRoleBadge(u.role);
              
              return (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: '600' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{ 
                      background: badge.bg, color: badge.color, 
                      padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' 
                    }}>
                      {badge.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      background: u.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: u.status === 'active' ? '#166534' : '#991b1b',
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize'
                    }}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Edit Role Button (Not for Admin) */}
                      {!isSuperAdmin && (
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="btn btn-ghost" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1' }}
                        >
                          Edit Role
                        </button>
                      )}
                      
                      {/* Block Button (Not for Admin) */}
                      {!isSuperAdmin && (
                        <button 
                          onClick={() => handleBlockToggle(u.id, u.status)} 
                          className={`btn ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        >
                          {u.status === 'active' ? 'Block' : 'Unblock'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Change Role</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Updating role for <strong>{editingUser.name}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)}
                style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                <option value="member">Member</option>
                <option value="librarian">Librarian</option>
              </select>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '0.6rem', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button onClick={handleSaveRole} className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
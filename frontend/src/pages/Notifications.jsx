import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation(); 

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/notifications/activity');
        setNotifications(res.data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load activity log. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, [location.pathname]); 

  if (loading) return <div style={{ padding: '2rem' }}>Loading activity log...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>Activity Log</h1>
        <p style={{ color: '#6b7280' }}>A complete history of all library actions, issues, and alerts.</p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📭</span>
            No activity recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n, index) => (
              <div key={n.id} style={{ 
                padding: '1.5rem', 
                borderBottom: index !== notifications.length - 1 ? '1px solid #e5e7eb' : 'none', 
                display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
                background: n.is_read ? 'white' : '#f0f9ff'
              }}>
                
                <div style={{ 
                  fontSize: '1.5rem', 
                  width: '50px', height: '50px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: n.type === 'success' ? '#dcfce7' : n.type === 'warning' ? '#fee2e2' : '#e0f2fe',
                  flexShrink: 0
                }}>
                  {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                      {n.title || 'System Notification'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>
                      {/* 👇 FIXED TIMEZONE HERE */}
                      {new Date(n.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#4b5563', margin: 0 }}>
                    {n.message}
                  </p>
                </div>

                <div>
                  <span style={{ 
                    background: n.type === 'success' ? '#dcfce7' : n.type === 'warning' ? '#fee2e2' : '#e0f2fe', 
                    color: n.type === 'success' ? '#166534' : n.type === 'warning' ? '#991b1b' : '#0369a1', 
                    padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' 
                  }}>
                    {n.type}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
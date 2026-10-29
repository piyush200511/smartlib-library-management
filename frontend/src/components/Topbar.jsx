import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../api/client';

export default function Topbar() {
  const { user } = useAuth(); 
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleOpenPanel = async () => {
    setShowPanel(true);
    if (unreadCount > 0) {
      try {
        await api.put('/api/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getAvatar = (role) => {
    if (role === 'admin') return '👑';
    if (role === 'librarian') return '📚';
    return '🎓';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Hello";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";
    return `${greeting}, ${user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} ☀️`;
  };

  const isDashboard = location.pathname.includes('/dashboard');

  return (
    <>
      <div style={{ 
        height: '70px', background: 'white', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 10
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isDashboard && (
            <span style={{ fontSize: '1.1rem', color: '#374151', fontWeight: '600' }}>
              {getGreeting()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          
          <div 
            onClick={handleOpenPanel}
            style={{ fontSize: '1.4rem', cursor: 'pointer', position: 'relative', userSelect: 'none' }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', top: '-6px', right: '-8px', background: '#ef4444', color: 'white', 
                fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '50%',
                border: '2px solid white'
              }}>
                {unreadCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '42px', height: '42px', borderRadius: '50%', 
              background: user?.role === 'admin' ? '#e0f2fe' : user?.role === 'librarian' ? '#dcfce7' : '#f3f4f6', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '1.3rem', border: '2px solid #e5e7eb'
            }}>
              {getAvatar(user?.role)}
            </div>

            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize', fontWeight: '500' }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </div>

      {showPanel && (
        <>
          <div 
            onClick={() => setShowPanel(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(2px)' }} 
          />
          
          <div style={{ 
            position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh', 
            background: '#f9fafb', zIndex: 1000, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out'
          }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Alerts</h2>
              <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div className="alert-scroll" style={{ 
              flex: 1, padding: '1rem', overflowY: 'auto', overscrollBehavior: 'contain'
            }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
                  <span style={{ fontSize: '2rem' }}>✅</span>
                  <p>All clear! No alerts right now.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{ 
                    padding: '1rem', marginBottom: '0.8rem', borderRadius: '8px', 
                    background: n.is_read ? 'white' : '#fff7ed',
                    border: n.is_read ? '1px solid #e5e7eb' : '1px solid #fdba74',
                    display: 'flex', gap: '1rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>
                      {n.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827' }}>
                        {n.title || 'Alert'}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: '0.2rem 0 0.5rem 0', lineHeight: '1.4' }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500' }}>
                        {/* 👇 FIXED TIMEZONE HERE */}
                        {new Date(n.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
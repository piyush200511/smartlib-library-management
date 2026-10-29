import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in, skip the landing page and go straight to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // 👇 Make the whole page clickable
  return (
    <div 
      onClick={() => navigate('/login')}
      style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        color: 'white',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        cursor: 'pointer' // Shows the hand cursor to indicate it's clickable
      }}
    >
      
      {/* Decorative Background Shapes */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px', background: 'rgba(14, 165, 233, 0.2)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

      {/* Top Navigation Bar for Landing Page (Just the logo now) */}
      <nav style={{ padding: '2rem 4rem', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <span>📖</span> SmartLib
        </h1>
      </nav>

      {/* Main Hero Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 2rem', position: 'relative', zIndex: 10 }}>
        
        <span style={{ background: '#0ea5e9', color: 'white', padding: '0.3rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '2rem' }}>
          V2.0 IS NOW LIVE
        </span>

        <h1 style={{ fontSize: '4rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '800px' }}>
          The Intelligent <span style={{ color: '#38bdf8' }}>Library</span> Management System.
        </h1>
        
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', marginBottom: '3rem', lineHeight: 1.6 }}>
          Automate your library workflows, track inventory, manage users with strict RBAC, and gain deep insights with our interactive dashboards.
        </p>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', gap: '3rem', marginTop: '2rem', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#10b981' }}>✓</span> Barcode Scanning
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#10b981' }}>✓</span> Real-time Alerts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#10b981' }}>✓</span> Smart Recommendations
          </div>
        </div>

        {/* Small hint text at the bottom */}
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4rem', animation: 'pulse 2s infinite' }}>
          Click anywhere to enter →
        </p>

      </div>
    </div>
  );
}
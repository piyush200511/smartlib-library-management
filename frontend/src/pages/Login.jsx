import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        addToast('Logged in successfully!', 'success');
        navigate('/dashboard');
      } else {
        await api.post('/api/auth/register', { name, email, password });
        addToast('Registered successfully! Please login.', 'success');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Something went wrong';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      
      {/* 🚀 LEFT SIDE: BRANDING BANNER */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', 
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '4rem', color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '500px' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>📖</span>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.02em' }}>SmartLib</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, lineHeight: 1.6 }}>
            The intelligent, automated library management system for modern institutions. Track books, manage users, and analyze data effortlessly.
          </p>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>10k+</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Books Managed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>5k+</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Active Members</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>99.9%</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔐 RIGHT SIDE: LOGIN FORM */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8fafc' }}>
        
        {/* Card Container */}
        <div style={{ 
          width: '100%', maxWidth: '440px', 
          background: 'white', padding: '3rem', 
          borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
          border: '1px solid #f1f5f9'
        }}>
          
          {/* Logo Icon (Back to landing page) */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.5rem' }}>
              📖
            </div>
          </Link>

          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
              {/* 👇 UPDATED TEXT HERE */}
              {isLogin ? 'Sign in to SmartLib' : 'Create an account'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              {isLogin ? 'Enter your credentials to access the dashboard.' : 'Join us to start borrowing books.'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: '2rem', background: '#f1f5f9', borderRadius: '8px', padding: '0.3rem' }}>
            <button 
              onClick={() => setIsLogin(true)}
              style={{ flex: 1, padding: '0.6rem', border: 'none', background: isLogin ? 'white' : 'transparent', borderRadius: '6px', fontWeight: '600', color: isLogin ? '#0f172a' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              style={{ flex: 1, padding: '0.6rem', border: 'none', background: !isLogin ? 'white' : 'transparent', borderRadius: '6px', fontWeight: '600', color: !isLogin ? '#0f172a' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Register
            </button>
          </div>

          {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: '500', border: '1px solid #fecaca' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#334155' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>👤</span>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#0f172a' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#334155' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>📧</span>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#0f172a' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#334155' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔒</span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', color: '#0f172a' }} 
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ cursor: 'pointer' }} /> Remember me
                </label>
                <a href="#" style={{ fontSize: '0.85rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>Forgot password?</a>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: '#0ea5e9', color: 'white', padding: '0.85rem', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)' }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
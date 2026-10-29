import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalBooks: 0, availableBooks: 0, issuedBooks: 0,
    totalMembers: 0, overdueBooks: 0, pendingFines: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const booksRes = await api.get('/api/books/');
        const books = booksRes.data;
        
        let issuedCount = 0;
        let overdueCount = 0;
        let fineTotal = 0;
        let totalMembers = 0;
        
        // Prepare chart data
        const categories = {};
        books.forEach(b => {
          categories[b.category] = (categories[b.category] || 0) + b.total_copies;
        });
        const chartArray = Object.keys(categories).map(key => ({
          name: key, books: categories[key]
        })).slice(0, 5);
        setChartData(chartArray);

        if (user.role === 'admin' || user.role === 'librarian') {
          const txnsRes = await api.get('/api/transactions/all');
          const activeTxns = txnsRes.data.filter(t => t.status === 'issued');
          
          issuedCount = activeTxns.length;
          overdueCount = activeTxns.filter(t => new Date(t.due_date) < new Date()).length;
          fineTotal = txnsRes.data.filter(t => !t.fine_paid).reduce((sum, t) => sum + t.fine, 0);

          if (user.role === 'admin') {
            const usersRes = await api.get('/api/users/');
            totalMembers = usersRes.data.length;
          }

          // Fetch Recent Activity
          const recentRes = await api.get('/api/transactions/recent');
          setRecentTxns(recentRes.data);
        }

        const availableCount = books.reduce((sum, b) => sum + b.available_copies, 0);

        setStats({
          totalBooks: books.length,
          availableBooks: availableCount,
          issuedBooks: issuedCount,
          totalMembers: totalMembers,
          overdueBooks: overdueCount,
          pendingFines: fineTotal
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{ background: 'white', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '1.8rem', background: `${color}20`, padding: '0.8rem', borderRadius: '10px', color: color }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '600', marginBottom: '0.2rem' }}>{title}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827' }}>{value}</div>
      </div>
    </div>
  );

  if (loading) return <div>Loading SmartLib Dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>Overview</h1>
        <p style={{ color: '#6b7280' }}>Welcome back, here is your library summary.</p>
      </div>

      {/* 6 STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Books" value={stats.totalBooks} icon="📚" color="#0ea5e9" />
        <StatCard title="Available Books" value={stats.availableBooks} icon="✅" color="#10b981" />
        <StatCard title="Issued Books" value={stats.issuedBooks} icon="📖" color="#6366f1" />
        {user.role === 'admin' && <StatCard title="Total Members" value={stats.totalMembers} icon="👥" color="#f59e0b" />}
        <StatCard title="Overdue Books" value={stats.overdueBooks} icon="⚠️" color="#ef4444" />
        <StatCard title="Pending Fines" value={`₹${stats.pendingFines}`} icon="💰" color="#8b5cf6" />
      </div>

      {/* CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Library Usage (This Month)</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: 'Week 1', usage: 40 }, { name: 'Week 2', usage: 65 },
                { name: 'Week 3', usage: 45 }, { name: 'Week 4', usage: stats.issuedBooks * 10 + 20 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="usage" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Books by Category</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="books" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY & QUICK ACTIONS */}
      {user.role !== 'member' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          
          {/* Recent Activity Table */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Activity</h3>
              <Link to="/transactions" style={{ fontSize: '0.85rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>View All</Link>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map(txn => (
                  <tr key={txn.id}>
                    <td style={{ fontWeight: '600' }}>{txn.user_name}</td>
                    <td style={{ color: '#0ea5e9', fontWeight: '500' }}>{txn.book_title}</td>
                    <td>{new Date(txn.issue_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
                    <td>
                      <span style={{
                        background: txn.status === 'returned' ? '#dcfce7' : '#dbeafe',
                        color: txn.status === 'returned' ? '#166534' : '#1e40af',
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize'
                      }}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Quick Actions</h3>
            
            <Link to="/books" className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: '#111827', padding: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <span>📚 Manage Books</span> <span>→</span>
            </Link>
            
            <Link to="/transactions" className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: '#111827', padding: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <span>📖 Issue / Return</span> <span>→</span>
            </Link>
            
            {user.role === 'admin' && (
              <Link to="/users" className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: '#111827', padding: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <span>👥 Manage Users</span> <span>→</span>
              </Link>
            )}
            
            <Link to="/upload" className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: '#111827', padding: '1rem', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <span>📥 Import CSV</span> <span>→</span>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
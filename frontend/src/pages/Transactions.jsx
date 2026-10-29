import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Transactions() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isStaff = user.role === 'admin' || user.role === 'librarian';

  const [transactions, setTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [issueBookId, setIssueBookId] = useState('');
  const [issueUserId, setIssueUserId] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const txnRes = await api.get(isStaff ? '/api/transactions/all' : '/api/transactions/my-history');
      setTransactions(txnRes.data.reverse());

      if (isStaff) {
        const booksRes = await api.get('/api/books/');
        setBooks(booksRes.data.filter(b => b.available_copies > 0));
        
        if (user.role === 'admin') {
          const usersRes = await api.get('/api/users/');
          setUsers(usersRes.data);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    setError('');
    if (!issueBookId || !issueUserId) return setError('Please select both a book and a user');

    try {
      await api.post(`/api/transactions/issue/${issueBookId}/${issueUserId}`);
      addToast('Book issued successfully!', 'success');
      setIssueBookId('');
      setIssueUserId('');
      fetchData(); 
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to issue book';
      setError(msg);
      addToast(msg, 'error');
    }
  };

  const handleReturn = async (txnId) => {
    if (!window.confirm('Are you sure you want to return this book?')) return;
    try {
      const res = await api.post(`/api/transactions/return/${txnId}`);
      if (res.data.fine > 0) {
        addToast(`Book returned! Fine: ₹${res.data.fine.toFixed(2)}`, 'warning');
      } else {
        addToast('Book returned successfully! No fines.', 'success');
      }
      fetchData(); 
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to return book', 'error');
    }
  };

  const handlePayFine = async (txnId) => {
    if (!window.confirm('Confirm that the user has paid this fine?')) return;
    try {
      await api.put(`/api/transactions/pay-fine/${txnId}`);
      addToast('Fine cleared successfully!', 'success');
      fetchData(); 
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to pay fine', 'error');
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return addToast('No data to export', 'error');
    const headers = ['Txn ID', 'User Name', 'Book Title', 'Issue Date', 'Due Date', 'Status', 'Fine'];
    const rows = transactions.map(t => [
      t.id, t.user_name, `"${t.book_title}"`, 
      new Date(t.issue_date).toLocaleDateString(), new Date(t.due_date).toLocaleDateString(),
      t.status, t.fine
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Library_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report downloaded successfully!', 'success');
  };

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  if (loading) return <div>Loading transactions...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
          {isStaff ? 'Manage Transactions' : 'My Borrowing History'}
        </h1>
        {isStaff && (
          <button onClick={exportToCSV} className="btn btn-success" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            📥 Export to Excel
          </button>
        )}
      </div>

      {isStaff && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Issue a Book</h2>
          {error && <div style={{ color: '#991b1b', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          <form onSubmit={handleIssue} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.3rem' }}>Select Book</label>
              <select value={issueBookId} onChange={e => setIssueBookId(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <option value="">-- Choose Book --</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title} (ID: {b.id})</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.3rem' }}>Select User (ID)</label>
              {user.role === 'admin' ? (
                <select value={issueUserId} onChange={e => setIssueUserId(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                  <option value="">-- Choose User --</option>
                  {users.filter(u => u.role === 'member').map(u => <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>)}
                </select>
              ) : (
                <input type="number" placeholder="Enter User ID manually" value={issueUserId} onChange={e => setIssueUserId(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Issue Book</button>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No transactions found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Txn ID</th>
                {isStaff && <th>User Name</th>}
                <th>Book Title</th>
                <th>Issued Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Fine</th>
                {isStaff && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => {
                const isOverdue = txn.status === 'issued' && new Date(txn.due_date) < new Date();
                return (
                  <tr key={txn.id}>
                    <td>#{txn.id}</td>
                    {isStaff && <td style={{ fontWeight: '600' }}>{txn.user_name}</td>}
                    <td style={{ fontWeight: '600', color: '#0ea5e9' }}>{txn.book_title}</td>
                    <td>{fmtDate(txn.issue_date)}</td>
                    <td style={{ color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? '600' : 'normal' }}>
                      {fmtDate(txn.due_date)} {isOverdue && '(Overdue)'}
                    </td>
                    <td>
                      <span style={{ 
                        background: txn.status === 'returned' ? '#dcfce7' : '#dbeafe',
                        color: txn.status === 'returned' ? '#166534' : '#1e40af',
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize'
                      }}>
                        {txn.status}
                      </span>
                    </td>
                    {/* 👇 NEW FINE COLUMN LOGIC */}
                    <td>
                      {txn.fine > 0 ? (
                        txn.fine_paid ? (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>
                            Paid
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#ef4444', fontWeight: '700' }}>₹{txn.fine.toFixed(2)}</span>
                            {isStaff && (
                              <button onClick={() => handlePayFine(txn.id)} className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1' }}>
                                Mark Paid
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        <span style={{ color: '#6b7280' }}>—</span>
                      )}
                    </td>
                    {isStaff && (
                      <td>
                        {txn.status === 'issued' && (
                          <button onClick={() => handleReturn(txn.id)} className="btn btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                            Return
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
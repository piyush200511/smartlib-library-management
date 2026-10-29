import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Books() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newBook, setNewBook] = useState({
    isbn: '', title: '', author: '', category: '', total_copies: 1, rack_no: ''
  });
  const [error, setError] = useState('');
  
  // Scanner State
  const [showScanner, setShowScanner] = useState(false);

  // Fetch books on load
  const fetchBooks = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/api/books/?search=${query}`);
      setBooks(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load books', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Setup Barcode/QR Scanner
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
      });

      scanner.render((decodedText) => {
        // When successfully scanned, auto-fill the ISBN
        setNewBook(prev => ({ ...prev, isbn: decodedText }));
        setShowScanner(false);
        scanner.clear();
        addToast('Barcode Scanned Successfully!', 'success');
      }, (error) => {
        // Ignore scan errors
      });

      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [showScanner]);

  // Handle Search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(search);
  };

  // Handle Add Book Submit
  const handleAddBook = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/books/', {
        ...newBook,
        total_copies: parseInt(newBook.total_copies)
      });
      setShowModal(false);
      setNewBook({ isbn: '', title: '', author: '', category: '', total_copies: 1, rack_no: '' });
      fetchBooks(); // Refresh list
      addToast('Book added successfully!', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add book';
      setError(msg);
      addToast(msg, 'error');
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Books Catalog</h1>
        
        {/* Only Admin & Librarian can Add Books or Import */}
        {(user.role === 'admin' || user.role === 'librarian') && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/upload')} className="btn btn-success">
              📥 Import CSV
            </button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              + Add New Book
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Search by title, author, or ISBN..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {/* Books Table */}
      <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading books...</div>
        ) : books.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No books found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>ISBN</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id}>
                  <td style={{ fontWeight: '600' }}>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td style={{ color: '#6b7280' }}>{book.isbn}</td>
                  <td>
                    <span style={{ 
                      background: book.available_copies > 0 ? '#dcfce7' : '#fee2e2',
                      color: book.available_copies > 0 ? '#166534' : '#991b1b',
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600'
                    }}>
                      {book.available_copies} / {book.total_copies}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Book Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Book</h2>
            
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

            <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* ISBN with Scan Button */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="ISBN" 
                  required 
                  value={newBook.isbn} 
                  onChange={e => setNewBook({...newBook, isbn: e.target.value})} 
                  style={{ flex: 1, padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowScanner(true)} 
                  className="btn btn-ghost" 
                  style={{ padding: '0 1rem', background: '#e0f2fe', color: '#0369a1' }}
                >
                  📷 Scan
                </button>
              </div>

              <input type="text" placeholder="Title" required value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input type="text" placeholder="Author" required value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              <input type="text" placeholder="Category" required value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})} style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="number" placeholder="Total Copies" min="1" required value={newBook.total_copies} onChange={e => setNewBook({...newBook, total_copies: e.target.value})} style={{ flex: 1, padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                <input type="text" placeholder="Rack No (optional)" value={newBook.rack_no} onChange={e => setNewBook({...newBook, rack_no: e.target.value})} style={{ flex: 1, padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.6rem', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Scan Book Barcode (ISBN)</h3>
            <div id="reader" style={{ width: '100%' }}></div>
            <button onClick={() => setShowScanner(false)} className="btn btn-danger" style={{ marginTop: '1rem', width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}
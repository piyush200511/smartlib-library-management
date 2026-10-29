import { useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { addToast } = useToast();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return addToast('Please select a CSV file first', 'error');

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/api/import/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      setFile(null);
      e.target.reset(); // clear file input
      addToast('Import processed successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem' }}>Bulk Import Books</h1>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Upload a <strong>.csv</strong> file with columns: <code>isbn, title, author, category, total_copies, rack_no</code>
        </p>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => setFile(e.target.files[0])}
            style={{ padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>

        {/* Show results */}
        {result && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: result.inserted > 0 ? '#f0fdf4' : '#fffbeb', 
            border: result.inserted > 0 ? '1px solid #bbf7d0' : '1px solid #fde68a', 
            borderRadius: '6px' 
          }}>
            <h3 style={{ color: result.inserted > 0 ? '#166534' : '#92400e', marginBottom: '0.5rem' }}>
              {result.inserted > 0 ? 'Import Successful' : 'Import Warning'}
            </h3>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: result.inserted > 0 ? '#166534' : '#92400e' }}>
              <li>Inserted: {result.inserted}</li>
              <li>Skipped (duplicates): {result.skipped_duplicates}</li>
              <li>Errors: {result.errors.length}</li>
            </ul>
            {result.inserted === 0 && (
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#92400e' }}>
                No new items were added because they already exist in the database.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
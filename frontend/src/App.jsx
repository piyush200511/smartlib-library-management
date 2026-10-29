import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing'; // <-- Import Landing
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import Upload from './pages/Upload';
import Notifications from './pages/Notifications';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function StaffRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin' && user.role !== 'librarian') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} /> {/* <-- Landing is now home */}
      <Route path="/login" element={<Login />} /> {/* <-- Login moved here */}

      {/* Protected Routes */}
      <Route 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/books" element={<Books />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/upload" element={<Upload />} />
        
        <Route 
          path="/notifications" 
          element={<StaffRoute><Notifications /></StaffRoute>} 
        />

        <Route 
          path="/users" 
          element={<AdminRoute><Users /></AdminRoute>} 
        />
      </Route>
    </Routes>
  );
}
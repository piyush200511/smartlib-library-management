import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    if (token && role) {
      setUser({ name, role });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { access_token, role, name } = response.data;

    localStorage.setItem('token', access_token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);

    setUser({ name, role });
    return response.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    // Note: The Sidebar already redirects to '/' on logout.
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
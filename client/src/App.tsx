import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { api } from './api';
import Header from './components/Header';
import Login from './pages/Login';
import SubmitComplaint from './pages/SubmitComplaint';
import MyTickets from './pages/MyTickets';
import TicketDetail from './pages/TicketDetail';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const u = await api.getMe();
      setUser(u as User);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const handleLogin = (token: string, u: User) => {
    localStorage.setItem('token', token);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100, color: '#999' }}>加载中...</div>;

  return (
    <BrowserRouter>
      {user && <Header user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={getDefaultRoute(user)} />} />
        <Route path="/submit" element={user?.role === 'passenger' ? <SubmitComplaint /> : <Navigate to="/login" />} />
        <Route path="/my-tickets" element={user?.role === 'passenger' ? <MyTickets /> : <Navigate to="/login" />} />
        <Route path="/ticket/:id" element={user ? <TicketDetail user={user} /> : <Navigate to="/login" />} />
        <Route path="/staff" element={user?.role === 'staff' ? <StaffDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? getDefaultRoute(user) : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

function getDefaultRoute(user: User): string {
  if (user.role === 'passenger') return '/my-tickets';
  if (user.role === 'staff') return '/staff';
  return '/admin';
}

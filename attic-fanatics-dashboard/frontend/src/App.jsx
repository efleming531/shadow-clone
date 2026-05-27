import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import FunnelPage from './pages/FunnelPage';
import SalesLeaderboard from './pages/SalesLeaderboard';
import RepDetail from './pages/RepDetail';
import CallCenterLeaderboard from './pages/CallCenterLeaderboard';
import AgentDetail from './pages/AgentDetail';
import DataEntry from './pages/DataEntry';
import UserManagement from './pages/UserManagement';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-bg-primary flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole === 'OWNER' && user.role !== 'OWNER') return <Navigate to="/" replace />;
  if (requiredRole === 'OWNER_MANAGER' && !['OWNER', 'MANAGER'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="funnel/:slug" element={<FunnelPage />} />
        <Route path="sales" element={<SalesLeaderboard />} />
        <Route path="sales/rep/:id" element={<RepDetail />} />
        <Route path="call-center" element={<CallCenterLeaderboard />} />
        <Route path="call-center/agent/:id" element={<AgentDetail />} />
        <Route path="data-entry" element={<ProtectedRoute requiredRole="OWNER_MANAGER"><DataEntry /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute requiredRole="OWNER"><UserManagement /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

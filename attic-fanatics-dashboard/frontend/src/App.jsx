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
import LeadsKanban from './pages/LeadsKanban';
import LeadsListPage from './pages/LeadsListPage';
import LeadDetail from './pages/LeadDetail';
import EstimatesPage from './pages/EstimatesPage';
import EstimateBuilder from './pages/EstimateBuilder';
import JobsPage from './pages/JobsPage';
import JobDetail from './pages/JobDetail';
import CustomersPage from './pages/CustomersPage';
import CustomerDetail from './pages/CustomerDetail';
import MembershipPage from './pages/MembershipPage';
import ReputationPage from './pages/ReputationPage';
import CommissionPage from './pages/CommissionPage';
import VelocityPage from './pages/VelocityPage';
import ForecastingPage from './pages/ForecastingPage';
import TerritoryPage from './pages/TerritoryPage';
import AlertsPage from './pages/AlertsPage';
import SOPsPage from './pages/SOPsPage';
import UnitEconomicsPage from './pages/UnitEconomicsPage';
import ProfilePage from './pages/ProfilePage';
import PipelineSettingsPage from './pages/PipelineSettingsPage';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
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
        {/* Core dashboard */}
        <Route index element={<Overview />} />
        <Route path="funnel/:slug" element={<FunnelPage />} />
        <Route path="sales" element={<SalesLeaderboard />} />
        <Route path="sales/rep/:id" element={<RepDetail />} />
        <Route path="call-center" element={<CallCenterLeaderboard />} />
        <Route path="call-center/agent/:id" element={<AgentDetail />} />

        {/* CRM */}
        <Route path="leads" element={<LeadsListPage />} />
        <Route path="leads/kanban" element={<LeadsKanban />} />
        <Route path="leads/:id" element={<LeadDetail />} />

        {/* Estimates */}
        <Route path="estimates" element={<EstimatesPage />} />
        <Route path="estimates/new" element={<ProtectedRoute requiredRole="OWNER_MANAGER"><EstimateBuilder /></ProtectedRoute>} />
        <Route path="estimates/:id" element={<EstimateBuilder />} />

        {/* Jobs & Customers */}
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetail />} />

        {/* Revenue Ops */}
        <Route path="membership" element={<MembershipPage />} />
        <Route path="commission" element={<ProtectedRoute requiredRole="OWNER_MANAGER"><CommissionPage /></ProtectedRoute>} />
        <Route path="reputation" element={<ReputationPage />} />

        {/* Intelligence */}
        <Route path="velocity" element={<VelocityPage />} />
        <Route path="forecasting" element={<ForecastingPage />} />
        <Route path="territory" element={<TerritoryPage />} />
        <Route path="unit-economics" element={<ProtectedRoute requiredRole="OWNER_MANAGER"><UnitEconomicsPage /></ProtectedRoute>} />

        {/* Operations */}
        <Route path="sops" element={<SOPsPage />} />
        <Route path="alerts" element={<ProtectedRoute requiredRole="OWNER_MANAGER"><AlertsPage /></ProtectedRoute>} />
        <Route path="data-entry" element={<ProtectedRoute requiredRole="OWNER_MANAGER"><DataEntry /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute requiredRole="OWNER"><UserManagement /></ProtectedRoute>} />
        <Route path="pipeline-settings" element={<ProtectedRoute requiredRole="OWNER_MANAGER"><PipelineSettingsPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
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

import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEmployee } from './context/EmployeeContext';
import LoginScreen from './screens/LoginScreen';
import GridScreen from './screens/GridScreen';
import DetailsScreen from './screens/DetailsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const NAV_ITEMS = [
  {
    id: 'list', label: 'Employees', path: '/list',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h18M3 14h18M10 6h4M10 18h4M4 6h.01M4 18h.01M20 6h.01M20 18h.01" />
      </svg>
    ),
  },
  {
    id: 'analytics', label: 'Analytics', path: '/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function DashboardShell({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.id || 'list';

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#0f0f1a]">
      <nav className="flex items-center justify-center gap-4 py-6">
        {NAV_ITEMS.map(item => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: isActive ? '#a5b4fc' : '#9ca3af',
                border: isActive ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
              }}
            >
              {item.label}
            </button>
          );
        })}
        <button
          onClick={logout}
          className="btn-ghost px-6 py-2 text-sm"
        >
          Logout
        </button>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pb-12">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { employees, setSelectedEmployee } = useEmployee();

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      <Route path="/list" element={
        <ProtectedRoute>
          <DashboardShell>
            <GridScreen onSelectEmployee={handleSelectEmployee} />
          </DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/details/:id" element={
        <ProtectedRoute>
          <DashboardShell>
            <DetailsScreenWrapper employees={employees} />
          </DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute>
          <DashboardShell>
            <AnalyticsScreen />
          </DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/list' : '/login'} replace />;
}

function DetailsScreenWrapper({ employees }) {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.pathname.split('/details/')[1];
  const emp = employees.find(e => String(e.id) === String(id))
    || location.state?.employee
    || null;

  if (!emp) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-400">Employee not found (ID: {id})</p>
        <button className="btn-ghost text-sm" onClick={() => navigate('/list')}>← Back to List</button>
      </div>
    );
  }
  return <DetailsScreen employee={emp} onBack={() => navigate('/list')} />;
}

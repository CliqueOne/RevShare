import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Referrers } from './pages/Referrers';
import { Leads } from './pages/Leads';
import { Deals } from './pages/Deals';
import { Commissions } from './pages/Commissions';
import { Payouts } from './pages/Payouts';
import { DashboardLayout } from './components/DashboardLayout';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return showSignup ? (
      <Signup onToggle={() => setShowSignup(false)} />
    ) : (
      <Login onToggle={() => setShowSignup(true)} />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'referrers':
        return <Referrers />;
      case 'leads':
        return <Leads />;
      case 'deals':
        return <Deals />;
      case 'commissions':
        return <Commissions />;
      case 'payouts':
        return <Payouts />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useCompany } from './hooks/useCompany';
import { useReferrer } from './hooks/useReferrer';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { LeadCapture } from './pages/LeadCapture';
import { Dashboard } from './pages/Dashboard';
import { Referrers } from './pages/Referrers';
import { Leads } from './pages/Leads';
import { Deals } from './pages/Deals';
import { Commissions } from './pages/Commissions';
import { Payouts } from './pages/Payouts';
import { ReferrerDashboard } from './pages/ReferrerDashboard';
import { ReferrerLeads } from './pages/ReferrerLeads';
import { ReferrerCommissions } from './pages/ReferrerCommissions';
import { DashboardLayout } from './components/DashboardLayout';
import { ReferrerLayout } from './components/ReferrerLayout';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { currentCompany, loading: companyLoading } = useCompany();
  const { referrer, loading: referrerLoading } = useReferrer();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const urlParams = new URLSearchParams(window.location.search);
  const hasRefCode = urlParams.has('ref');
  const isLeadCapturePath = window.location.pathname.includes('lead');
  const isSignupPath = window.location.pathname.includes('signup');
  const [showSignup, setShowSignup] = useState(hasRefCode || isSignupPath);

  if (isLeadCapturePath && hasRefCode) {
    return <LeadCapture />;
  }

  const loading = authLoading || companyLoading || referrerLoading;

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

  const isReferrerOnly = referrer && !currentCompany;

  if (isReferrerOnly) {
    const renderReferrerPage = () => {
      switch (currentPage) {
        case 'dashboard':
          return <ReferrerDashboard onNavigate={setCurrentPage} />;
        case 'leads':
          return <ReferrerLeads />;
        case 'commissions':
          return <ReferrerCommissions />;
        default:
          return <ReferrerDashboard onNavigate={setCurrentPage} />;
      }
    };

    return (
      <ReferrerLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderReferrerPage()}
      </ReferrerLayout>
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

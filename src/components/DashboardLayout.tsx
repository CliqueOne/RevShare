import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../hooks/useCompany';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  DollarSign,
  CreditCard,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const { currentCompany, companies, switchCompany, hasPermission } = useCompany();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', permission: 'member' as const },
    { name: 'Referrers', icon: Users, page: 'referrers', permission: 'member' as const },
    { name: 'Leads', icon: UserPlus, page: 'leads', permission: 'member' as const },
    { name: 'Deals', icon: Briefcase, page: 'deals', permission: 'member' as const },
    { name: 'Commissions', icon: DollarSign, page: 'commissions', permission: 'member' as const },
    // { name: 'Payouts', icon: CreditCard, page: 'payouts', permission: 'admin' as const },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="font-bold text-xl text-slate-900">RevShare</div>
          <div className="w-10" />
        </div>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200">
            <div className="font-bold text-2xl text-slate-900">RevShare</div>
            <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
          </div>

          {currentCompany && companies.length > 0 && (
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Building2 className="w-5 h-5 text-slate-600" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-slate-900">{currentCompany.name}</div>
                  </div>
                </button>

                {showCompanyDropdown && companies.length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                    {companies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => {
                          switchCompany(company.id);
                          setShowCompanyDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                          company.id === currentCompany.id ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        <div className="text-sm font-medium">{company.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:ml-72 pt-16 lg:pt-0">
        <main className="p-6 lg:p-8">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

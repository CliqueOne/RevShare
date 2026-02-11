import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReferrer } from '../hooks/useReferrer';
import { LayoutDashboard, Users, DollarSign, LogOut, UserPlus, LucideIcon } from 'lucide-react';

interface ReferrerLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onReferClick?: () => void;
}

interface NavigationItem {
  name: string;
  icon: LucideIcon;
  page: string;
  isAction?: boolean;
}

export function ReferrerLayout({ children, currentPage, onNavigate, onReferClick }: ReferrerLayoutProps) {
  const { signOut } = useAuth();
  const { referrer } = useReferrer();

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { name: 'My Leads', icon: Users, page: 'leads' },
    { name: 'Commissions', icon: DollarSign, page: 'commissions' },
    { name: 'Refer', icon: UserPlus, page: 'refer', isAction: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg"></div>
                <span className="text-xl font-bold text-slate-900">RevShare</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navigation.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;
                  const handleClick = () => {
                    if (item.isAction && item.page === 'refer' && onReferClick) {
                      onReferClick();
                    } else {
                      onNavigate(item.page);
                    }
                  };
                  return (
                    <button
                      key={item.name}
                      onClick={handleClick}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {referrer && (
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-slate-900">{referrer.name}</div>
                  <div className="text-xs text-slate-600">{referrer.company?.name || 'Referrer'}</div>
                </div>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex justify-around">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            const handleClick = () => {
              if (item.isAction && item.page === 'refer' && onReferClick) {
                onReferClick();
              } else {
                onNavigate(item.page);
              }
            };
            return (
              <button
                key={item.name}
                onClick={handleClick}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

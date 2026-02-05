import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../hooks/useCompany';
import { Users, UserPlus, Briefcase, DollarSign, TrendingUp, Plus, X, Building2 } from 'lucide-react';

interface Stats {
  totalReferrers: number;
  activeReferrers: number;
  totalLeads: number;
  newLeads: number;
  totalDeals: number;
  wonDeals: number;
  totalRevenue: number;
  pendingCommissions: number;
}

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { currentCompany, createCompany, refreshCompanies } = useCompany();
  const [stats, setStats] = useState<Stats>({
    totalReferrers: 0,
    activeReferrers: 0,
    totalLeads: 0,
    newLeads: 0,
    totalDeals: 0,
    wonDeals: 0,
    totalRevenue: 0,
    pendingCommissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentCompany) {
      loadStats();
    }
  }, [currentCompany]);

  async function loadStats() {
    if (!currentCompany) return;

    try {
      const [referrersRes, leadsRes, dealsRes, commissionsRes] = await Promise.all([
        supabase
          .from('referrers')
          .select('status', { count: 'exact' })
          .eq('company_id', currentCompany.id),
        supabase
          .from('leads')
          .select('status', { count: 'exact' })
          .eq('company_id', currentCompany.id),
        supabase
          .from('deals')
          .select('status, amount', { count: 'exact' })
          .eq('company_id', currentCompany.id),
        supabase
          .from('commission_ledger')
          .select('status, amount')
          .eq('company_id', currentCompany.id),
      ]);

      const referrers = referrersRes.data || [];
      const leads = leadsRes.data || [];
      const deals = dealsRes.data || [];
      const commissions = commissionsRes.data || [];

      const totalRevenue = deals
        .filter(d => d.status === 'won')
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const pendingCommissions = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount), 0);

      setStats({
        totalReferrers: referrers.length,
        activeReferrers: referrers.filter(r => r.status === 'active').length,
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === 'new').length,
        totalDeals: deals.length,
        wonDeals: deals.filter(d => d.status === 'won').length,
        totalRevenue,
        pendingCommissions,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const { error } = await createCompany(companyName);
      if (error) {
        setError(error.message);
      } else {
        setShowCreateModal(false);
        setCompanyName('');
        await refreshCompanies();
      }
    } catch (err) {
      setError('Failed to create company');
    } finally {
      setCreating(false);
    }
  }

  if (!currentCompany) {
    return (
      <>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to RevShare</h2>
            <p className="text-slate-600 mb-6">
              Create your first company to start managing referrals and commissions.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Company
            </button>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Create Company</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCompanyName('');
                    setError('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleCreateCompany} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    autoFocus
                    placeholder="Acme Inc."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCompanyName('');
                      setError('');
                    }}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !companyName.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Referrers',
      value: stats.totalReferrers,
      subtitle: `${stats.activeReferrers} active`,
      icon: Users,
      color: 'blue',
      onClick: () => onNavigate('referrers'),
    },
    {
      name: 'Total Leads',
      value: stats.totalLeads,
      subtitle: `${stats.newLeads} new`,
      icon: UserPlus,
      color: 'green',
      onClick: () => onNavigate('leads'),
    },
    {
      name: 'Deals',
      value: stats.wonDeals,
      subtitle: `of ${stats.totalDeals} total`,
      icon: Briefcase,
      color: 'amber',
      onClick: () => onNavigate('deals'),
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtitle: `$${stats.pendingCommissions.toLocaleString()} pending`,
      icon: DollarSign,
      color: 'emerald',
      onClick: () => onNavigate('commissions'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Welcome back! Here's an overview of your {currentCompany.name} performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(card => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            amber: 'bg-amber-100 text-amber-600',
            emerald: 'bg-emerald-100 text-emerald-600',
          };

          return (
            <button
              key={card.name}
              onClick={card.onClick}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{card.value}</div>
              <div className="text-sm font-medium text-slate-600 mb-1">{card.name}</div>
              <div className="text-xs text-slate-500">{card.subtitle}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Start Growing Your Revenue</h2>
        <p className="text-blue-100 mb-6 max-w-2xl">
          Add referrers, track leads, and manage commissions all in one place. RevShare makes it easy to
          scale your referral program.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate('referrers')}
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Referrer
          </button>
          <button
            onClick={() => onNavigate('leads')}
            className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Lead
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useReferrer } from '../hooks/useReferrer';
import { Users, Briefcase, DollarSign, TrendingUp, Percent } from 'lucide-react';

interface Stats {
  totalLeads: number;
  newLeads: number;
  totalDeals: number;
  wonDeals: number;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
}

export function ReferrerDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { referrer } = useReferrer();
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    newLeads: 0,
    totalDeals: 0,
    wonDeals: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (referrer) {
      loadStats();
    }
  }, [referrer]);

  async function loadStats() {
    if (!referrer) return;

    try {
      const [leadsRes, dealsRes, commissionsRes] = await Promise.all([
        supabase
          .from('leads')
          .select('status', { count: 'exact' })
          .eq('referrer_id', referrer.id),
        supabase
          .from('deals')
          .select('status', { count: 'exact' })
          .eq('referrer_id', referrer.id),
        supabase
          .from('commission_ledger')
          .select('status, amount')
          .eq('referrer_id', referrer.id),
      ]);

      const leads = leadsRes.data || [];
      const deals = dealsRes.data || [];
      const commissions = commissionsRes.data || [];

      const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
      const pendingCommissions = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const paidCommissions = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.amount), 0);

      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === 'new').length,
        totalDeals: deals.length,
        wonDeals: deals.filter(d => d.status === 'won').length,
        totalCommissions,
        pendingCommissions,
        paidCommissions,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!referrer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Referrer Account Found</h2>
          <p className="text-slate-600">
            Your account is not set up as a referrer. Please contact your company administrator.
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Your Commission Rate',
      value: `${referrer.commission_rate}%`,
      subtitle: 'Per deal closed',
      icon: Percent,
      color: 'blue',
    },
    {
      name: 'Total Leads',
      value: stats.totalLeads,
      subtitle: `${stats.newLeads} new`,
      icon: Users,
      color: 'green',
      onClick: () => onNavigate('leads'),
    },
    {
      name: 'Deals Closed',
      value: stats.wonDeals,
      subtitle: `of ${stats.totalDeals} total`,
      icon: Briefcase,
      color: 'amber',
    },
    {
      name: 'Total Earned',
      value: `$${stats.totalCommissions.toLocaleString()}`,
      subtitle: `$${stats.paidCommissions.toLocaleString()} paid`,
      icon: DollarSign,
      color: 'emerald',
      onClick: () => onNavigate('commissions'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {referrer.name}</h1>
        <p className="text-slate-600">
          Here's an overview of your referral performance at {referrer.company?.name || 'your company'}.
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

          const CardWrapper = card.onClick ? 'button' : 'div';

          return (
            <CardWrapper
              key={card.name}
              onClick={card.onClick}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left ${
                card.onClick ? 'hover:shadow-md transition-all cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {card.onClick && <TrendingUp className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{card.value}</div>
              <div className="text-sm font-medium text-slate-600 mb-1">{card.name}</div>
              <div className="text-xs text-slate-500">{card.subtitle}</div>
            </CardWrapper>
          );
        })}
      </div>

      {stats.pendingCommissions > 0 && (
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Pending Commissions</h2>
          <p className="text-emerald-100 mb-4">
            You have <span className="font-bold">${stats.pendingCommissions.toLocaleString()}</span> in pending commissions waiting to be paid out.
          </p>
          <button
            onClick={() => onNavigate('commissions')}
            className="bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Commissions
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Keep Growing Your Earnings</h2>
        <p className="text-blue-100 mb-6 max-w-2xl">
          Share your referral link to bring in more leads. Every deal that closes means more commission for you!
        </p>
        <div className="bg-blue-500 rounded-lg p-4">
          <p className="text-xs text-blue-100 mb-2">Your Referral Code</p>
          <p className="text-lg font-mono font-bold">{referrer.referral_code}</p>
        </div>
      </div>
    </div>
  );
}

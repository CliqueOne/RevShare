import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useReferrer } from '../hooks/useReferrer';
import { DollarSign, Clock, Check, TrendingUp } from 'lucide-react';

interface Commission {
  id: string;
  referrer_id: string;
  deal_id: string;
  company_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
  paid_at: string | null;
  deal?: {
    id: string;
    amount: number;
    lead?: {
      name: string;
      email: string;
    };
  };
}

interface Summary {
  totalEarned: number;
  pendingAmount: number;
  paidAmount: number;
  approvedAmount: number;
}

export function ReferrerCommissions() {
  const { referrer } = useReferrer();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalEarned: 0,
    pendingAmount: 0,
    paidAmount: 0,
    approvedAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (referrer) {
      loadCommissions();
    }
  }, [referrer]);

  async function loadCommissions() {
    if (!referrer) return;

    try {
      const { data, error } = await supabase
        .from('commission_ledger')
        .select('*, deal:deals(id, amount, lead:leads(name, email))')
        .eq('referrer_id', referrer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commissionData = data || [];
      setCommissions(commissionData);

      const totalEarned = commissionData.reduce((sum, c) => sum + Number(c.amount), 0);
      const pendingAmount = commissionData
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const approvedAmount = commissionData
        .filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const paidAmount = commissionData
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.amount), 0);

      setSummary({
        totalEarned,
        pendingAmount,
        paidAmount,
        approvedAmount,
      });
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: Commission['status']) => {
    const config = {
      pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-700', icon: Check },
      paid: { color: 'bg-green-100 text-green-700', icon: Check },
    };

    const { color, icon: Icon } = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Commissions</h1>
        <p className="text-slate-600">Track your earnings and payouts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            ${summary.totalEarned.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-slate-600">Total Earned</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Check className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            ${summary.paidAmount.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-slate-600">Paid Out</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            ${summary.approvedAmount.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-slate-600">Approved</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            ${summary.pendingAmount.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-slate-600">Pending</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Lead</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Deal Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Commission</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">
                    No commissions yet. Keep referring leads to start earning!
                  </td>
                </tr>
              ) : (
                commissions.map(commission => (
                  <tr key={commission.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {commission.deal?.lead?.name || 'Unknown Lead'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">
                        ${Number(commission.deal?.amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-emerald-600">
                        ${Number(commission.amount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(commission.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </div>
                      {commission.paid_at && (
                        <div className="text-xs text-slate-500">
                          Paid: {new Date(commission.paid_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

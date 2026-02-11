import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../hooks/useCompany';
import { DollarSign, User, Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Commission {
  id: string;
  company_id: string;
  referrer_id: string;
  deal_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
}

interface Referrer {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  amount: number;
}

export function Commissions() {
  const { currentCompany, hasPermission } = useCompany();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const canManage = hasPermission('admin');

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany]);

  async function loadData() {
    if (!currentCompany) return;

    try {
      const [commissionsRes, referrersRes, dealsRes] = await Promise.all([
        supabase
          .from('commission_ledger')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('referrers')
          .select('id, name')
          .eq('company_id', currentCompany.id),
        supabase
          .from('deals')
          .select('id, amount')
          .eq('company_id', currentCompany.id),
      ]);

      if (commissionsRes.error) throw commissionsRes.error;
      if (referrersRes.error) throw referrersRes.error;
      if (dealsRes.error) throw dealsRes.error;

      setCommissions(commissionsRes.data || []);
      setReferrers(referrersRes.data || []);
      setDeals(dealsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(commissionId: string, newStatus: Commission['status']) {
    if (!canManage) return;

    try {
      const commission = commissions.find(c => c.id === commissionId);
      if (!commission) return;

      const { error: commissionError } = await supabase
        .from('commission_ledger')
        .update({ status: newStatus })
        .eq('id', commissionId);

      if (commissionError) throw commissionError;

      if (newStatus === 'paid') {
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .select('lead_id, status')
          .eq('id', commission.deal_id)
          .maybeSingle();

        if (dealError) throw dealError;

        if (deal && deal.status === 'won') {
          const { error: leadError } = await supabase
            .from('leads')
            .update({ status: 'converted' })
            .eq('id', deal.lead_id);

          if (leadError) throw leadError;
        }
      }

      loadData();
    } catch (error) {
      console.error('Error updating commission status:', error);
    }
  }

  function getReferrerName(referrerId: string) {
    return referrers.find(r => r.id === referrerId)?.name || 'Unknown';
  }

  function getDealAmount(dealId: string) {
    return deals.find(d => d.id === dealId)?.amount || 0;
  }

  const filteredCommissions = selectedStatus === 'all'
    ? commissions
    : commissions.filter(c => c.status === selectedStatus);

  const stats = {
    total: commissions.reduce((sum, c) => sum + Number(c.amount), 0),
    pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0),
    approved: commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + Number(c.amount), 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0),
  };

  const statusColors = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    approved: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
    paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Commissions</h1>
        <p className="text-slate-600">Track and manage commission payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-600">Total</div>
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-amber-600">Pending</div>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.pending.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-600">Approved</div>
            <CheckCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.approved.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-green-600">Paid</div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.paid.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Filter:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Referrer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Deal Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Commission</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
                {canManage && (
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-6 py-12 text-center text-slate-600">
                    No commissions found.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map(commission => {
                  const statusInfo = statusColors[commission.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={commission.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <User className="w-4 h-4 text-slate-400" />
                          {getReferrerName(commission.referrer_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-900">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          ${getDealAmount(commission.deal_id).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-semibold text-emerald-600">
                          <DollarSign className="w-4 h-4" />
                          {commission.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {commission.status === 'pending' && (
                              <button
                                onClick={() => updateStatus(commission.id, 'approved')}
                                className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {commission.status === 'approved' && (
                              <button
                                onClick={() => updateStatus(commission.id, 'paid')}
                                className="px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

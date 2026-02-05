import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../hooks/useCompany';
import { Plus, DollarSign, User, Edit2, CreditCard } from 'lucide-react';

interface Payout {
  id: string;
  company_id: string;
  referrer_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Referrer {
  id: string;
  name: string;
}

export function Payouts() {
  const { currentCompany, hasPermission } = useCompany();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    referrer_id: '',
    amount: '',
    payment_method: '',
    notes: '',
  });

  const canManage = hasPermission('admin');

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany]);

  async function loadData() {
    if (!currentCompany) return;

    try {
      const [payoutsRes, referrersRes] = await Promise.all([
        supabase
          .from('payouts')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('referrers')
          .select('id, name')
          .eq('company_id', currentCompany.id),
      ]);

      if (payoutsRes.error) throw payoutsRes.error;
      if (referrersRes.error) throw referrersRes.error;

      setPayouts(payoutsRes.data || []);
      setReferrers(referrersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !canManage) return;

    try {
      const { error } = await supabase
        .from('payouts')
        .insert({
          company_id: currentCompany.id,
          referrer_id: formData.referrer_id,
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method || null,
          notes: formData.notes || null,
          status: 'pending',
        });

      if (error) throw error;

      setShowForm(false);
      setFormData({
        referrer_id: '',
        amount: '',
        payment_method: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating payout:', error);
    }
  }

  async function updatePayoutStatus(payoutId: string, status: Payout['status']) {
    if (!canManage) return;

    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payouts')
        .update(updateData)
        .eq('id', payoutId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating payout:', error);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setFormData({
      referrer_id: '',
      amount: '',
      payment_method: '',
      notes: '',
    });
  }

  function getReferrerName(referrerId: string) {
    return referrers.find(r => r.id === referrerId)?.name || 'Unknown';
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">
            You don't have permission to view payouts. Contact your company owner or admin.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const stats = {
    total: payouts.reduce((sum, p) => sum + Number(p.amount), 0),
    pending: payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    completed: payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payouts</h1>
          <p className="text-slate-600">Manage commission payouts to referrers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Payout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-600">Total Payouts</div>
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-amber-600">Pending</div>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.pending.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-green-600">Completed</div>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.completed.toLocaleString()}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Create Payout</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Referrer</label>
                <select
                  value={formData.referrer_id}
                  onChange={(e) => setFormData({ ...formData, referrer_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Referrer</option>
                  {referrers.map(referrer => (
                    <option key={referrer.id} value={referrer.id}>
                      {referrer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <input
                  type="text"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  placeholder="e.g., Bank Transfer, PayPal"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Referrer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Method</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-600">
                    No payouts yet. Click "Create Payout" to get started.
                  </td>
                </tr>
              ) : (
                payouts.map(payout => (
                  <tr key={payout.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <User className="w-4 h-4 text-slate-400" />
                        {getReferrerName(payout.referrer_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-semibold text-emerald-600">
                        <DollarSign className="w-4 h-4" />
                        {payout.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CreditCard className="w-4 h-4" />
                        {payout.payment_method || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[payout.status]}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {payout.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updatePayoutStatus(payout.id, 'processing')}
                              className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              Process
                            </button>
                            <button
                              onClick={() => updatePayoutStatus(payout.id, 'completed')}
                              className="px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {payout.status === 'processing' && (
                          <button
                            onClick={() => updatePayoutStatus(payout.id, 'completed')}
                            className="px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
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

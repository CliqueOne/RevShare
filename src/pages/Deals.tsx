import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../hooks/useCompany';
import { Plus, Edit2, Trash2, DollarSign, User, UserPlus } from 'lucide-react';

interface Deal {
  id: string;
  company_id: string;
  lead_id: string;
  referrer_id: string;
  amount: number;
  status: 'pending' | 'won' | 'lost';
  closed_at: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  referrer_id: string;
}

interface Referrer {
  id: string;
  name: string;
  commission_rate: number;
}

export function Deals() {
  const { currentCompany, hasPermission } = useCompany();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    lead_id: '',
    amount: '',
    status: 'pending' as Deal['status'],
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
      const [dealsRes, leadsRes, referrersRes] = await Promise.all([
        supabase
          .from('deals')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('leads')
          .select('id, name, referrer_id')
          .eq('company_id', currentCompany.id)
          .in('status', ['qualified', 'converted']),
        supabase
          .from('referrers')
          .select('id, name, commission_rate')
          .eq('company_id', currentCompany.id),
      ]);

      if (dealsRes.error) throw dealsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (referrersRes.error) throw referrersRes.error;

      setDeals(dealsRes.data || []);
      setLeads(leadsRes.data || []);
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
      const lead = leads.find(l => l.id === formData.lead_id);
      if (!lead) return;

      const dealData = {
        company_id: currentCompany.id,
        lead_id: formData.lead_id,
        referrer_id: lead.referrer_id,
        amount: parseFloat(formData.amount),
        status: formData.status,
        closed_at: formData.status === 'won' ? new Date().toISOString() : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', editingId);

        if (error) throw error;

        if (formData.status === 'won') {
          await createCommission(editingId, lead.referrer_id, parseFloat(formData.amount));
        }
      } else {
        const { data: newDeal, error } = await supabase
          .from('deals')
          .insert(dealData)
          .select()
          .single();

        if (error) throw error;

        if (formData.status === 'won' && newDeal) {
          await createCommission(newDeal.id, lead.referrer_id, parseFloat(formData.amount));
        }
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        lead_id: '',
        amount: '',
        status: 'pending',
      });
      loadData();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  }

  async function createCommission(dealId: string, referrerId: string, dealAmount: number) {
    if (!currentCompany) return;

    const referrer = referrers.find(r => r.id === referrerId);
    if (!referrer) return;

    const commissionAmount = dealAmount * (referrer.commission_rate / 100);

    const { data: existing } = await supabase
      .from('commission_ledger')
      .select('id')
      .eq('deal_id', dealId)
      .maybeSingle();

    if (existing) return;

    await supabase
      .from('commission_ledger')
      .insert({
        company_id: currentCompany.id,
        referrer_id: referrerId,
        deal_id: dealId,
        amount: commissionAmount,
        status: 'pending',
      });
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  }

  function handleEdit(deal: Deal) {
    setEditingId(deal.id);
    setFormData({
      lead_id: deal.lead_id,
      amount: deal.amount.toString(),
      status: deal.status,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      lead_id: '',
      amount: '',
      status: 'pending',
    });
  }

  function getLeadName(leadId: string) {
    return leads.find(l => l.id === leadId)?.name || 'Unknown';
  }

  function getReferrerName(referrerId: string) {
    return referrers.find(r => r.id === referrerId)?.name || 'Unknown';
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Deals</h1>
          <p className="text-slate-600">Track and close deals from referrals</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Deal
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {editingId ? 'Edit Deal' : 'New Deal'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lead</label>
                <select
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  required
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                >
                  <option value="">Select Lead</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
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
                {editingId ? 'Update' : 'Create'}
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Lead</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Referrer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                {canManage && (
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-slate-600">
                    No deals yet. {canManage && 'Click "Add Deal" to get started.'}
                  </td>
                </tr>
              ) : (
                deals.map(deal => (
                  <tr key={deal.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <UserPlus className="w-4 h-4 text-slate-400" />
                        {getLeadName(deal.lead_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <User className="w-4 h-4 text-slate-400" />
                        {getReferrerName(deal.referrer_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-900">
                        <DollarSign className="w-4 h-4" />
                        {deal.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[deal.status]}`}>
                        {deal.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(deal)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
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

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../hooks/useCompany';
import { Mail, Phone, Building2, Edit2, Trash2, User } from 'lucide-react';
import { CreateDealModal } from '../components/CreateDealModal';

interface Lead {
  id: string;
  company_id: string;
  referrer_id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Referrer {
  id: string;
  name: string;
}

export function Leads() {
  const { currentCompany, hasPermission } = useCompany();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<Lead['status'] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    referrer_id: '',
    status: 'new' as Lead['status'],
    notes: '',
  });
  const [showDealModal, setShowDealModal] = useState(false);
  const [qualifyingLead, setQualifyingLead] = useState<Lead | null>(null);
  const [pendingFormData, setPendingFormData] = useState<typeof formData | null>(null);

  const canManage = hasPermission('admin');

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany]);

  async function loadData() {
    if (!currentCompany) return;

    try {
      const [leadsRes, referrersRes] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('company_id', currentCompany.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('referrers')
          .select('id, name')
          .eq('company_id', currentCompany.id)
          .eq('status', 'active'),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (referrersRes.error) throw referrersRes.error;

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

    if (editingId && originalStatus !== 'qualified' && formData.status === 'qualified') {
      try {
        const { data: existingDeals, error } = await supabase
          .from('deals')
          .select('id')
          .eq('lead_id', editingId);

        if (error) throw error;

        if (existingDeals && existingDeals.length > 0) {
          alert('A deal already exists for this lead. Cannot create duplicate deals.');
          return;
        }

        const currentLead = leads.find(l => l.id === editingId);
        if (currentLead) {
          setPendingFormData(formData);
          setQualifyingLead(currentLead);
          setShowDealModal(true);
          return;
        }
      } catch (error) {
        console.error('Error checking for existing deals:', error);
        alert('Failed to check for existing deals. Please try again.');
        return;
      }
    }

    try {
      const leadData = {
        company_id: currentCompany.id,
        referrer_id: formData.referrer_id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingId);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      setOriginalStatus(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        referrer_id: '',
        status: 'new',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  }

  function handleEdit(lead: Lead) {
    setEditingId(lead.id);
    setOriginalStatus(lead.status);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company_name: lead.company_name || '',
      referrer_id: lead.referrer_id,
      status: lead.status,
      notes: lead.notes || '',
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setOriginalStatus(null);
    setPendingFormData(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      referrer_id: '',
      status: 'new',
      notes: '',
    });
  }

  function getReferrerName(referrerId: string) {
    return referrers.find(r => r.id === referrerId)?.name || 'Unknown';
  }

  async function handleStatusChange(lead: Lead, newStatus: Lead['status']) {
    if (!currentCompany || !canManage) return;

    if (newStatus === 'qualified') {
      try {
        const { data: existingDeals, error } = await supabase
          .from('deals')
          .select('id')
          .eq('lead_id', lead.id);

        if (error) throw error;

        if (existingDeals && existingDeals.length > 0) {
          alert('A deal already exists for this lead. Cannot create duplicate deals.');
          return;
        }

        setQualifyingLead(lead);
        setShowDealModal(true);
      } catch (error) {
        console.error('Error checking for existing deals:', error);
        alert('Failed to check for existing deals. Please try again.');
      }
    } else {
      try {
        const { error } = await supabase
          .from('leads')
          .update({ status: newStatus })
          .eq('id', lead.id);

        if (error) throw error;
        loadData();
      } catch (error) {
        console.error('Error updating lead status:', error);
        alert('Failed to update lead status. Please try again.');
      }
    }
  }

  async function handleCreateDeal(amount: number) {
    if (!qualifyingLead || !currentCompany) return;

    const { error: dealError } = await supabase
      .from('deals')
      .insert({
        company_id: currentCompany.id,
        lead_id: qualifyingLead.id,
        referrer_id: qualifyingLead.referrer_id,
        amount,
        status: 'pending',
        closed_at: null,
      });

    if (dealError) throw dealError;

    if (pendingFormData) {
      const leadData = {
        company_id: currentCompany.id,
        referrer_id: pendingFormData.referrer_id,
        name: pendingFormData.name,
        email: pendingFormData.email,
        phone: pendingFormData.phone || null,
        company_name: pendingFormData.company_name || null,
        status: 'qualified' as Lead['status'],
        notes: pendingFormData.notes || null,
      };

      const { error: leadError } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', qualifyingLead.id);

      if (leadError) throw leadError;

      setShowForm(false);
      setEditingId(null);
      setOriginalStatus(null);
      setPendingFormData(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        referrer_id: '',
        status: 'new',
        notes: '',
      });
    } else {
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'qualified' })
        .eq('id', qualifyingLead.id);

      if (leadError) throw leadError;
    }

    setShowDealModal(false);
    setQualifyingLead(null);
    loadData();
  }

  function handleCloseDealModal() {
    if (pendingFormData && originalStatus) {
      setFormData({ ...pendingFormData, status: originalStatus });
      setPendingFormData(null);
    }
    setShowDealModal(false);
    setQualifyingLead(null);
  }

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    qualified: 'bg-purple-100 text-purple-700',
    converted: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leads</h1>
          <p className="text-slate-600">Track and manage your referral leads</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {editingId ? 'Edit Lead' : 'New Lead'}
          </h2>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
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
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Referrer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                {canManage && (
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-slate-600">
                    No leads yet. Leads are created when referrers submit them through their referral page.
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{lead.name}</div>
                      {lead.company_name && (
                        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                          <Building2 className="w-4 h-4" />
                          {lead.company_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <User className="w-4 h-4" />
                        {getReferrerName(lead.referrer_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {canManage ? (
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as Lead['status'])}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColors[lead.status]}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(lead)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
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

      {showDealModal && qualifyingLead && (
        <CreateDealModal
          leadId={qualifyingLead.id}
          leadName={qualifyingLead.name}
          referrerId={qualifyingLead.referrer_id}
          companyId={currentCompany!.id}
          onClose={handleCloseDealModal}
          onSubmit={handleCreateDeal}
        />
      )}
    </div>
  );
}

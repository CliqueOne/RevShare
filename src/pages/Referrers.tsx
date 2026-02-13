import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../hooks/useCompany';
import { Plus, Mail, Phone, Percent, Edit2, Trash2, Check, X, QrCode } from 'lucide-react';
import { AddReferrerModal } from '../components/AddReferrerModal';
import { AdminReferrerQRModal } from '../components/AdminReferrerQRModal';

interface Referrer {
  id: string;
  company_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  commission_rate: number;
  status: 'active' | 'inactive' | 'pending';
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

export function Referrers() {
  const { currentCompany, hasPermission } = useCompany();
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentReferralCode, setCurrentReferralCode] = useState<string>('');
  const [currentReferrerName, setCurrentReferrerName] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commission_rate: '10',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });

  const canManage = hasPermission('admin');

  useEffect(() => {
    if (currentCompany) {
      loadReferrers();
    }
  }, [currentCompany]);

  async function loadReferrers() {
    if (!currentCompany) return;

    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrers(data || []);
    } catch (error) {
      console.error('Error loading referrers:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAddSuccess(referralCode: string, referrerName: string) {
    setShowAddModal(false);
    setCurrentReferralCode(referralCode);
    setCurrentReferrerName(referrerName);
    setShowQRModal(true);
    loadReferrers();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !canManage || !editingId) return;

    try {
      const referrerData = {
        company_id: currentCompany.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        commission_rate: parseFloat(formData.commission_rate),
        status: formData.status,
      };

      const { error } = await supabase
        .from('referrers')
        .update(referrerData)
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        commission_rate: '10',
        status: 'active',
      });
      loadReferrers();
    } catch (error) {
      console.error('Error updating referrer:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this referrer?')) return;

    try {
      const { error } = await supabase
        .from('referrers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadReferrers();
    } catch (error) {
      console.error('Error deleting referrer:', error);
    }
  }

  function handleEdit(referrer: Referrer) {
    setEditingId(referrer.id);
    setFormData({
      name: referrer.name,
      email: referrer.email,
      phone: referrer.phone || '',
      commission_rate: referrer.commission_rate.toString(),
      status: referrer.status,
    });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      commission_rate: '10',
      status: 'active',
    });
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Referrers</h1>
          <p className="text-slate-600">Manage your referral partners</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Referrer
          </button>
        )}
      </div>

      {showAddModal && currentCompany && (
        <AddReferrerModal
          companyId={currentCompany.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {editingId && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Referrer</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
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
                Update
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Commission</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                {canManage && (
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {referrers.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-slate-600">
                    No referrers yet. {canManage && 'Click "Add Referrer" to get started.'}
                  </td>
                </tr>
              ) : (
                referrers.map(referrer => (
                  <tr key={referrer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{referrer.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4" />
                          {referrer.email}
                        </div>
                        {referrer.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4" />
                            {referrer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">
                        {referrer.commission_rate}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          referrer.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : referrer.status === 'inactive'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {referrer.status === 'active' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {referrer.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {referrer.referral_code && (
                            <button
                              onClick={() => {
                                setCurrentReferralCode(referrer.referral_code || '');
                                setCurrentReferrerName(referrer.name);
                                setShowQRModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(referrer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(referrer.id)}
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

      {showQRModal && (
        <AdminReferrerQRModal
          referralCode={currentReferralCode}
          referrerName={currentReferrerName}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}

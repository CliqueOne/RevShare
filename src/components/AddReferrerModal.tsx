import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AddReferrerModalProps {
  companyId: string;
  onClose: () => void;
  onSuccess: (referralCode: string, referrerName: string) => void;
}

export function AddReferrerModal({ companyId, onClose, onSuccess }: AddReferrerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commission_rate: '10',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });
  const [previewReferralCode] = useState(() => generateReferralCode());
  const [submitting, setSubmitting] = useState(false);

  function generateReferralCode(): string {
    return 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const referrerData = {
        company_id: companyId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        commission_rate: parseFloat(formData.commission_rate),
        status: formData.status,
        referral_code: previewReferralCode,
      };

      const { error } = await supabase
        .from('referrers')
        .insert(referrerData);

      if (error) throw error;

      onSuccess(previewReferralCode, formData.name);
    } catch (error) {
      console.error('Error creating referrer:', error);
      alert('Failed to create referrer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Add New Referrer</h2>
          <p className="text-slate-600">Fill in the details and share the QR code</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
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
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Referrer'}
              </button>
            </div>
          </form>

          <div className="flex flex-col items-center justify-center">
            <div className="bg-slate-50 rounded-xl p-6 w-full">
              <div className="text-center mb-4">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Referral QR Code</h3>
                <p className="text-sm text-slate-600">Scan to access signup page</p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm mb-4 flex justify-center">
                <QRCodeSVG
                  value={`${window.location.origin}/signup?ref=${previewReferralCode}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">Referral Code</p>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200">
                  <p className="text-sm font-mono font-semibold text-slate-900">
                    {previewReferralCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

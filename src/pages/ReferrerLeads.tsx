import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useReferrer } from '../hooks/useReferrer';
import { Mail, Phone, Check, Clock, X } from 'lucide-react';
import { mapStatusForReferrer, getReferrerStatusLabel, type AdminLeadStatus } from '../lib/statusMapping';

interface Lead {
  id: string;
  referrer_id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function ReferrerLeads() {
  const { referrer } = useReferrer();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (referrer) {
      loadLeads();
    }
  }, [referrer]);

  async function loadLeads() {
    if (!referrer) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('referrer_id', referrer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: Lead['status']) => {
    const mappedStatus = mapStatusForReferrer(status as AdminLeadStatus);
    const label = getReferrerStatusLabel(status as AdminLeadStatus);

    const config = {
      new: { color: 'bg-blue-100 text-blue-700', icon: Clock },
      pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
      closed: { color: 'bg-green-100 text-green-700', icon: Check },
      lost: { color: 'bg-slate-100 text-slate-700', icon: X },
    };

    const { color, icon: Icon } = config[mappedStatus];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Leads</h1>
        <p className="text-slate-600">Track all the leads you've referred</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Company</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">
                    No leads yet. Keep sharing your referral code to bring in more leads!
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{lead.name}</div>
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
                      <div className="text-sm text-slate-900">{lead.company || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        {new Date(lead.created_at).toLocaleDateString()}
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

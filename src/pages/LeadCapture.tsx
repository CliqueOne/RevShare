import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, CheckCircle } from 'lucide-react';

export function LeadCapture() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<{
    name: string;
    companyName: string;
    referrerId: string;
    companyId: string;
  } | null>(null);
  const [loadingReferrer, setLoadingReferrer] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      setReferralCode(refCode);
      loadReferrerInfo(refCode);
    } else {
      setError('Invalid or missing referral code');
      setLoadingReferrer(false);
    }
  }, []);

  async function loadReferrerInfo(code: string) {
    try {
      const { data: referrer, error: referrerError } = await supabase
        .from('referrers')
        .select('id, name, company_id, companies(name)')
        .eq('referral_code', code)
        .maybeSingle();

      if (referrerError || !referrer) {
        setError('Invalid referral code. Please contact your referrer for a valid link.');
        setLoadingReferrer(false);
        return;
      }

      setReferrerInfo({
        name: referrer.name,
        companyName: (referrer.companies as any)?.name || 'AI Automation Group',
        referrerId: referrer.id,
        companyId: referrer.company_id,
      });
      setLoadingReferrer(false);
    } catch (err) {
      console.error('Error loading referrer info:', err);
      setError('Unable to validate referral code. Please try again later.');
      setLoadingReferrer(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!referrerInfo) {
      setError('Invalid referral information. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('company_id', referrerInfo.companyId)
        .maybeSingle();

      if (existingLead) {
        setError('This email has already been submitted. We will contact you soon!');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          company_id: referrerInfo.companyId,
          referrer_id: referrerInfo.referrerId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          company_name: companyName.trim() || null,
          status: 'new',
        });

      if (insertError) {
        console.error('Error creating lead:', insertError);
        setError('Unable to submit your information. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error submitting lead:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (loadingReferrer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-green-600 p-3 rounded-xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Thank You!
          </h1>
          <p className="text-center text-slate-600 mb-6">
            We've received your information and will contact you within 24 hours to discuss how AI Automation Group can help transform your business.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">
              Thanks to <span className="font-semibold">{referrerInfo?.name}</span> for the referral!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !referrerInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
          Get Started with AI Automation
        </h1>
        <p className="text-center text-slate-600 mb-8">
          Share your details and we'll reach out to discuss how we can help your business
        </p>

        {referrerInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 text-center">
              <span className="font-semibold">{referrerInfo.name}</span> from{' '}
              <span className="font-semibold">{referrerInfo.companyName}</span> referred you
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="john@company.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Acme Inc. (optional)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Information'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          By submitting this form, you agree to be contacted by AI Automation Group regarding our services.
        </p>
      </div>
    </div>
  );
}

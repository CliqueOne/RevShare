import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserPlus } from 'lucide-react';

export function Signup({ onToggle }: { onToggle: () => void }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkingReferrer, setLinkingReferrer] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<{ name: string; companyName: string; referrerId: string } | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      setReferralCode(refCode);
      loadReferrerInfo(refCode);
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
        setError('Invalid referral code');
        return;
      }

      setReferrerInfo({
        name: referrer.name,
        companyName: (referrer.companies as any)?.name || 'Unknown Company',
        referrerId: referrer.id,
      });
    } catch (err) {
      console.error('Error loading referrer info:', err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error, data } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If signing up with a referral code, link the referrer account
    if (referrerInfo && data?.user) {
      setLoading(false);
      setLinkingReferrer(true);

      try {
        // Wait for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Verify we have an active session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Session not established');
        }

        // Link the referrer account and update email to match
        const { error: updateError } = await supabase
          .from('referrers')
          .update({
            user_id: session.user.id,
            email: session.user.email
          })
          .eq('id', referrerInfo.referrerId);

        if (updateError) {
          console.error('Error linking referrer:', updateError);
          throw updateError;
        }

        // Successfully linked - stay in linking state while app redirects
        return;
      } catch (err) {
        console.error('Linking error:', err);
        // If linking fails, still let them continue - useReferrer hook will retry
        setLinkingReferrer(false);
        setSuccess(true);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (linkingReferrer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Setting Up Your Account</h2>
          <p className="text-slate-600">
            Linking your referrer profile...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-green-600 p-3 rounded-xl">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
            Account Created!
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Your account has been successfully created. You can now sign in.
          </p>

          <button
            onClick={onToggle}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
          Create Account
        </h1>
        <p className="text-center text-slate-600 mb-8">
          {referrerInfo ? `Join ${referrerInfo.companyName} as a referrer` : 'Start managing your referrals today'}
        </p>

        {referrerInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <span className="font-semibold">{referrerInfo.name}</span> invited you to join{' '}
              <span className="font-semibold">{referrerInfo.companyName}</span> as a referrer
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-600">
            Already have an account?{' '}
            <button
              onClick={onToggle}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

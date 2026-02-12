import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  company?: {
    id: string;
    name: string;
  };
}

export function useReferrer() {
  const { user } = useAuth();
  const [referrer, setReferrer] = useState<Referrer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReferrer(null);
      setLoading(false);
      setError(null);
      return;
    }

    loadReferrer();
  }, [user]);

  async function loadReferrer() {
    try {
      setError(null);

      const { data: existingReferrer, error: queryError } = await supabase
        .from('referrers')
        .select('*, company:companies(id, name)')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (queryError) throw queryError;

      if (existingReferrer) {
        setReferrer(existingReferrer);
        setLoading(false);
        return;
      }

      const { data: unclaimedReferrer, error: unclaimedError } = await supabase
        .from('referrers')
        .select('*, company:companies(id, name)')
        .eq('email', user?.email)
        .is('user_id', null)
        .maybeSingle();

      if (unclaimedError) throw unclaimedError;

      if (unclaimedReferrer) {
        const { data: linkedReferrer, error: updateError } = await supabase
          .from('referrers')
          .update({ user_id: user.id })
          .eq('id', unclaimedReferrer.id)
          .select('*, company:companies(id, name)')
          .single();

        if (updateError) {
          console.error('Error linking unclaimed referrer:', updateError);
          throw updateError;
        }

        setReferrer(linkedReferrer);
      } else {
        // No referrer found - this is OK for company users
        setReferrer(null);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading referrer:', error);
      setError('Failed to load referrer account. Please try again.');
      setReferrer(null);
    } finally {
      setLoading(false);
    }
  }

  return {
    referrer,
    loading,
    error,
    refresh: loadReferrer,
  };
}

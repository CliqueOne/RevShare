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

  useEffect(() => {
    if (!user) {
      setReferrer(null);
      setLoading(false);
      return;
    }

    loadReferrer();
  }, [user]);

  async function loadReferrer() {
    try {
      const { data, error } = await supabase
        .from('referrers')
        .select('*, company:companies(id, name)')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setReferrer(data);
    } catch (error) {
      console.error('Error loading referrer:', error);
      setReferrer(null);
    } finally {
      setLoading(false);
    }
  }

  return {
    referrer,
    loading,
    refresh: loadReferrer,
  };
}

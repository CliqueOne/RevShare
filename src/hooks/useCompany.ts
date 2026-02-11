import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface Membership {
  id: string;
  user_id: string;
  company_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  company?: Company;
}

export function useCompany() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentRole, setCurrentRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setMemberships([]);
      setCurrentCompany(null);
      setCurrentRole(null);
      setLoading(false);
      return;
    }

    loadCompanies();
  }, [user]);

  async function loadCompanies() {
    try {
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user?.id);

      if (membershipError) throw membershipError;

      setMemberships(membershipData || []);

      if (membershipData && membershipData.length > 0) {
        const companyIds = membershipData.map(m => m.company_id);

        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);

        if (companyError) throw companyError;

        setCompanies(companyData || []);

        const storedCompanyId = localStorage.getItem('currentCompanyId');
        let selectedCompany = companyData?.[0] || null;

        if (storedCompanyId) {
          const found = companyData?.find(c => c.id === storedCompanyId);
          if (found) selectedCompany = found;
        }

        if (selectedCompany) {
          setCurrentCompany(selectedCompany);
          const membership = membershipData.find(m => m.company_id === selectedCompany.id);
          setCurrentRole(membership?.role || null);
          localStorage.setItem('currentCompanyId', selectedCompany.id);
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  }

  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      const membership = memberships.find(m => m.company_id === companyId);
      setCurrentRole(membership?.role || null);
      localStorage.setItem('currentCompanyId', companyId);
    }
  };

  const createCompany = async (name: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({ name, owner_id: user.id })
        .select()
        .single();

      if (error) {
        return { data, error };
      }

      if (data) {
        // Wait for the database trigger to create the membership
        // Retry up to 5 times with 200ms delays
        let membershipFound = false;
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));

          const { data: membershipData } = await supabase
            .from('memberships')
            .select('*')
            .eq('user_id', user.id)
            .eq('company_id', data.id)
            .maybeSingle();

          if (membershipData) {
            membershipFound = true;
            break;
          }
        }

        // Now load all companies with synchronized state
        await loadCompanies();
      }

      return { data, error };
    } finally {
      setCreating(false);
    }
  };

  const hasPermission = (requiredRole: 'owner' | 'admin' | 'member'): boolean => {
    // Fallback: if user is the company owner, grant all permissions
    if (!currentRole && currentCompany && user && currentCompany.owner_id === user.id) {
      return true;
    }

    if (!currentRole) return false;

    const roleHierarchy = { owner: 3, admin: 2, member: 1 };
    return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
  };

  return {
    companies,
    memberships,
    currentCompany,
    currentRole,
    loading,
    creating,
    switchCompany,
    createCompany,
    hasPermission,
    refreshCompanies: loadCompanies,
  };
}

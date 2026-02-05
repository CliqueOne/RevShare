import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
      };
      referrers: {
        Row: {
          id: string;
          company_id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          commission_rate: number;
          status: 'active' | 'inactive' | 'pending';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          commission_rate: number;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          commission_rate?: number;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
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
        };
        Insert: {
          id?: string;
          company_id: string;
          referrer_id: string;
          name: string;
          email: string;
          phone?: string | null;
          company_name?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          referrer_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company_name?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          company_id: string;
          lead_id: string;
          referrer_id: string;
          amount: number;
          status: 'pending' | 'won' | 'lost';
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          lead_id: string;
          referrer_id: string;
          amount: number;
          status?: 'pending' | 'won' | 'lost';
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          lead_id?: string;
          referrer_id?: string;
          amount?: number;
          status?: 'pending' | 'won' | 'lost';
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_ledger: {
        Row: {
          id: string;
          company_id: string;
          referrer_id: string;
          deal_id: string;
          amount: number;
          status: 'pending' | 'approved' | 'paid';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          referrer_id: string;
          deal_id: string;
          amount: number;
          status?: 'pending' | 'approved' | 'paid';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          referrer_id?: string;
          deal_id?: string;
          amount?: number;
          status?: 'pending' | 'approved' | 'paid';
          created_at?: string;
          updated_at?: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          company_id: string;
          referrer_id: string;
          amount: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          payment_method: string | null;
          transaction_id: string | null;
          notes: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          referrer_id: string;
          amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          payment_method?: string | null;
          transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          referrer_id?: string;
          amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          payment_method?: string | null;
          transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

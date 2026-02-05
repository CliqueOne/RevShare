/*
  # RevShare Database Schema

  ## Overview
  Complete schema for revenue sharing and referral management system with multi-company support.

  ## New Tables

  ### 1. companies
  - `id` (uuid, primary key) - Unique company identifier
  - `name` (text) - Company name
  - `owner_id` (uuid) - References auth.users
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. memberships
  - `id` (uuid, primary key) - Unique membership identifier
  - `user_id` (uuid) - References auth.users
  - `company_id` (uuid) - References companies
  - `role` (text) - User role: 'owner', 'admin', 'member'
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. referrer_invites
  - `id` (uuid, primary key) - Unique invite identifier
  - `company_id` (uuid) - References companies
  - `email` (text) - Invitee email address
  - `token` (text) - Unique invite token
  - `status` (text) - 'pending', 'accepted', 'expired'
  - `created_by` (uuid) - References auth.users
  - `created_at` (timestamptz) - Creation timestamp
  - `expires_at` (timestamptz) - Expiration timestamp

  ### 4. referrers
  - `id` (uuid, primary key) - Unique referrer identifier
  - `company_id` (uuid) - References companies
  - `user_id` (uuid, nullable) - References auth.users if registered
  - `name` (text) - Referrer name
  - `email` (text) - Referrer email
  - `phone` (text, nullable) - Referrer phone
  - `commission_rate` (numeric) - Commission percentage (0-100)
  - `status` (text) - 'active', 'inactive', 'pending'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. leads
  - `id` (uuid, primary key) - Unique lead identifier
  - `company_id` (uuid) - References companies
  - `referrer_id` (uuid) - References referrers
  - `name` (text) - Lead name
  - `email` (text) - Lead email
  - `phone` (text, nullable) - Lead phone
  - `company_name` (text, nullable) - Lead's company
  - `status` (text) - 'new', 'contacted', 'qualified', 'converted', 'lost'
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. deals
  - `id` (uuid, primary key) - Unique deal identifier
  - `company_id` (uuid) - References companies
  - `lead_id` (uuid) - References leads
  - `referrer_id` (uuid) - References referrers
  - `amount` (numeric) - Deal value
  - `status` (text) - 'pending', 'won', 'lost'
  - `closed_at` (timestamptz, nullable) - Deal close date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 7. commission_ledger
  - `id` (uuid, primary key) - Unique ledger entry identifier
  - `company_id` (uuid) - References companies
  - `referrer_id` (uuid) - References referrers
  - `deal_id` (uuid) - References deals
  - `amount` (numeric) - Commission amount
  - `status` (text) - 'pending', 'approved', 'paid'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 8. payouts
  - `id` (uuid, primary key) - Unique payout identifier
  - `company_id` (uuid) - References companies
  - `referrer_id` (uuid) - References referrers
  - `amount` (numeric) - Total payout amount
  - `status` (text) - 'pending', 'processing', 'completed', 'failed'
  - `payment_method` (text, nullable) - Payment method used
  - `transaction_id` (text, nullable) - External transaction reference
  - `notes` (text, nullable) - Payout notes
  - `paid_at` (timestamptz, nullable) - Payment completion date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access data from companies they are members of
  - Company owners have full access to their company data
  - Admins can manage referrers, leads, and deals
  - Members have read-only access
  - Referrers (with user accounts) can view their own data only

  ## Indexes
  - Foreign key indexes for performance
  - Email indexes for lookups
  - Status indexes for filtering
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Create referrer_invites table
CREATE TABLE IF NOT EXISTS referrer_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE referrer_invites ENABLE ROW LEVEL SECURITY;

-- Create referrers table
CREATE TABLE IF NOT EXISTS referrers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_name text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create commission_ledger table
CREATE TABLE IF NOT EXISTS commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method text,
  transaction_id text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company_id ON memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_referrers_company_id ON referrers(company_id);
CREATE INDEX IF NOT EXISTS idx_referrers_user_id ON referrers(user_id);
CREATE INDEX IF NOT EXISTS idx_referrers_email ON referrers(email);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_referrer_id ON leads(referrer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_referrer_id ON deals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_company_id ON commission_ledger(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_referrer_id ON commission_ledger(referrer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_company_id ON payouts(company_id);
CREATE INDEX IF NOT EXISTS idx_payouts_referrer_id ON payouts(referrer_id);

-- RLS Policies for companies
CREATE POLICY "Users can view companies they own"
  ON companies FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update companies they own"
  ON companies FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete companies they own"
  ON companies FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for memberships
CREATE POLICY "Users can view their own memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company owners can view all memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memberships.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can insert memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can delete memberships"
  ON memberships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memberships.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- RLS Policies for referrer_invites
CREATE POLICY "Company members can view invites"
  ON referrer_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrer_invites.company_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners and admins can create invites"
  ON referrer_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can update invites"
  ON referrer_invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrer_invites.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for referrers
CREATE POLICY "Company members can view referrers"
  ON referrers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrers.company_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Referrers can view their own data"
  ON referrers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company owners and admins can create referrers"
  ON referrers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can update referrers"
  ON referrers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrers.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can delete referrers"
  ON referrers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrers.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for leads
CREATE POLICY "Company members can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = leads.company_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Referrers can view their own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = leads.referrer_id
      AND referrers.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners and admins can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = leads.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = leads.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for deals
CREATE POLICY "Company members can view deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = deals.company_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Referrers can view their own deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = deals.referrer_id
      AND referrers.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners and admins can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can update deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = deals.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can delete deals"
  ON deals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = deals.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for commission_ledger
CREATE POLICY "Company members can view commissions"
  ON commission_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = commission_ledger.company_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Referrers can view their own commissions"
  ON commission_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = commission_ledger.referrer_id
      AND referrers.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners and admins can create commissions"
  ON commission_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can update commissions"
  ON commission_ledger FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = commission_ledger.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for payouts
CREATE POLICY "Company members can view payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = payouts.company_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Referrers can view their own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = payouts.referrer_id
      AND referrers.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners and admins can create payouts"
  ON payouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can update payouts"
  ON payouts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = payouts.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners and admins can delete payouts"
  ON payouts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = payouts.company_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- Function to automatically create owner membership when company is created
CREATE OR REPLACE FUNCTION create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO memberships (user_id, company_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_membership();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrers_updated_at BEFORE UPDATE ON referrers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_ledger_updated_at BEFORE UPDATE ON commission_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
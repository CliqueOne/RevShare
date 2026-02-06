/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  Added indexes for foreign keys that were missing covering indexes:
  - `commission_ledger.deal_id` - Improves join performance with deals table
  - `companies.owner_id` - Improves owner lookup performance
  - `deals.lead_id` - Improves join performance with leads table
  - `referrer_invites.company_id` - Improves company invite lookups
  - `referrer_invites.created_by` - Improves creator lookup performance

  ### 2. Optimize RLS Policies
  Updated all RLS policies to use `(select auth.uid())` instead of `auth.uid()`.
  This prevents the auth function from being re-evaluated for each row, significantly
  improving query performance at scale.

  ### 3. Fix Function Search Paths
  Updated functions to have explicit search paths set for security:
  - `create_owner_membership()` - Sets search path to prevent injection
  - `update_updated_at_column()` - Sets search path to prevent injection

  ## Performance Impact
  - Foreign key indexes: Improves join and lookup performance
  - RLS optimization: Reduces query execution time by evaluating auth once
  - Function security: Prevents potential SQL injection via search_path

  ## Security Impact
  - Proper function search paths prevent security vulnerabilities
  - Optimized RLS policies maintain security while improving performance
*/

-- ============================================================================
-- 1. Add Missing Foreign Key Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_commission_ledger_deal_id ON commission_ledger(deal_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_referrer_invites_company_id ON referrer_invites(company_id);
CREATE INDEX IF NOT EXISTS idx_referrer_invites_created_by ON referrer_invites(created_by);

-- ============================================================================
-- 2. Optimize RLS Policies - Replace auth.uid() with (select auth.uid())
-- ============================================================================

-- Companies policies
DROP POLICY IF EXISTS "Users can view companies they own" ON companies;
CREATE POLICY "Users can view companies they own"
  ON companies FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
CREATE POLICY "Users can insert their own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update companies they own" ON companies;
CREATE POLICY "Users can update companies they own"
  ON companies FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete companies they own" ON companies;
CREATE POLICY "Users can delete companies they own"
  ON companies FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- Memberships policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
CREATE POLICY "Users can view their own memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Company owners can view all memberships" ON memberships;
CREATE POLICY "Company owners can view all memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memberships.company_id
      AND companies.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners can insert memberships" ON memberships;
CREATE POLICY "Company owners can insert memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners can delete memberships" ON memberships;
CREATE POLICY "Company owners can delete memberships"
  ON memberships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memberships.company_id
      AND companies.owner_id = (select auth.uid())
    )
  );

-- Referrer invites policies
DROP POLICY IF EXISTS "Company members can view invites" ON referrer_invites;
CREATE POLICY "Company members can view invites"
  ON referrer_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrer_invites.company_id
      AND memberships.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can create invites" ON referrer_invites;
CREATE POLICY "Company owners and admins can create invites"
  ON referrer_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can update invites" ON referrer_invites;
CREATE POLICY "Company owners and admins can update invites"
  ON referrer_invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrer_invites.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- Referrers policies
DROP POLICY IF EXISTS "Company members can view referrers" ON referrers;
CREATE POLICY "Company members can view referrers"
  ON referrers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrers.company_id
      AND memberships.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Referrers can view their own data" ON referrers;
CREATE POLICY "Referrers can view their own data"
  ON referrers FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Company owners and admins can create referrers" ON referrers;
CREATE POLICY "Company owners and admins can create referrers"
  ON referrers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can update referrers" ON referrers;
CREATE POLICY "Company owners and admins can update referrers"
  ON referrers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrers.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can delete referrers" ON referrers;
CREATE POLICY "Company owners and admins can delete referrers"
  ON referrers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = referrers.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- Leads policies
DROP POLICY IF EXISTS "Company members can view leads" ON leads;
CREATE POLICY "Company members can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = leads.company_id
      AND memberships.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Referrers can view their own leads" ON leads;
CREATE POLICY "Referrers can view their own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = leads.referrer_id
      AND referrers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can create leads" ON leads;
CREATE POLICY "Company owners and admins can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can update leads" ON leads;
CREATE POLICY "Company owners and admins can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = leads.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can delete leads" ON leads;
CREATE POLICY "Company owners and admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = leads.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- Deals policies
DROP POLICY IF EXISTS "Company members can view deals" ON deals;
CREATE POLICY "Company members can view deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = deals.company_id
      AND memberships.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Referrers can view their own deals" ON deals;
CREATE POLICY "Referrers can view their own deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = deals.referrer_id
      AND referrers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can create deals" ON deals;
CREATE POLICY "Company owners and admins can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can update deals" ON deals;
CREATE POLICY "Company owners and admins can update deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = deals.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can delete deals" ON deals;
CREATE POLICY "Company owners and admins can delete deals"
  ON deals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = deals.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- Commission ledger policies
DROP POLICY IF EXISTS "Company members can view commissions" ON commission_ledger;
CREATE POLICY "Company members can view commissions"
  ON commission_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = commission_ledger.company_id
      AND memberships.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Referrers can view their own commissions" ON commission_ledger;
CREATE POLICY "Referrers can view their own commissions"
  ON commission_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = commission_ledger.referrer_id
      AND referrers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can create commissions" ON commission_ledger;
CREATE POLICY "Company owners and admins can create commissions"
  ON commission_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can update commissions" ON commission_ledger;
CREATE POLICY "Company owners and admins can update commissions"
  ON commission_ledger FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = commission_ledger.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- Payouts policies
DROP POLICY IF EXISTS "Company members can view payouts" ON payouts;
CREATE POLICY "Company members can view payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = payouts.company_id
      AND memberships.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Referrers can view their own payouts" ON payouts;
CREATE POLICY "Referrers can view their own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referrers
      WHERE referrers.id = payouts.referrer_id
      AND referrers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can create payouts" ON payouts;
CREATE POLICY "Company owners and admins can create payouts"
  ON payouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can update payouts" ON payouts;
CREATE POLICY "Company owners and admins can update payouts"
  ON payouts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = payouts.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Company owners and admins can delete payouts" ON payouts;
CREATE POLICY "Company owners and admins can delete payouts"
  ON payouts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.company_id = payouts.company_id
      AND memberships.user_id = (select auth.uid())
      AND memberships.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 3. Fix Function Search Paths
-- ============================================================================

CREATE OR REPLACE FUNCTION create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO memberships (user_id, company_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
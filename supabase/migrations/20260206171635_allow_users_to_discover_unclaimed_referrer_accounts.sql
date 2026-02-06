/*
  # Allow Users to Discover Unclaimed Referrer Accounts

  ## Problem
  When a referrer signs up, the system tries to auto-link their account by:
  1. Finding an unclaimed referrer record (user_id IS NULL) matching their email
  2. Updating that record to set user_id to their auth.uid()

  However, the SELECT query fails because RLS policies don't allow users to view 
  unclaimed referrer records. The existing SELECT policies only allow:
  - Company members to view referrers in their company
  - Referrers to view their own data (where user_id = auth.uid())

  Since unclaimed referrers have user_id = NULL, they don't match either policy,
  so the SELECT returns zero results and the auto-linking never happens.

  ## Solution
  Add a new SELECT policy that allows authenticated users to view unclaimed 
  referrer records that match their email address. This enables the auto-linking
  logic in the useReferrer hook to discover and claim their referrer account.

  ## Security Considerations
  This policy is secure because:
  - Users can only view referrer records where email matches their auth email
  - Only unclaimed records (user_id IS NULL) are visible via this policy
  - Once claimed (user_id is set), this policy no longer applies
  - Email matching is case-insensitive to handle variations
  - The existing UPDATE policy "Referrers can claim their account" ensures
    users can only set user_id to their own auth.uid()

  ## Changes Made
  1. New SELECT Policy
     - "Users can discover their unclaimed referrer account"
     - Allows authenticated users to SELECT unclaimed referrer records
     - Matches on email (case-insensitive)
     - Only applies when user_id IS NULL
*/

-- Allow authenticated users to find unclaimed referrer records matching their email
CREATE POLICY "Users can discover their unclaimed referrer account"
  ON referrers FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing if the referrer is unclaimed (user_id IS NULL)
    -- AND the email matches the authenticated user's email (case-insensitive)
    user_id IS NULL
    AND LOWER(email) = LOWER((auth.jwt() ->> 'email')::text)
  );

/*
  # Revert to Base Schema

  ## Changes
  - Drop public access policies added for referrer sign-up
  - Remove referral_code column from referrers table
  - Remove referral_code index

  ## Security Notes
  - Restores original security model where only authenticated company members can access data
  - Removes public access to referrers and companies tables
*/

-- Drop public access policies
DROP POLICY IF EXISTS "Public can view referrer by code" ON referrers;
DROP POLICY IF EXISTS "Public can complete referrer signup" ON referrers;
DROP POLICY IF EXISTS "Public can view company names" ON companies;

-- Drop referral_code index
DROP INDEX IF EXISTS idx_referrers_referral_code;

-- Remove referral_code column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referrers' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE referrers DROP COLUMN referral_code;
  END IF;
END $$;
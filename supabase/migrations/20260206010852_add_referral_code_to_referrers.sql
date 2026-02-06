/*
  # Add referral code system for referrer signup

  ## Changes
  - Add referral_code column to referrers table for unique identification
  - Add index for fast referral code lookups
  - Add RLS policies for public referrer signup flow

  ## New Columns
  - `referrers.referral_code` (text, unique, nullable) - Unique code for referrer signup links/QR codes

  ## Security
  - Allow public read access to referrer info when accessing via referral code
  - Allow public update of user_id for completing referrer signup
  - Allow public read access to company names for signup page display
  - All other operations remain restricted to authenticated company members
*/

-- Add referral_code column to referrers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referrers' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE referrers ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Create index for fast referral code lookups
CREATE INDEX IF NOT EXISTS idx_referrers_referral_code ON referrers(referral_code);

-- Allow public to read referrer info by referral code
CREATE POLICY "Public can view referrer by code"
  ON referrers FOR SELECT
  TO anon
  USING (referral_code IS NOT NULL);

-- Allow public to update user_id for sign-up completion
CREATE POLICY "Public can complete referrer signup"
  ON referrers FOR UPDATE
  TO anon
  USING (user_id IS NULL AND referral_code IS NOT NULL)
  WITH CHECK (user_id IS NOT NULL);

-- Allow public to read company names
CREATE POLICY "Public can view company names"
  ON companies FOR SELECT
  TO anon
  USING (true);
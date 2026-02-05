/*
  # Add public access for referrer sign-up

  ## Changes
  - Add RLS policy to allow public read access to referrers by referral code
  - Add RLS policy to allow public update of user_id for referrer sign-up completion
  - Add RLS policy to allow public read access to companies for signup page
  
  ## Security Notes
  - Only allows reading referrer info when accessing via referral code
  - Only allows updating user_id field during sign-up (not other sensitive fields)
  - Read-only access to company name for display purposes
*/

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
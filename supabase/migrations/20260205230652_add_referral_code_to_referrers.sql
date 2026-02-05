/*
  # Add referral code to referrers

  ## Changes
  - Add `referral_code` column to `referrers` table
    - Unique text field for generating QR codes and tracking sign-ups
    - Auto-generated on creation
  
  ## Notes
  - Referral codes are used to generate QR codes for referrer onboarding
  - Each referrer gets a unique code that links to their signup page
*/

-- Add referral_code column to referrers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referrers' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE referrers ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrers_referral_code ON referrers(referral_code);
/*
  # Add paid_at timestamp to commission_ledger
  
  1. Changes
    - Add `paid_at` column to `commission_ledger` table
      - Type: timestamptz (timestamp with time zone)
      - Nullable: yes (null until commission is paid)
      - Purpose: Track when a commission was actually paid out
  
  2. Notes
    - This field will be set when a commission status changes to 'paid'
    - Allows referrers to see exact payout dates on their commission history
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commission_ledger' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE commission_ledger ADD COLUMN paid_at timestamptz;
  END IF;
END $$;

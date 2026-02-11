/*
  # Allow Anonymous Lead Submissions

  1. Changes
    - Add INSERT policy for anonymous users (anon role) on the leads table
    - This allows public lead capture forms to work without authentication
  
  2. Security
    - Policy only grants INSERT permission (not SELECT, UPDATE, or DELETE)
    - Anonymous users cannot view existing leads or modify them
    - All other existing policies remain unchanged
    - Frontend validation ensures referral codes are valid before submission
  
  3. Notes
    - This is a common pattern for public-facing lead capture forms
    - The form validates referral codes and checks for duplicate emails
    - Only authenticated company members can view and manage leads
*/

-- Allow anonymous users to submit leads through the public lead capture form
CREATE POLICY "Anonymous users can submit leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);
-- ============================================================
-- Migration 005: Loan Enhancements
-- Adds: bank_emi_amount, outstanding_as_of_date
-- Extends: disbursements JSONB to support description field
-- ============================================================

-- Add bank_emi_amount: stores the EMI as stated by the bank
-- (may differ from the mathematically calculated EMI)
ALTER TABLE user_loans
ADD COLUMN IF NOT EXISTS bank_emi_amount         NUMERIC(15,2)  DEFAULT NULL,
ADD COLUMN IF NOT EXISTS outstanding_as_of_date  DATE           DEFAULT NULL;

-- Migrate existing disbursements: if they exist without description,
-- they're already valid — the new field is optional in the JSONB schema.
-- No data migration needed.

-- Add index on moratorium_end_date for fast moratorium phase queries
CREATE INDEX IF NOT EXISTS idx_user_loans_moratorium
  ON user_loans(user_id, moratorium_end_date)
  WHERE moratorium_end_date IS NOT NULL;

-- Comment the new columns
COMMENT ON COLUMN user_loans.bank_emi_amount IS
  'EMI amount as stated by the bank on the loan statement. May differ from the calculated EMI due to interest capitalization or different bank rounding.';

COMMENT ON COLUMN user_loans.outstanding_as_of_date IS
  'Date when current_outstanding was last manually set or verified against a bank statement.';

-- ============================================================
-- LOAN MANAGEMENT MODULE — Migration 004
-- Improvements: Education Loan Disbursements
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE user_loans
ADD COLUMN IF NOT EXISTS disbursements JSONB DEFAULT '[]'::jsonb;

-- Example format for disbursements:
-- [{"date": "2022-11-03", "amount": 120000}, {"date": "2023-10-30", "amount": 120000}]

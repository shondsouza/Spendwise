-- ============================================================
-- LOAN MANAGEMENT TABLES
-- Run this in the Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. USER LOANS — Core loan record
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_loans (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic info
  loan_name               TEXT NOT NULL CHECK (char_length(loan_name) <= 120),
  lender_name             TEXT NOT NULL CHECK (char_length(lender_name) <= 120),
  loan_type               TEXT NOT NULL DEFAULT 'personal'
                          CHECK (loan_type IN ('education', 'personal', 'home', 'vehicle', 'custom')),

  -- Principal tracking (stored separately — never combined)
  original_principal      NUMERIC(14, 2) NOT NULL CHECK (original_principal > 0),
  current_outstanding     NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (current_outstanding >= 0),
  accrued_interest        NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (accrued_interest >= 0),
  total_interest_paid     NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_interest_paid >= 0),
  total_principal_paid    NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_principal_paid >= 0),

  -- Interest configuration
  interest_type           TEXT NOT NULL DEFAULT 'compound'
                          CHECK (interest_type IN ('simple', 'compound', 'hybrid')),
  interest_rate           NUMERIC(6, 4) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0 AND interest_rate <= 100),

  -- Dates
  loan_start_date         DATE NOT NULL,
  loan_end_date           DATE,

  -- Moratorium (education / hybrid loans)
  moratorium_course_start DATE,
  moratorium_course_end   DATE,
  grace_period_months     SMALLINT CHECK (grace_period_months >= 0 AND grace_period_months <= 60),
  moratorium_si_rate      NUMERIC(6, 4) CHECK (moratorium_si_rate >= 0 AND moratorium_si_rate <= 100),
  moratorium_end_date     DATE,

  -- Repayment / EMI configuration
  emi_start_date          DATE,
  emi_amount              NUMERIC(12, 2),
  loan_tenure_months      SMALLINT CHECK (loan_tenure_months >= 1 AND loan_tenure_months <= 600),
  ci_rate                 NUMERIC(6, 4) CHECK (ci_rate >= 0 AND ci_rate <= 100),
  compounding_frequency   TEXT DEFAULT 'monthly'
                          CHECK (compounding_frequency IN ('monthly', 'quarterly', 'yearly')),

  -- Status & metadata
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'closed', 'defaulted')),
  notes                   TEXT CHECK (char_length(notes) <= 500),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. LOAN PAYMENTS — Individual payment records
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loan_payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id               UUID REFERENCES user_loans(id) ON DELETE CASCADE NOT NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  payment_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  amount                NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_type          TEXT NOT NULL DEFAULT 'emi'
                        CHECK (payment_type IN ('emi', 'interest', 'prepayment', 'lump_sum')),

  -- Breakdown (always stored separately)
  principal_component   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (principal_component >= 0),
  interest_component    NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (interest_component >= 0),
  balance_after         NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance_after >= 0),

  note                  TEXT CHECK (char_length(note) <= 300),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. LOAN SNAPSHOTS — Monthly balance history for charts
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loan_snapshots (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id               UUID REFERENCES user_loans(id) ON DELETE CASCADE NOT NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  snapshot_date         DATE NOT NULL,
  outstanding_balance   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_interest_paid   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_principal_paid  NUMERIC(12, 2) NOT NULL DEFAULT 0,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (loan_id, snapshot_date)
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_loans_user      ON user_loans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_loans_status    ON user_loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan   ON loan_payments(loan_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user   ON loan_payments(user_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_loan_snapshots_loan  ON loan_snapshots(loan_id, snapshot_date DESC);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE user_loans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_snapshots   ENABLE ROW LEVEL SECURITY;

-- user_loans policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_loans' AND policyname='user_loans_select') THEN
    CREATE POLICY "user_loans_select" ON user_loans FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_loans' AND policyname='user_loans_insert') THEN
    CREATE POLICY "user_loans_insert" ON user_loans FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_loans' AND policyname='user_loans_update') THEN
    CREATE POLICY "user_loans_update" ON user_loans FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_loans' AND policyname='user_loans_delete') THEN
    CREATE POLICY "user_loans_delete" ON user_loans FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- loan_payments policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='loan_payments' AND policyname='loan_payments_select') THEN
    CREATE POLICY "loan_payments_select" ON loan_payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='loan_payments' AND policyname='loan_payments_insert') THEN
    CREATE POLICY "loan_payments_insert" ON loan_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='loan_payments' AND policyname='loan_payments_delete') THEN
    CREATE POLICY "loan_payments_delete" ON loan_payments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- loan_snapshots policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='loan_snapshots' AND policyname='loan_snapshots_select') THEN
    CREATE POLICY "loan_snapshots_select" ON loan_snapshots FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='loan_snapshots' AND policyname='loan_snapshots_insert') THEN
    CREATE POLICY "loan_snapshots_insert" ON loan_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_loans_updated_at ON user_loans;
CREATE TRIGGER set_user_loans_updated_at
  BEFORE UPDATE ON user_loans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

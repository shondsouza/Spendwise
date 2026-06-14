-- ============================================================
-- LOAN MANAGEMENT MODULE — Migration 003
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- This is ADDITIVE — does NOT drop existing tables.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------------------------------------------------------------------------
-- USER_LOANS — Core loan records
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_loans (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic Information
  loan_name                 TEXT NOT NULL CHECK (char_length(loan_name) <= 120),
  lender_name               TEXT NOT NULL CHECK (char_length(lender_name) <= 120),
  loan_type                 TEXT NOT NULL DEFAULT 'personal'
                            CHECK (loan_type IN ('education', 'personal', 'home', 'vehicle', 'custom')),

  -- Principal Tracking
  original_principal        NUMERIC(14, 2) NOT NULL CHECK (original_principal > 0),
  current_outstanding       NUMERIC(14, 2) NOT NULL DEFAULT 0,
  accrued_interest          NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_interest_paid       NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_principal_paid      NUMERIC(14, 2) NOT NULL DEFAULT 0,

  -- Interest Configuration
  interest_type             TEXT NOT NULL DEFAULT 'compound'
                            CHECK (interest_type IN ('simple', 'compound', 'hybrid')),
  interest_rate             NUMERIC(6, 4) NOT NULL CHECK (interest_rate >= 0),

  -- Dates
  loan_start_date           DATE NOT NULL,
  loan_end_date             DATE,

  -- Moratorium Phase (Education Loans — hybrid type)
  moratorium_course_start   DATE,
  moratorium_course_end     DATE,
  grace_period_months       SMALLINT DEFAULT 6 CHECK (grace_period_months >= 0),
  moratorium_si_rate        NUMERIC(6, 4),
  moratorium_end_date       DATE,  -- computed: course_end + grace_period

  -- Repayment / EMI Phase
  emi_start_date            DATE,
  emi_amount                NUMERIC(12, 2),
  loan_tenure_months        SMALLINT CHECK (loan_tenure_months > 0),
  ci_rate                   NUMERIC(6, 4),   -- compound rate for repayment phase
  compounding_frequency     TEXT DEFAULT 'monthly'
                            CHECK (compounding_frequency IN ('monthly', 'quarterly', 'yearly')),

  -- Status
  status                    TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'closed', 'defaulted')),
  notes                     TEXT CHECK (char_length(notes) <= 500),

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

------------------------------------------------------------------------
-- LOAN_PAYMENTS — Individual payment records
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id               UUID REFERENCES user_loans(id) ON DELETE CASCADE NOT NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  payment_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  amount                NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_type          TEXT NOT NULL DEFAULT 'emi'
                        CHECK (payment_type IN ('emi', 'interest', 'prepayment', 'lump_sum')),

  -- Payment breakdown
  principal_component   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  interest_component    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_after         NUMERIC(14, 2) NOT NULL DEFAULT 0,

  note                  TEXT CHECK (char_length(note) <= 300),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

------------------------------------------------------------------------
-- LOAN_SNAPSHOTS — Monthly balance snapshots (for charts)
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_snapshots (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id                 UUID REFERENCES user_loans(id) ON DELETE CASCADE NOT NULL,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  snapshot_date           DATE NOT NULL,
  outstanding_balance     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_interest_paid     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_principal_paid    NUMERIC(14, 2) NOT NULL DEFAULT 0,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(loan_id, snapshot_date)
);

------------------------------------------------------------------------
-- PERFORMANCE INDEXES
------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_loans_user        ON user_loans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_loans_status      ON user_loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan     ON loan_payments(loan_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user     ON loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_snapshots_loan    ON loan_snapshots(loan_id, snapshot_date DESC);

------------------------------------------------------------------------
-- ROW LEVEL SECURITY
------------------------------------------------------------------------
ALTER TABLE user_loans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_snapshots  ENABLE ROW LEVEL SECURITY;

-- user_loans policies
CREATE POLICY "user_loans_select" ON user_loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_loans_insert" ON user_loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_loans_update" ON user_loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_loans_delete" ON user_loans FOR DELETE USING (auth.uid() = user_id);

-- loan_payments policies
CREATE POLICY "loan_payments_select" ON loan_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loan_payments_insert" ON loan_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "loan_payments_update" ON loan_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "loan_payments_delete" ON loan_payments FOR DELETE USING (auth.uid() = user_id);

-- loan_snapshots policies
CREATE POLICY "loan_snapshots_all" ON loan_snapshots FOR ALL USING (auth.uid() = user_id);

------------------------------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_loan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loan_updated_at_trigger
  BEFORE UPDATE ON user_loans
  FOR EACH ROW EXECUTE FUNCTION update_loan_updated_at();

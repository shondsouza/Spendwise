-- SpendWise Supabase Schema
-- Run this ENTIRE file in Supabase SQL Editor.
-- It drops old tables first, then creates the correct ones with user_id.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------------------------------------------------------------------------
-- CLEANUP: Drop old tables/views/policies from any previous schema
------------------------------------------------------------------------
DROP VIEW IF EXISTS monthly_transaction_summary CASCADE;
DROP VIEW IF EXISTS monthly_net_balance CASCADE;
DROP VIEW IF EXISTS monthly_expense_summary CASCADE;

DROP TABLE IF EXISTS taken_repayments CASCADE;
DROP TABLE IF EXISTS money_taken CASCADE;
DROP TABLE IF EXISTS given_repayments CASCADE;
DROP TABLE IF EXISTS money_given CASCADE;
DROP TABLE IF EXISTS recurring_payments CASCADE;
DROP TABLE IF EXISTS savings_goals CASCADE;
DROP TABLE IF EXISTS borrowed CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS income CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

------------------------------------------------------------------------
-- EXPENSES
------------------------------------------------------------------------
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL CHECK (char_length(title) <= 100),
  amount          NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category        TEXT NOT NULL CHECK (char_length(category) <= 40),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT CHECK (char_length(notes) <= 300),
  payment_method  TEXT NOT NULL DEFAULT 'Cash'
                  CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

------------------------------------------------------------------------
-- INCOME
------------------------------------------------------------------------
CREATE TABLE income (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL CHECK (char_length(title) <= 100),
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL CHECK (char_length(category) <= 40),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT CHECK (char_length(notes) <= 300),
  source      TEXT CHECK (char_length(source) <= 60),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

------------------------------------------------------------------------
-- BUDGETS
------------------------------------------------------------------------
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL CHECK (char_length(category) <= 40),
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  month       SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        SMALLINT NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category, month, year)
);

------------------------------------------------------------------------
-- CATEGORIES
------------------------------------------------------------------------
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL CHECK (char_length(name) <= 40),
  type        TEXT NOT NULL CHECK (type IN ('expense', 'income', 'both')),
  emoji       TEXT NOT NULL DEFAULT '📁',
  color       TEXT NOT NULL DEFAULT '#6e6e73',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

------------------------------------------------------------------------
-- LOANS (money lent to others)
------------------------------------------------------------------------
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  lent_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Repaid', 'Partially Repaid')),
  repayments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------------------
-- BORROWED (money borrowed from others)
------------------------------------------------------------------------
CREATE TABLE borrowed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  borrowed_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Repaid', 'Partially Repaid')),
  repayments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------------------
-- SAVINGS GOALS
------------------------------------------------------------------------
CREATE TABLE savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  saved_amount NUMERIC NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------------------
-- RECURRING PAYMENTS
------------------------------------------------------------------------
CREATE TABLE recurring_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('Subscription', 'EMI')),
  frequency TEXT NOT NULL CHECK (frequency IN ('Monthly', 'Annually')),
  next_payment_date DATE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------------------
-- MONEY GIVEN (loans given to others)
------------------------------------------------------------------------
CREATE TABLE money_given (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_name     TEXT NOT NULL CHECK (char_length(person_name) <= 80),
  amount          NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  given_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  reason          TEXT CHECK (char_length(reason) <= 200),
  expected_return DATE,
  status          TEXT NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'Partially Returned', 'Returned')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE given_repayments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  given_id      UUID REFERENCES money_given(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT CHECK (char_length(note) <= 200),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

------------------------------------------------------------------------
-- MONEY TAKEN (loans borrowed from others)
------------------------------------------------------------------------
CREATE TABLE money_taken (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_name   TEXT NOT NULL CHECK (char_length(person_name) <= 80),
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  taken_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  reason        TEXT CHECK (char_length(reason) <= 200),
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'Pending'
                CHECK (status IN ('Pending', 'Partially Repaid', 'Repaid')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE taken_repayments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  taken_id    UUID REFERENCES money_taken(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  paid_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT CHECK (char_length(note) <= 200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

------------------------------------------------------------------------
-- PERFORMANCE INDEXES
------------------------------------------------------------------------
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, year DESC, month DESC);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_loans_user_lent_date ON loans(user_id, lent_date);
CREATE INDEX idx_borrowed_user_borrowed_date ON borrowed(user_id, borrowed_date);
CREATE INDEX idx_savings_goals_user_due_date ON savings_goals(user_id, due_date);
CREATE INDEX idx_given_user    ON money_given(user_id, given_date DESC);
CREATE INDEX idx_given_status  ON money_given(user_id, status);
CREATE INDEX idx_taken_user    ON money_taken(user_id, taken_date DESC);
CREATE INDEX idx_taken_status  ON money_taken(user_id, status);
CREATE INDEX idx_given_rep     ON given_repayments(given_id);
CREATE INDEX idx_taken_rep     ON taken_repayments(taken_id);
CREATE INDEX idx_recurring_payments_user_next_date ON recurring_payments(user_id, next_payment_date);

------------------------------------------------------------------------
-- ROW LEVEL SECURITY
------------------------------------------------------------------------
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowed ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_given      ENABLE ROW LEVEL SECURITY;
ALTER TABLE given_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_taken      ENABLE ROW LEVEL SECURITY;
ALTER TABLE taken_repayments ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "expense_select" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expense_insert" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expense_update" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expense_delete" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Income policies
CREATE POLICY "income_select" ON income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "income_insert" ON income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_update" ON income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "income_delete" ON income FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "budget_select" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budget_insert" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget_update" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budget_delete" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "category_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "category_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "category_update" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "category_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Loans policies
CREATE POLICY "loans_select" ON loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loans_insert" ON loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "loans_update" ON loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "loans_delete" ON loans FOR DELETE USING (auth.uid() = user_id);

-- Borrowed policies
CREATE POLICY "borrowed_select" ON borrowed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "borrowed_insert" ON borrowed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "borrowed_update" ON borrowed FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "borrowed_delete" ON borrowed FOR DELETE USING (auth.uid() = user_id);

-- Savings goals policies
CREATE POLICY "savings_goals_select" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_insert" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_goals_update" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_delete" ON savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Recurring payments policies
CREATE POLICY "recurring_payments_select" ON recurring_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_payments_insert" ON recurring_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_payments_update" ON recurring_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_payments_delete" ON recurring_payments FOR DELETE USING (auth.uid() = user_id);

-- Money given policies
CREATE POLICY "given_all" ON money_given FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "given_rep_all" ON given_repayments FOR ALL USING (auth.uid() = user_id);

-- Money taken policies
CREATE POLICY "taken_all" ON money_taken FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "taken_rep_all" ON taken_repayments FOR ALL USING (auth.uid() = user_id);

------------------------------------------------------------------------
-- USEFUL VIEWS (used by dashboard)
------------------------------------------------------------------------
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', date) AS month,
  category,
  SUM(amount) AS total,
  COUNT(*) AS transaction_count
FROM expenses
GROUP BY user_id, DATE_TRUNC('month', date), category;

CREATE OR REPLACE VIEW monthly_net_balance AS
SELECT
  user_id,
  DATE_TRUNC('month', date) AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses
FROM (
  SELECT user_id, date, 'expense' AS type, amount FROM expenses
  UNION ALL
  SELECT user_id, date, 'income' AS type, amount FROM income
) combined
GROUP BY user_id, DATE_TRUNC('month', date);

------------------------------------------------------------------------
-- FREE TIER HEALTH CHECK
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_db_size()
RETURNS bigint AS $$
  SELECT pg_database_size(current_database());
$$ LANGUAGE sql SECURITY DEFINER;

------------------------------------------------------------------------
-- AUTO STATUS UPDATE TRIGGERS
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_given_status()
RETURNS TRIGGER AS $$
DECLARE
  total_repaid  NUMERIC;
  original      NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_repaid
  FROM given_repayments WHERE given_id = NEW.given_id;

  SELECT amount INTO original
  FROM money_given WHERE id = NEW.given_id;

  IF total_repaid >= original THEN
    UPDATE money_given SET status = 'Returned'
    WHERE id = NEW.given_id;
  ELSIF total_repaid > 0 THEN
    UPDATE money_given SET status = 'Partially Returned'
    WHERE id = NEW.given_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_given_status
  AFTER INSERT ON given_repayments
  FOR EACH ROW EXECUTE FUNCTION update_given_status();

CREATE OR REPLACE FUNCTION update_taken_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  original   NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM taken_repayments WHERE taken_id = NEW.taken_id;

  SELECT amount INTO original
  FROM money_taken WHERE id = NEW.taken_id;

  IF total_paid >= original THEN
    UPDATE money_taken SET status = 'Repaid'
    WHERE id = NEW.taken_id;
  ELSIF total_paid > 0 THEN
    UPDATE money_taken SET status = 'Partially Repaid'
    WHERE id = NEW.taken_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_taken_status
  AFTER INSERT ON taken_repayments
  FOR EACH ROW EXECUTE FUNCTION update_taken_status();

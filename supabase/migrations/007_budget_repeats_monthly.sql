-- Monthly recurring budgets: when true, limit carries into the next month
-- and spent resets; when false, budget applies to that month only.
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS repeats_monthly BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN budgets.repeats_monthly IS
  'When true, budget limit repeats every month and remaining resets; when false, applies to that month only.';

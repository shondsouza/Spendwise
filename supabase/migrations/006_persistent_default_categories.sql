ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS default_key TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS categories_user_default_key_idx
  ON categories (user_id, default_key);

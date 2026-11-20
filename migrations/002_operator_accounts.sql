ALTER TABLE operators ADD COLUMN IF NOT EXISTS owner_user_id TEXT UNIQUE;
CREATE TABLE IF NOT EXISTS operator_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(operator_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_operator_users_user ON operator_users(user_id);
CREATE TABLE IF NOT EXISTS operator_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_reference TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
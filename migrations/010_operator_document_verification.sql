ALTER TABLE operators ADD COLUMN IF NOT EXISTS registration_no TEXT NOT NULL DEFAULT '';
ALTER TABLE operators ADD COLUMN IF NOT EXISTS contact_name TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS operator_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('business_registration','pan_vat','transport_license','authorized_contact_id')),
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operator_id, document_type)
);
CREATE INDEX IF NOT EXISTS idx_operator_documents_operator ON operator_documents(operator_id, created_at DESC);
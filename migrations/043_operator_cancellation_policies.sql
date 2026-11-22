CREATE TABLE IF NOT EXISTS operator_cancellation_policies (
  operator_id uuid PRIMARY KEY REFERENCES operators(id) ON DELETE CASCADE,
  rules jsonb NOT NULL,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bus_cancellation_requests
  ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES operators(id),
  ADD COLUMN IF NOT EXISTS policy_source text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS policy_rules_snapshot jsonb;
CREATE INDEX IF NOT EXISTS idx_operator_cancellation_policies_updated
  ON operator_cancellation_policies(updated_at DESC);
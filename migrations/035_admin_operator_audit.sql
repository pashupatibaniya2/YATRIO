CREATE TABLE IF NOT EXISTS operator_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_operator_admin_audit_created ON operator_admin_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_admin_audit_operator ON operator_admin_audit(operator_id,created_at DESC);
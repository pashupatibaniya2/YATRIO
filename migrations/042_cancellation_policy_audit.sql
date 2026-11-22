CREATE TABLE IF NOT EXISTS yatrio_cancellation_policy_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id text NOT NULL,
 old_rules jsonb NOT NULL,
 new_rules jsonb NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_yatrio_cancellation_policy_audit_changed ON yatrio_cancellation_policy_audit(changed_at DESC);
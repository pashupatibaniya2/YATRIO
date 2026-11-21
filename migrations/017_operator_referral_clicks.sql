CREATE TABLE IF NOT EXISTS operator_referral_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL REFERENCES operator_referral_codes(code) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  campaign text NOT NULL DEFAULT 'operator-referral',
  visitor_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operator_referral_click_events_visitor_unique UNIQUE (referral_code, visitor_key)
);
CREATE INDEX IF NOT EXISTS idx_operator_referral_click_events_code_created
  ON operator_referral_click_events(referral_code, created_at DESC);
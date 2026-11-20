CREATE TABLE IF NOT EXISTS operator_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL UNIQUE REFERENCES operators(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS operator_referral_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  new_operator_id uuid NOT NULL UNIQUE REFERENCES operators(id) ON DELETE CASCADE,
  referral_code text NOT NULL REFERENCES operator_referral_codes(code),
  referred_by_operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_operator_referral_attributions_referrer
  ON operator_referral_attributions(referred_by_operator_id, created_at);
INSERT INTO operator_referral_codes (operator_id, code)
SELECT o.id, 'YTR' || upper(substr(replace(o.id::text, '-', ''), 1, 8))
FROM operators o
WHERE o.status = 'approved'
ON CONFLICT (operator_id) DO NOTHING;
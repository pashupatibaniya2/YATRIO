CREATE TABLE IF NOT EXISTS operator_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NOT NULL DEFAULT '',
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
  moderation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  moderated_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_operator_reviews_public ON operator_reviews(operator_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_reviews_owner ON operator_reviews(user_id,created_at DESC);
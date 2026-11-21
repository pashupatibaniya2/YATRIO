CREATE TABLE IF NOT EXISTS saved_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  trip_days INTEGER NOT NULL DEFAULT 3 CHECK (trip_days BETWEEN 2 AND 14),
  travel_style TEXT NOT NULL DEFAULT 'balanced',
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget JSONB NOT NULL DEFAULT '{}'::jsonb,
  wishlist JSONB NOT NULL DEFAULT '[]'::jsonb,
  actual_spend JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_trips_owner_updated ON saved_trips(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_trips_share_token ON saved_trips(share_token) WHERE is_shared = TRUE;
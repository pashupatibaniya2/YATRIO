CREATE TABLE IF NOT EXISTS shared_trip_views (
  share_token TEXT PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  trip_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shared_trip_views_owner ON shared_trip_views(user_id);
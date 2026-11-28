ALTER TABLE shared_trip_views ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
UPDATE shared_trip_views SET expires_at=created_at+interval '30 days' WHERE expires_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shared_trip_views_expiry ON shared_trip_views(expires_at);
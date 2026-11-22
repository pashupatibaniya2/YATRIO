CREATE INDEX IF NOT EXISTS idx_passenger_trip_locations_expiry
 ON passenger_trip_locations(expires_at);
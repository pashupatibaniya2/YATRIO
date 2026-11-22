CREATE TABLE IF NOT EXISTS passenger_trip_locations (
 booking_id uuid PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
 schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
 operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 latitude numeric(10,7) NOT NULL,
 longitude numeric(10,7) NOT NULL,
 accuracy_m numeric(8,2),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(latitude BETWEEN -90 AND 90),
 CHECK(longitude BETWEEN -180 AND 180),
 CHECK(accuracy_m IS NULL OR accuracy_m BETWEEN 0 AND 10000)
);
CREATE INDEX IF NOT EXISTS idx_passenger_trip_locations_operator
 ON passenger_trip_locations(operator_id,schedule_id,expires_at)
 WHERE revoked_at IS NULL;
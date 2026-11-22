ALTER TABLE booking_notifications
 ADD COLUMN IF NOT EXISTS recipient_whatsapp text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS whatsapp_status text NOT NULL DEFAULT 'not_configured',
 ADD COLUMN IF NOT EXISTS whatsapp_message_id text,
 ADD COLUMN IF NOT EXISTS whatsapp_error text,
 ADD COLUMN IF NOT EXISTS whatsapp_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS bus_trip_share_links (
 booking_id uuid PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
 schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
 user_id text,
 token text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bus_trip_share_links ADD COLUMN IF NOT EXISTS user_id text;
UPDATE bus_trip_share_links l SET user_id=b.customer_user_id FROM bookings b WHERE b.id=l.booking_id AND l.user_id IS NULL;
ALTER TABLE bus_trip_share_links ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bus_trip_share_token ON bus_trip_share_links(token,expires_at);

CREATE TABLE IF NOT EXISTS bus_live_locations (
 schedule_id uuid PRIMARY KEY REFERENCES schedules(id) ON DELETE CASCADE,
 operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 latitude numeric(10,7) NOT NULL,
 longitude numeric(10,7) NOT NULL,
 accuracy_m numeric(8,2),
 recorded_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(latitude BETWEEN -90 AND 90),
 CHECK(longitude BETWEEN -180 AND 180)
);
ALTER TABLE bus_live_locations ADD COLUMN IF NOT EXISTS user_id text;
UPDATE bus_live_locations SET user_id=recorded_by WHERE user_id IS NULL;
ALTER TABLE bus_live_locations ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bus_live_locations_updated ON bus_live_locations(updated_at DESC);
ALTER TABLE traveller_profiles
 ADD COLUMN IF NOT EXISTS emergency_name text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS emergency_phone text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS emergency_relationship text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS travel_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
 ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"booking_updates":true,"trip_tips":false,"offers":false}'::jsonb,
 ADD COLUMN IF NOT EXISTS avatar_storage_key text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_traveller_profiles_user_updated ON traveller_profiles(user_id,updated_at);
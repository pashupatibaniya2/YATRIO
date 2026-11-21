CREATE TABLE IF NOT EXISTS traveller_profiles (
 user_id text PRIMARY KEY,
 full_name text NOT NULL DEFAULT '',
 phone text NOT NULL DEFAULT '',
 home_city text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_traveller_profiles_updated ON traveller_profiles(updated_at);
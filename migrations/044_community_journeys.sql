CREATE TABLE IF NOT EXISTS community_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  display_name text NOT NULL DEFAULT 'YATRIO traveller' CHECK (char_length(display_name) BETWEEN 2 AND 40),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  destination text NOT NULL CHECK (char_length(destination) BETWEEN 2 AND 100),
  story text NOT NULL CHECK (char_length(story) BETWEEN 30 AND 1800),
  storage_key text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  image_bytes integer NOT NULL CHECK (image_bytes BETWEEN 1 AND 5242880),
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','published','rejected','removed')),
  verified_journey boolean NOT NULL DEFAULT false,
  moderation_note text,
  moderated_by text,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_journeys_public ON community_journeys(moderation_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_journeys_owner ON community_journeys(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS community_journey_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES community_journeys(id) ON DELETE CASCADE,
  reporter_user_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam','inappropriate','misleading','privacy','copyright','other')),
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(journey_id,reporter_user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_journey_reports_status ON community_journey_reports(status,created_at DESC);
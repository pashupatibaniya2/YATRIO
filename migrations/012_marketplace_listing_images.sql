CREATE TABLE IF NOT EXISTS marketplace_listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  storage_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  bytes integer NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_review_order ON marketplace_listing_images(listing_id,review_status,sort_order,created_at);
CREATE INDEX IF NOT EXISTS idx_listing_images_provider_user ON marketplace_listing_images(provider_id,user_id,created_at);
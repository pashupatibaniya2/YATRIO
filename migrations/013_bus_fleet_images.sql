CREATE TABLE IF NOT EXISTS bus_fleet_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 bus_id uuid NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
 operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 storage_key text NOT NULL UNIQUE,
 content_type text NOT NULL,
 bytes integer NOT NULL,
 image_type text NOT NULL CHECK(image_type IN ('exterior','interior','amenities','seat_layout')),
 alt_text text NOT NULL DEFAULT '',
 sort_order integer NOT NULL DEFAULT 0,
 review_status text NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
 review_note text,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bus_fleet_images_public ON bus_fleet_images(bus_id,review_status,image_type,sort_order,created_at);
CREATE INDEX IF NOT EXISTS idx_bus_fleet_images_owner ON bus_fleet_images(operator_id,user_id,created_at);
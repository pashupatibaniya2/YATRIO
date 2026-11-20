ALTER TABLE marketplace_providers ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 30);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id),
  user_id TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES marketplace_categories(slug),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  price_from NUMERIC(12,2) NOT NULL CHECK (price_from > 0),
  currency TEXT NOT NULL DEFAULT 'NPR',
  price_unit TEXT NOT NULL DEFAULT 'per_person',
  cover_image_url TEXT NOT NULL DEFAULT '',
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_public ON marketplace_listings(category_slug,status,city);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_provider ON marketplace_listings(provider_id,created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0 AND reserved_quantity <= capacity),
  price_override NUMERIC(12,2) CHECK (price_override IS NULL OR price_override > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','sold_out')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_availability_listing_time ON marketplace_availability(listing_id,starts_at,status);

CREATE TABLE IF NOT EXISTS marketplace_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT NOT NULL UNIQUE DEFAULT ('YT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
  availability_id UUID NOT NULL REFERENCES marketplace_availability(id),
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id),
  user_id TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 20),
  traveler_name TEXT NOT NULL,
  traveler_email TEXT NOT NULL DEFAULT '',
  traveler_phone TEXT NOT NULL,
  customer_note TEXT NOT NULL DEFAULT '',
  booking_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  currency TEXT NOT NULL DEFAULT 'NPR',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  provider_payout_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_provider_confirmation' CHECK (status IN ('pending_provider_confirmation','provider_confirmed','rejected','cancelled','completed','expired')),
  payment_status TEXT NOT NULL DEFAULT 'not_started' CHECK (payment_status IN ('not_started','pending','paid','refunded','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_bookings_customer ON marketplace_bookings(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_bookings_provider ON marketplace_bookings(provider_user_id,status,created_at DESC);

CREATE OR REPLACE FUNCTION yatrio_marketplace_booking_before_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_av marketplace_availability%ROWTYPE;
  v_listing marketplace_listings%ROWTYPE;
  v_provider marketplace_providers%ROWTYPE;
BEGIN
  SELECT * INTO v_av FROM marketplace_availability WHERE id=NEW.availability_id AND listing_id=NEW.listing_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selected availability slot was not found'; END IF;
  SELECT * INTO v_listing FROM marketplace_listings WHERE id=NEW.listing_id;
  IF NOT FOUND OR v_listing.status <> 'published' THEN RAISE EXCEPTION 'This service is not currently bookable'; END IF;
  SELECT * INTO v_provider FROM marketplace_providers WHERE id=v_listing.provider_id;
  IF NOT FOUND OR v_provider.status <> 'approved' THEN RAISE EXCEPTION 'This provider is not verified'; END IF;
  IF v_av.status <> 'active' OR v_av.starts_at <= now() THEN RAISE EXCEPTION 'This availability is no longer open'; END IF;
  IF NEW.quantity < 1 OR NEW.quantity > 20 OR v_av.reserved_quantity + NEW.quantity > v_av.capacity THEN RAISE EXCEPTION 'Not enough availability remains'; END IF;
  UPDATE marketplace_availability SET reserved_quantity=reserved_quantity+NEW.quantity,
    status=CASE WHEN reserved_quantity+NEW.quantity >= capacity THEN 'sold_out' ELSE status END
    WHERE id=v_av.id;
  NEW.provider_id := v_provider.id;
  NEW.provider_user_id := v_provider.user_id;
  NEW.category_slug := v_listing.category_slug;
  NEW.currency := v_listing.currency;
  NEW.unit_price := COALESCE(v_av.price_override,v_listing.price_from);
  NEW.total_amount := NEW.unit_price * NEW.quantity;
  NEW.commission_rate := v_provider.commission_rate;
  NEW.commission_amount := round(NEW.total_amount * NEW.commission_rate / 100,2);
  NEW.provider_payout_amount := NEW.total_amount - NEW.commission_amount;
  NEW.status := 'pending_provider_confirmation';
  NEW.payment_status := 'not_started';
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_marketplace_booking_before_insert ON marketplace_bookings;
CREATE TRIGGER trg_yatrio_marketplace_booking_before_insert
BEFORE INSERT ON marketplace_bookings
FOR EACH ROW EXECUTE FUNCTION yatrio_marketplace_booking_before_insert();

CREATE OR REPLACE FUNCTION yatrio_marketplace_booking_release_inventory()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status NOT IN ('rejected','cancelled','expired') AND NEW.status IN ('rejected','cancelled','expired') THEN
    UPDATE marketplace_availability
      SET reserved_quantity=GREATEST(0,reserved_quantity-OLD.quantity),
          status=CASE WHEN status='sold_out' AND GREATEST(0,reserved_quantity-OLD.quantity) < capacity THEN 'active' ELSE status END
      WHERE id=OLD.availability_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_marketplace_booking_release ON marketplace_bookings;
CREATE TRIGGER trg_yatrio_marketplace_booking_release
BEFORE UPDATE OF status ON marketplace_bookings
FOR EACH ROW EXECUTE FUNCTION yatrio_marketplace_booking_release_inventory();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;
UPDATE bookings SET hold_expires_at = created_at + interval '8 minutes'
WHERE status = 'awaiting_payment' AND hold_expires_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_hold_expiry ON bookings(hold_expires_at) WHERE status = 'awaiting_payment';
CREATE INDEX IF NOT EXISTS idx_seat_inventory_hold_expiry ON seat_inventory(hold_expires_at) WHERE status = 'held';
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_one_active_attempt_per_booking
  ON payment_transactions(booking_id) WHERE status IN ('initiated','pending');

CREATE OR REPLACE FUNCTION yatrio_marketplace_booking_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_4d9282204bbb3288
AS $$
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

CREATE OR REPLACE FUNCTION yatrio_marketplace_booking_release_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_4d9282204bbb3288
AS $$
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

CREATE TABLE IF NOT EXISTS marketplace_provider_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  booking_id UUID NOT NULL UNIQUE,
  booking_ref TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  traveler_name TEXT NOT NULL,
  traveler_email TEXT NOT NULL DEFAULT '',
  traveler_phone TEXT NOT NULL,
  customer_note TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  provider_payout_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  listing_title TEXT NOT NULL,
  city TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_marketplace_provider_bookings_owner
  ON marketplace_provider_bookings(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_provider_booking_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  booking_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('confirm','reject')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_provider_actions_owner
  ON marketplace_provider_booking_actions(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION yatrio_sync_marketplace_provider_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_4d9282204bbb3288
AS $$
BEGIN
  INSERT INTO marketplace_provider_bookings
    (user_id,booking_id,booking_ref,category_slug,quantity,traveler_name,traveler_email,traveler_phone,customer_note,currency,unit_price,total_amount,commission_rate,commission_amount,provider_payout_amount,status,payment_status,listing_title,city,starts_at,ends_at,created_at)
  SELECT NEW.provider_user_id,NEW.id,NEW.booking_ref,NEW.category_slug,NEW.quantity,NEW.traveler_name,NEW.traveler_email,NEW.traveler_phone,NEW.customer_note,NEW.currency,NEW.unit_price,NEW.total_amount,NEW.commission_rate,NEW.commission_amount,NEW.provider_payout_amount,NEW.status,NEW.payment_status,l.title,l.city,a.starts_at,a.ends_at,NEW.created_at
  FROM marketplace_listings l
  JOIN marketplace_availability a ON a.id=NEW.availability_id
  WHERE l.id=NEW.listing_id
  ON CONFLICT (booking_id) DO UPDATE SET
    user_id=EXCLUDED.user_id, booking_ref=EXCLUDED.booking_ref,
    category_slug=EXCLUDED.category_slug, quantity=EXCLUDED.quantity,
    traveler_name=EXCLUDED.traveler_name, traveler_email=EXCLUDED.traveler_email,
    traveler_phone=EXCLUDED.traveler_phone, customer_note=EXCLUDED.customer_note,
    currency=EXCLUDED.currency, unit_price=EXCLUDED.unit_price,
    total_amount=EXCLUDED.total_amount, commission_rate=EXCLUDED.commission_rate,
    commission_amount=EXCLUDED.commission_amount,
    provider_payout_amount=EXCLUDED.provider_payout_amount,
    status=EXCLUDED.status, payment_status=EXCLUDED.payment_status,
    listing_title=EXCLUDED.listing_title, city=EXCLUDED.city,
    starts_at=EXCLUDED.starts_at, ends_at=EXCLUDED.ends_at;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_sync_marketplace_provider_booking ON marketplace_bookings;
CREATE TRIGGER trg_yatrio_sync_marketplace_provider_booking
AFTER INSERT OR UPDATE OF status, payment_status ON marketplace_bookings
FOR EACH ROW EXECUTE FUNCTION yatrio_sync_marketplace_provider_booking();

INSERT INTO marketplace_provider_bookings
  (user_id,booking_id,booking_ref,category_slug,quantity,traveler_name,traveler_email,traveler_phone,customer_note,currency,unit_price,total_amount,commission_rate,commission_amount,provider_payout_amount,status,payment_status,listing_title,city,starts_at,ends_at,created_at)
SELECT b.provider_user_id,b.id,b.booking_ref,b.category_slug,b.quantity,b.traveler_name,b.traveler_email,b.traveler_phone,b.customer_note,b.currency,b.unit_price,b.total_amount,b.commission_rate,b.commission_amount,b.provider_payout_amount,b.status,b.payment_status,l.title,l.city,a.starts_at,a.ends_at,b.created_at
FROM marketplace_bookings b
JOIN marketplace_listings l ON l.id=b.listing_id
JOIN marketplace_availability a ON a.id=b.availability_id
ON CONFLICT (booking_id) DO NOTHING;

CREATE OR REPLACE FUNCTION yatrio_apply_marketplace_provider_booking_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_4d9282204bbb3288
AS $$
DECLARE
  v_booking UUID;
BEGIN
  UPDATE marketplace_bookings
  SET status = CASE WHEN NEW.action='confirm' THEN 'provider_confirmed' ELSE 'rejected' END,
      updated_at=now()
  WHERE id=NEW.booking_id
    AND provider_user_id=NEW.user_id
    AND status='pending_provider_confirmation'
  RETURNING id INTO v_booking;
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking is not pending or does not belong to this provider';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_apply_marketplace_provider_booking_action ON marketplace_provider_booking_actions;
CREATE TRIGGER trg_yatrio_apply_marketplace_provider_booking_action
BEFORE INSERT ON marketplace_provider_booking_actions
FOR EACH ROW EXECUTE FUNCTION yatrio_apply_marketplace_provider_booking_action();
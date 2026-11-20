ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS provider_business_name TEXT NOT NULL DEFAULT '';
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS provider_description TEXT NOT NULL DEFAULT '';
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS provider_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (provider_commission_rate >= 0 AND provider_commission_rate <= 30);
UPDATE marketplace_listings l
SET provider_business_name=p.business_name,
    provider_description=p.description,
    provider_commission_rate=p.commission_rate
FROM marketplace_providers p
WHERE p.id=l.provider_id;

CREATE OR REPLACE FUNCTION yatrio_marketplace_booking_before_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_av marketplace_availability%ROWTYPE;
  v_listing marketplace_listings%ROWTYPE;
BEGIN
  SELECT * INTO v_av FROM marketplace_availability WHERE id=NEW.availability_id AND listing_id=NEW.listing_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selected availability slot was not found'; END IF;
  SELECT * INTO v_listing FROM marketplace_listings WHERE id=NEW.listing_id;
  IF NOT FOUND OR v_listing.status <> 'published' THEN RAISE EXCEPTION 'This service is not currently bookable'; END IF;
  IF v_av.status <> 'active' OR v_av.starts_at <= now() THEN RAISE EXCEPTION 'This availability is no longer open'; END IF;
  IF NEW.quantity < 1 OR NEW.quantity > 20 OR v_av.reserved_quantity + NEW.quantity > v_av.capacity THEN RAISE EXCEPTION 'Not enough availability remains'; END IF;
  UPDATE marketplace_availability SET reserved_quantity=reserved_quantity+NEW.quantity,
    status=CASE WHEN reserved_quantity+NEW.quantity >= capacity THEN 'sold_out' ELSE status END
    WHERE id=v_av.id;
  NEW.provider_id := v_listing.provider_id;
  NEW.provider_user_id := v_listing.user_id;
  NEW.category_slug := v_listing.category_slug;
  NEW.currency := v_listing.currency;
  NEW.unit_price := COALESCE(v_av.price_override,v_listing.price_from);
  NEW.total_amount := NEW.unit_price * NEW.quantity;
  NEW.commission_rate := v_listing.provider_commission_rate;
  NEW.commission_amount := round(NEW.total_amount * NEW.commission_rate / 100,2);
  NEW.provider_payout_amount := NEW.total_amount - NEW.commission_amount;
  NEW.status := 'pending_provider_confirmation';
  NEW.payment_status := 'not_started';
  RETURN NEW;
END $$;
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS customer_user_id TEXT,
  ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id),
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 7.00,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_payout_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'NPR';

UPDATE bookings bk
SET operator_id = b.operator_id,
    commission_rate = o.commission_rate,
    commission_amount = round(bk.total_amount * o.commission_rate / 100, 2),
    provider_payout_amount = bk.total_amount - round(bk.total_amount * o.commission_rate / 100, 2)
FROM schedules s
JOIN buses b ON b.id=s.bus_id
JOIN operators o ON o.id=b.operator_id
WHERE bk.schedule_id=s.id AND bk.operator_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bus_bookings_customer ON bookings(customer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bus_bookings_operator ON bookings(operator_id,created_at DESC);

CREATE TABLE IF NOT EXISTS yatrio_commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('bus','marketplace')),
  booking_id UUID NOT NULL,
  booking_reference TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('bus_operator','marketplace_provider')),
  provider_id UUID NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  provider_payout_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  settlement_status TEXT NOT NULL DEFAULT 'not_payable_until_paid' CHECK (settlement_status IN ('not_payable_until_paid','pending_settlement','settled','reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_type,booking_id)
);
CREATE INDEX IF NOT EXISTS idx_yatrio_commission_provider ON yatrio_commission_ledger(provider_type,provider_id,created_at DESC);

INSERT INTO yatrio_commission_ledger
  (booking_type,booking_id,booking_reference,provider_type,provider_id,gross_amount,commission_rate,commission_amount,provider_payout_amount,currency)
SELECT 'bus',bk.id,bk.pnr,'bus_operator',bk.operator_id,bk.total_amount,bk.commission_rate,bk.commission_amount,bk.provider_payout_amount,bk.currency
FROM bookings bk
WHERE bk.operator_id IS NOT NULL
ON CONFLICT (booking_type,booking_id) DO NOTHING;

CREATE OR REPLACE FUNCTION yatrio_record_bus_commission()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.operator_id IS NOT NULL THEN
    INSERT INTO yatrio_commission_ledger
      (booking_type,booking_id,booking_reference,provider_type,provider_id,gross_amount,commission_rate,commission_amount,provider_payout_amount,currency)
    VALUES ('bus',NEW.id,NEW.pnr,'bus_operator',NEW.operator_id,NEW.total_amount,NEW.commission_rate,NEW.commission_amount,NEW.provider_payout_amount,NEW.currency)
    ON CONFLICT (booking_type,booking_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_record_bus_commission ON bookings;
CREATE TRIGGER trg_yatrio_record_bus_commission
AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION yatrio_record_bus_commission();

CREATE OR REPLACE FUNCTION yatrio_record_marketplace_commission()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO yatrio_commission_ledger
    (booking_type,booking_id,booking_reference,provider_type,provider_id,gross_amount,commission_rate,commission_amount,provider_payout_amount,currency)
  VALUES ('marketplace',NEW.id,NEW.booking_ref,'marketplace_provider',NEW.provider_id,NEW.total_amount,NEW.commission_rate,NEW.commission_amount,NEW.provider_payout_amount,NEW.currency)
  ON CONFLICT (booking_type,booking_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_record_marketplace_commission ON marketplace_bookings;
CREATE TRIGGER trg_yatrio_record_marketplace_commission
AFTER INSERT ON marketplace_bookings FOR EACH ROW EXECUTE FUNCTION yatrio_record_marketplace_commission();
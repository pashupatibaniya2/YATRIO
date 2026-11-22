CREATE OR REPLACE FUNCTION yatrio_sync_bus_commission_settlement()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='confirmed' THEN
    UPDATE yatrio_commission_ledger
      SET settlement_status='pending_settlement'
      WHERE booking_type='bus' AND booking_id=NEW.id
        AND settlement_status='not_payable_until_paid';
  ELSIF NEW.status IN ('cancelled','expired') THEN
    UPDATE yatrio_commission_ledger
      SET settlement_status='reversed'
      WHERE booking_type='bus' AND booking_id=NEW.id
        AND settlement_status='not_payable_until_paid'
        AND NOT EXISTS (
          SELECT 1 FROM payment_transactions p
          WHERE p.booking_type='bus' AND p.booking_id=NEW.id AND p.status='succeeded'
        );
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_sync_bus_commission_settlement ON bookings;
CREATE TRIGGER trg_yatrio_sync_bus_commission_settlement
AFTER UPDATE OF status ON bookings
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION yatrio_sync_bus_commission_settlement();

CREATE OR REPLACE FUNCTION yatrio_sync_marketplace_commission_settlement()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_status='paid' THEN
    UPDATE yatrio_commission_ledger
      SET settlement_status='pending_settlement'
      WHERE booking_type='marketplace' AND booking_id=NEW.id
        AND settlement_status='not_payable_until_paid';
  ELSIF NEW.status IN ('cancelled','rejected','expired') AND NEW.payment_status<>'paid' THEN
    UPDATE yatrio_commission_ledger
      SET settlement_status='reversed'
      WHERE booking_type='marketplace' AND booking_id=NEW.id
        AND settlement_status='not_payable_until_paid';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_yatrio_sync_marketplace_commission_settlement ON marketplace_bookings;
CREATE TRIGGER trg_yatrio_sync_marketplace_commission_settlement
AFTER UPDATE OF status,payment_status ON marketplace_bookings
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION yatrio_sync_marketplace_commission_settlement();
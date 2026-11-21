ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_booking_type_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_booking_type_check
  CHECK (booking_type IN ('marketplace','bus'));

CREATE INDEX IF NOT EXISTS idx_payment_transactions_bus_booking
  ON payment_transactions(booking_id,created_at DESC)
  WHERE booking_type='bus';
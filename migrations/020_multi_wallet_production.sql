ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_provider_check
  CHECK (provider IN ('khalti','esewa','fonepay'));
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_mode_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_mode_check
  CHECK (mode IN ('production'));
ALTER TABLE payment_transactions ALTER COLUMN mode SET DEFAULT 'production';
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_status
  ON payment_transactions(provider,status,created_at DESC);
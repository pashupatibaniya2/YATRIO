CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('marketplace')),
  booking_id UUID NOT NULL,
  booking_ref TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'khalti' CHECK (provider IN ('khalti')),
  mode TEXT NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  amount_paisa INTEGER NOT NULL CHECK (amount_paisa > 0),
  currency TEXT NOT NULL DEFAULT 'NPR' CHECK (currency = 'NPR'),
  purchase_order_id TEXT NOT NULL UNIQUE,
  provider_payment_id TEXT,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','pending','succeeded','failed','cancelled','refunded')),
  failure_reason TEXT,
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_provider_id
  ON payment_transactions(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_created
  ON payment_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking
  ON payment_transactions(booking_type, booking_id, created_at DESC);
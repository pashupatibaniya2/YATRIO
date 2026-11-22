CREATE TABLE IF NOT EXISTS yatrio_cancellation_policy (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id=1),
  currency text NOT NULL DEFAULT 'NPR',
  rules jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO yatrio_cancellation_policy(id,currency,rules) VALUES
(1,'NPR','[
 {"min_hours":48,"max_hours":null,"fee_percent":10,"refund_percent":90,"label":"48 hours or more"},
 {"min_hours":24,"max_hours":48,"fee_percent":20,"refund_percent":80,"label":"24 to under 48 hours"},
 {"min_hours":12,"max_hours":24,"fee_percent":30,"refund_percent":70,"label":"12 to under 24 hours"},
 {"min_hours":6,"max_hours":12,"fee_percent":50,"refund_percent":50,"label":"6 to under 12 hours"},
 {"min_hours":2,"max_hours":6,"fee_percent":75,"refund_percent":25,"label":"2 to under 6 hours"},
 {"min_hours":0,"max_hours":2,"fee_percent":100,"refund_percent":0,"label":"Under 2 hours"}
]'::jsonb)
ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS bus_cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  user_id text NOT NULL,
  booking_ref text NOT NULL,
  departure_at timestamptz NOT NULL,
  hours_before_departure numeric(10,2) NOT NULL,
  paid_amount numeric(10,2) NOT NULL,
  fee_percent numeric(5,2) NOT NULL,
  fee_amount numeric(10,2) NOT NULL,
  refund_percent numeric(5,2) NOT NULL,
  estimated_refund numeric(10,2) NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','rejected','processing','refund_recorded')),
  admin_note text NOT NULL DEFAULT '',
  provider_refund_reference text NOT NULL DEFAULT '',
  actual_refund_amount numeric(10,2),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bus_cancellation_requests_user ON bus_cancellation_requests(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bus_cancellation_requests_status ON bus_cancellation_requests(status,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bus_cancellation_active ON bus_cancellation_requests(booking_id)
WHERE status IN ('pending_review','approved','processing');
CREATE TABLE IF NOT EXISTS operator_drivers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 full_name text NOT NULL,
 phone text NOT NULL DEFAULT '',
 whatsapp_opt_in boolean NOT NULL DEFAULT false,
 driver_contact_consent boolean NOT NULL DEFAULT false,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(length(trim(full_name)) BETWEEN 2 AND 120),
 CHECK(length(phone) <= 30)
);
CREATE INDEX IF NOT EXISTS idx_operator_drivers_owner ON operator_drivers(operator_id,active,full_name);
CREATE TABLE IF NOT EXISTS schedule_driver_assignments (
 schedule_id uuid PRIMARY KEY REFERENCES schedules(id) ON DELETE CASCADE,
 driver_id uuid NOT NULL REFERENCES operator_drivers(id) ON DELETE RESTRICT,
 operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 share_driver_phone boolean NOT NULL DEFAULT false,
 assigned_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_schedule_driver_operator ON schedule_driver_assignments(operator_id,schedule_id);
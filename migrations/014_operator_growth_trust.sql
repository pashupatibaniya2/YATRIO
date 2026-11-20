ALTER TABLE buses ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_buses_operator_active ON buses(operator_id,status);
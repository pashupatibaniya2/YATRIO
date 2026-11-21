ALTER TABLE buses
  ADD COLUMN IF NOT EXISTS seat_layout_config JSONB NOT NULL
  DEFAULT '{"layout":"auto","cabin_width":2.45,"row_spacing":0.74,"interior_color":"#e5eef0","seat_color":"#2e6474"}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_buses_seat_layout_config
  ON buses USING GIN (seat_layout_config);
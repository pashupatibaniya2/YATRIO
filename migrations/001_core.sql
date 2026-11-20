CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 7.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    province TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT 'Nepal'
  );
  CREATE TABLE IF NOT EXISTS terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id),
    name TEXT NOT NULL,
    address TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_terminal_id UUID NOT NULL REFERENCES terminals(id),
    destination_terminal_id UUID NOT NULL REFERENCES terminals(id),
    distance_km INTEGER,
    duration_label TEXT DEFAULT '',
    UNIQUE(origin_terminal_id, destination_terminal_id)
  );
  CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES operators(id),
    name TEXT NOT NULL,
    registration_no TEXT UNIQUE NOT NULL,
    bus_type TEXT NOT NULL DEFAULT 'Deluxe',
    capacity INTEGER NOT NULL DEFAULT 32,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE IF NOT EXISTS bus_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    seat_type TEXT NOT NULL DEFAULT 'standard',
    UNIQUE(bus_id, seat_number)
  );
  CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id),
    route_id UUID NOT NULL REFERENCES routes(id),
    departure_at TIMESTAMPTZ NOT NULL,
    arrival_at TIMESTAMPTZ NOT NULL,
    fare NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS seat_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES bus_seats(id),
    status TEXT NOT NULL DEFAULT 'available',
    hold_token TEXT,
    hold_expires_at TIMESTAMPTZ,
    booking_id UUID,
    UNIQUE(schedule_id, seat_id)
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pnr TEXT UNIQUE NOT NULL,
    schedule_id UUID NOT NULL REFERENCES schedules(id),
    passenger_name TEXT NOT NULL,
    passenger_email TEXT DEFAULT '',
    passenger_phone TEXT NOT NULL,
    seat_numbers TEXT[] NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment',
    payment_mode TEXT NOT NULL DEFAULT 'demo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_schedules_departure ON schedules(departure_at);
  CREATE INDEX IF NOT EXISTS idx_routes_terminals ON routes(origin_terminal_id, destination_terminal_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_schedule_status ON seat_inventory(schedule_id, status);
  CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
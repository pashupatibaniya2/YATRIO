CREATE TABLE IF NOT EXISTS communication_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_type text NOT NULL CHECK (booking_type IN ('bus','marketplace')),
 booking_id uuid NOT NULL,
 booking_ref text NOT NULL,
 created_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (booking_type, booking_id)
);
CREATE TABLE IF NOT EXISTS communication_thread_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 participant_role text NOT NULL CHECK (participant_role IN ('traveller','operator','admin')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (thread_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_comm_members_user ON communication_thread_members(user_id,thread_id);
CREATE TABLE IF NOT EXISTS communication_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 message_group_id uuid NOT NULL,
 thread_id uuid NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 sender_user_id text NOT NULL,
 sender_role text NOT NULL CHECK (sender_role IN ('traveller','operator','admin')),
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comm_messages_thread_user ON communication_messages(thread_id,user_id,created_at);
CREATE TABLE IF NOT EXISTS support_tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id text NOT NULL,
 booking_type text CHECK (booking_type IN ('bus','marketplace')),
 booking_id uuid,
 subject text NOT NULL,
 category text NOT NULL DEFAULT 'general',
 priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
 assigned_admin text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id,updated_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status,priority,updated_at);
CREATE TABLE IF NOT EXISTS support_ticket_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 sender_user_id text NOT NULL,
 sender_role text NOT NULL CHECK (sender_role IN ('traveller','operator','admin')),
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_ticket_messages(ticket_id,user_id,created_at);
CREATE TABLE IF NOT EXISTS booking_timeline (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id text NOT NULL,
 booking_type text NOT NULL CHECK (booking_type IN ('bus','marketplace')),
 booking_id uuid NOT NULL,
 event_type text NOT NULL,
 title text NOT NULL,
 detail text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (booking_type,booking_id,event_type)
);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_user ON booking_timeline(user_id,booking_type,booking_id,created_at);
ALTER TABLE booking_notifications ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;
ALTER TABLE booking_notifications ADD COLUMN IF NOT EXISTS last_retry_at timestamptz;
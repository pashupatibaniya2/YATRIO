CREATE TABLE IF NOT EXISTS booking_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id text NOT NULL,
 booking_type text NOT NULL CHECK (booking_type IN ('bus','marketplace')),
 booking_id uuid NOT NULL,
 booking_ref text NOT NULL,
 event_type text NOT NULL,
 title text NOT NULL,
 message text NOT NULL,
 recipient_email text NOT NULL DEFAULT '',
 email_status text NOT NULL DEFAULT 'not_attempted' CHECK (email_status IN ('not_attempted','sent','failed','skipped')),
 email_message_id text,
 email_error text,
 is_read boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 UNIQUE(booking_type,booking_id,event_type)
);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_user_created ON booking_notifications(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_unread ON booking_notifications(user_id,is_read,created_at DESC);
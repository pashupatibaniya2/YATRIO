ALTER TABLE communication_threads ADD COLUMN IF NOT EXISTS conversation_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE communication_threads ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT '';
ALTER TABLE communication_threads ADD COLUMN IF NOT EXISTS participant_role text NOT NULL DEFAULT 'traveller';
ALTER TABLE communication_threads DROP CONSTRAINT IF EXISTS communication_threads_booking_type_booking_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_comm_thread_booking_user ON communication_threads(booking_type,booking_id,user_id);
CREATE INDEX IF NOT EXISTS idx_comm_thread_user_updated ON communication_threads(user_id,updated_at);
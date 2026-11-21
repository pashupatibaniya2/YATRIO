ALTER TABLE communication_threads ADD COLUMN IF NOT EXISTS participant_user_ids text[] NOT NULL DEFAULT '{}';
ALTER TABLE communication_threads ADD COLUMN IF NOT EXISTS participant_roles jsonb NOT NULL DEFAULT '[]'::jsonb;
DROP INDEX IF EXISTS idx_comm_thread_booking_user;
CREATE UNIQUE INDEX IF NOT EXISTS idx_comm_thread_booking_unique ON communication_threads(booking_type,booking_id);

CREATE POLICY yatrio_threads_select_guard ON communication_threads AS RESTRICTIVE FOR SELECT
USING (COALESCE(current_setting('hatchable.user_id',true),'') = ANY(participant_user_ids));
CREATE POLICY yatrio_threads_insert_guard ON communication_threads AS RESTRICTIVE FOR INSERT
WITH CHECK (COALESCE(current_setting('hatchable.user_id',true),'') = ANY(participant_user_ids));
CREATE POLICY yatrio_threads_update_guard ON communication_threads AS RESTRICTIVE FOR UPDATE
USING (COALESCE(current_setting('hatchable.user_id',true),'') = ANY(participant_user_ids))
WITH CHECK (COALESCE(current_setting('hatchable.user_id',true),'') = ANY(participant_user_ids));
CREATE POLICY yatrio_threads_delete_guard ON communication_threads AS RESTRICTIVE FOR DELETE USING (false);

CREATE POLICY yatrio_messages_select_guard ON communication_messages AS RESTRICTIVE FOR SELECT
USING (EXISTS(SELECT 1 FROM communication_threads t WHERE t.id=communication_messages.thread_id AND COALESCE(current_setting('hatchable.user_id',true),'') = ANY(t.participant_user_ids)));
CREATE POLICY yatrio_messages_insert_guard ON communication_messages AS RESTRICTIVE FOR INSERT
WITH CHECK (sender_user_id=COALESCE(current_setting('hatchable.user_id',true),'') AND EXISTS(SELECT 1 FROM communication_threads t WHERE t.id=communication_messages.thread_id AND COALESCE(current_setting('hatchable.user_id',true),'') = ANY(t.participant_user_ids)));
CREATE POLICY yatrio_messages_update_guard ON communication_messages AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY yatrio_messages_delete_guard ON communication_messages AS RESTRICTIVE FOR DELETE USING (false);

CREATE POLICY yatrio_booking_notifications_select_guard ON booking_notifications AS RESTRICTIVE FOR SELECT
USING (current_setting('hatchable.user_id',true) IS NULL OR user_id=current_setting('hatchable.user_id',true));
CREATE POLICY yatrio_booking_notifications_insert_guard ON booking_notifications AS RESTRICTIVE FOR INSERT
WITH CHECK (
 (booking_type='bus' AND EXISTS(SELECT 1 FROM bookings b WHERE b.id=booking_id AND b.customer_user_id=user_id))
 OR
 (booking_type='marketplace' AND EXISTS(SELECT 1 FROM marketplace_bookings b WHERE b.id=booking_id AND b.user_id=user_id))
);
CREATE POLICY yatrio_booking_notifications_update_guard ON booking_notifications AS RESTRICTIVE FOR UPDATE
USING (current_setting('hatchable.user_id',true) IS NULL OR user_id=current_setting('hatchable.user_id',true))
WITH CHECK (current_setting('hatchable.user_id',true) IS NULL OR user_id=current_setting('hatchable.user_id',true));
CREATE POLICY yatrio_booking_notifications_delete_guard ON booking_notifications AS RESTRICTIVE FOR DELETE USING (false);

CREATE POLICY yatrio_marketplace_booking_participant_read ON marketplace_bookings AS RESTRICTIVE FOR SELECT
USING (current_setting('hatchable.user_id',true) IS NULL OR user_id=COALESCE(current_setting('hatchable.user_id',true),'') OR provider_user_id=COALESCE(current_setting('hatchable.user_id',true),''));

CREATE OR REPLACE FUNCTION get_booking_notification_context(p_user_id text,p_booking_type text,p_booking_id uuid)
RETURNS TABLE(recipient_email text,booking_updates boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = app_4d9282204bbb3288, public AS $$
DECLARE v_owner text; v_booking_email text; v_account_email text; v_enabled boolean := false;
BEGIN
 IF p_booking_type='bus' THEN SELECT customer_user_id,passenger_email INTO v_owner,v_booking_email FROM bookings WHERE id=p_booking_id;
 ELSIF p_booking_type='marketplace' THEN SELECT user_id,traveler_email INTO v_owner,v_booking_email FROM marketplace_bookings WHERE id=p_booking_id;
 ELSE RAISE EXCEPTION 'Invalid booking type' USING ERRCODE='22023'; END IF;
 IF v_owner IS NULL OR v_owner<>p_user_id THEN RAISE EXCEPTION 'Booking owner mismatch' USING ERRCODE='42501'; END IF;
 SELECT email INTO v_account_email FROM users WHERE id=p_user_id;
 SELECT COALESCE((notification_preferences->>'booking_updates')::boolean,true) INTO v_enabled FROM traveller_profiles WHERE user_id=p_user_id;
 IF NOT FOUND THEN v_enabled:=false; END IF;
 RETURN QUERY SELECT COALESCE(NULLIF(v_booking_email,''),v_account_email,''),COALESCE(v_enabled,false);
END;
$$;

CREATE OR REPLACE FUNCTION record_booking_notification(p_user_id text,p_booking_type text,p_booking_id uuid,p_booking_ref text,p_event_type text,p_title text,p_message text,p_recipient_email text,p_email_status text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = app_4d9282204bbb3288, public AS $$
DECLARE v_owner text; v_id uuid;
BEGIN
 IF p_booking_type='bus' THEN SELECT customer_user_id INTO v_owner FROM bookings WHERE id=p_booking_id;
 ELSIF p_booking_type='marketplace' THEN SELECT user_id INTO v_owner FROM marketplace_bookings WHERE id=p_booking_id;
 ELSE RAISE EXCEPTION 'Invalid booking type' USING ERRCODE='22023'; END IF;
 IF v_owner IS NULL OR v_owner<>p_user_id THEN RAISE EXCEPTION 'Booking owner mismatch' USING ERRCODE='42501'; END IF;
 v_id:=gen_random_uuid();
 INSERT INTO booking_notifications(id,user_id,booking_type,booking_id,booking_ref,event_type,title,message,recipient_email,email_status)
 VALUES(v_id,p_user_id,p_booking_type,p_booking_id,p_booking_ref,p_event_type,p_title,p_message,COALESCE(p_recipient_email,''),p_email_status)
 ON CONFLICT(booking_type,booking_id,event_type) DO NOTHING;
 IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN v_id;
END;
$$;

-- Legacy participant fan-out functions remain unused; the API now writes one message row after RLS membership checks.
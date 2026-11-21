CREATE OR REPLACE FUNCTION get_booking_notification_context(p_user_id text,p_booking_type text,p_booking_id uuid)
RETURNS TABLE(recipient_email text,booking_updates boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
 v_owner text;
 v_booking_email text;
 v_account_email text;
 v_enabled boolean := true;
BEGIN
 IF p_booking_type='bus' THEN
  SELECT customer_user_id,passenger_email INTO v_owner,v_booking_email FROM bookings WHERE id=p_booking_id;
 ELSIF p_booking_type='marketplace' THEN
  SELECT user_id,traveler_email INTO v_owner,v_booking_email FROM marketplace_bookings WHERE id=p_booking_id;
 ELSE
  RAISE EXCEPTION 'Invalid booking type' USING ERRCODE='22023';
 END IF;
 IF v_owner IS NULL OR v_owner<>p_user_id THEN RAISE EXCEPTION 'Booking owner mismatch' USING ERRCODE='42501'; END IF;
 SELECT email INTO v_account_email FROM users WHERE id=p_user_id;
 SELECT COALESCE((notification_preferences->>'booking_updates')::boolean,true) INTO v_enabled FROM traveller_profiles WHERE user_id=p_user_id;
 RETURN QUERY SELECT COALESCE(NULLIF(v_booking_email,''),v_account_email,''),COALESCE(v_enabled,true);
END;
$$;

CREATE OR REPLACE FUNCTION record_booking_notification(p_user_id text,p_booking_type text,p_booking_id uuid,p_booking_ref text,p_event_type text,p_title text,p_message text,p_recipient_email text,p_email_status text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
 v_owner text;
 v_id uuid;
BEGIN
 IF p_booking_type='bus' THEN SELECT customer_user_id INTO v_owner FROM bookings WHERE id=p_booking_id;
 ELSIF p_booking_type='marketplace' THEN SELECT user_id INTO v_owner FROM marketplace_bookings WHERE id=p_booking_id;
 ELSE RAISE EXCEPTION 'Invalid booking type' USING ERRCODE='22023'; END IF;
 IF v_owner IS NULL OR v_owner<>p_user_id THEN RAISE EXCEPTION 'Booking owner mismatch' USING ERRCODE='42501'; END IF;
 INSERT INTO booking_notifications(user_id,booking_type,booking_id,booking_ref,event_type,title,message,recipient_email,email_status)
 VALUES(p_user_id,p_booking_type,p_booking_id,p_booking_ref,p_event_type,p_title,p_message,COALESCE(p_recipient_email,''),p_email_status)
 ON CONFLICT(booking_type,booking_id,event_type) DO NOTHING RETURNING id INTO v_id;
 IF v_id IS NOT NULL THEN
  INSERT INTO booking_timeline(user_id,booking_type,booking_id,event_type,title,detail)
  VALUES(p_user_id,p_booking_type,p_booking_id,p_event_type,p_title,p_message)
  ON CONFLICT(booking_type,booking_id,event_type) DO NOTHING;
 END IF;
 RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_booking_notification_email(p_id uuid,p_status text,p_message_id text,p_error text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
 IF p_status NOT IN ('sent','failed','skipped','not_attempted') THEN RAISE EXCEPTION 'Invalid email status' USING ERRCODE='22023'; END IF;
 UPDATE booking_notifications SET email_status=p_status,email_message_id=COALESCE(p_message_id,email_message_id),email_error=p_error WHERE id=p_id;
 RETURN FOUND;
END;
$$;
CREATE OR REPLACE FUNCTION open_communication_thread(p_booking_type text,p_booking_id uuid,p_booking_ref text,p_participants jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = app_4d9282204bbb3288, public AS $$
DECLARE
 v_caller text := current_setting('hatchable.user_id',true);
 v_conversation uuid;
 v_caller_thread uuid;
 v_participant record;
 v_row_id uuid;
BEGIN
 IF v_caller IS NULL OR v_caller='' THEN RAISE EXCEPTION 'Sign-in required' USING ERRCODE='42501'; END IF;
 IF p_booking_type NOT IN ('bus','marketplace') OR p_booking_id IS NULL OR jsonb_typeof(p_participants)<>'array' THEN RAISE EXCEPTION 'Invalid conversation request' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_participants)<2 OR jsonb_array_length(p_participants)>10 THEN RAISE EXCEPTION 'Invalid participant list' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_to_recordset(p_participants) AS p(id text,role text) WHERE p.id=v_caller AND p.role IN ('traveller','operator')) THEN RAISE EXCEPTION 'Caller is not a participant' USING ERRCODE='42501'; END IF;
 SELECT conversation_id INTO v_conversation FROM communication_threads WHERE booking_type=p_booking_type AND booking_id=p_booking_id AND user_id=v_caller LIMIT 1;
 IF v_conversation IS NULL THEN v_conversation:=gen_random_uuid(); END IF;
 FOR v_participant IN SELECT DISTINCT p.id,p.role FROM jsonb_to_recordset(p_participants) AS p(id text,role text) WHERE COALESCE(p.id,'')<>'' AND p.role IN ('traveller','operator')
 LOOP
  INSERT INTO communication_threads(id,conversation_id,booking_type,booking_id,booking_ref,created_by,user_id,participant_role)
  VALUES(gen_random_uuid(),v_conversation,p_booking_type,p_booking_id,p_booking_ref,v_caller,v_participant.id,v_participant.role)
  ON CONFLICT(booking_type,booking_id,user_id) DO UPDATE SET conversation_id=EXCLUDED.conversation_id,booking_ref=EXCLUDED.booking_ref,participant_role=EXCLUDED.participant_role,updated_at=now()
  RETURNING id INTO v_row_id;
  IF v_participant.id=v_caller THEN v_caller_thread:=v_row_id; END IF;
 END LOOP;
 IF v_caller_thread IS NULL THEN RAISE EXCEPTION 'Caller thread could not be created' USING ERRCODE='42501'; END IF;
 RETURN v_caller_thread;
END;
$$;
CREATE OR REPLACE FUNCTION send_communication_message(p_thread_row_id uuid,p_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = app_4d9282204bbb3288, public AS $$
DECLARE
 v_caller text := current_setting('hatchable.user_id',true);
 v_conversation uuid;
 v_role text;
 v_message_id uuid := gen_random_uuid();
 v_body text := btrim(COALESCE(p_body,''));
BEGIN
 IF v_caller IS NULL OR v_caller='' THEN RAISE EXCEPTION 'Sign-in required' USING ERRCODE='42501'; END IF;
 IF char_length(v_body)<1 OR char_length(v_body)>2000 THEN RAISE EXCEPTION 'Message must contain 1 to 2000 characters' USING ERRCODE='22023'; END IF;
 SELECT conversation_id,participant_role INTO v_conversation,v_role FROM communication_threads WHERE id=p_thread_row_id AND user_id=v_caller;
 IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found' USING ERRCODE='42501'; END IF;
 INSERT INTO communication_messages(message_group_id,thread_id,user_id,sender_user_id,sender_role,body)
 SELECT v_message_id,t.id,t.user_id,v_caller,v_role,v_body FROM communication_threads t WHERE t.conversation_id=v_conversation;
 UPDATE communication_threads SET updated_at=now() WHERE conversation_id=v_conversation;
 RETURN v_message_id;
END;
$$;
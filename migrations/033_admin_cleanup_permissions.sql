DROP POLICY yatrio_threads_delete_guard ON communication_threads;
DROP POLICY yatrio_messages_delete_guard ON communication_messages;
DROP POLICY yatrio_booking_notifications_delete_guard ON booking_notifications;

CREATE POLICY yatrio_threads_admin_delete_guard ON communication_threads AS RESTRICTIVE FOR DELETE
USING (current_setting('hatchable.user_id',true) IS NULL OR COALESCE(current_setting('hatchable.user_id',true),'')=ANY(participant_user_ids));
CREATE POLICY yatrio_messages_admin_delete_guard ON communication_messages AS RESTRICTIVE FOR DELETE
USING (current_setting('hatchable.user_id',true) IS NULL OR EXISTS(SELECT 1 FROM communication_threads t WHERE t.id=communication_messages.thread_id AND COALESCE(current_setting('hatchable.user_id',true),'')=ANY(t.participant_user_ids)));
CREATE POLICY yatrio_notifications_admin_delete_guard ON booking_notifications AS RESTRICTIVE FOR DELETE
USING (current_setting('hatchable.user_id',true) IS NULL);
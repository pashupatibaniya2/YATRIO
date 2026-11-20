import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
  const scheduleId = String(req.query.schedule_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(scheduleId)) return res.status(400).json({error:"A valid schedule_id is required."});
  await db.query("UPDATE bookings SET status='expired' WHERE status='awaiting_payment' AND id IN (SELECT booking_id FROM seat_inventory WHERE schedule_id=$1 AND status='held' AND hold_expires_at <= now() AND booking_id IS NOT NULL)",[scheduleId]);
  await db.query("UPDATE seat_inventory SET status='available',hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE schedule_id=$1 AND status='held' AND hold_expires_at <= now()",[scheduleId]);
  const { rows } = await db.query(
    "SELECT si.id AS inventory_id, bs.seat_number, bs.seat_type, CASE WHEN si.status='booked' THEN 'booked' WHEN si.status='held' AND si.hold_expires_at > now() THEN 'held' ELSE 'available' END AS display_status FROM seat_inventory si JOIN bus_seats bs ON bs.id=si.seat_id WHERE si.schedule_id=$1 ORDER BY bs.seat_number",
    [scheduleId]
  );
  res.json({ seats: rows, demo_data: true });
}
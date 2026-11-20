import { db } from "hatchable";
export const access = "scheduler";
export const methods = ["POST"];
export default async function(req,res) {
  const expiredBookings=await db.query(
    "UPDATE bookings SET status='expired' WHERE status='awaiting_payment' AND hold_expires_at IS NOT NULL AND hold_expires_at <= now() RETURNING id"
  );
  const released=await db.query(
    "UPDATE seat_inventory SET status='available',hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE status='held' AND hold_expires_at <= now() RETURNING id"
  );
  return res.json({expired_bookings:expiredBookings.rows.length,released_seats:released.rows.length,checked_at:new Date().toISOString()});
}
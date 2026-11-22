import { db } from "hatchable";
import { notifyBooking } from "lib/booking-notifications.js";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
  const userId=String(req.user.id);
  const bookingId=String(req.body?.booking_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(bookingId)) return res.status(400).json({error:"A valid booking ID is required."});
  const result=await db.query(
    "UPDATE bookings SET status='cancelled',hold_expires_at=now() WHERE id=$1 AND customer_user_id=$2 AND status='awaiting_payment' AND hold_expires_at>now() RETURNING id,pnr,schedule_id",
    [bookingId,userId]
  );
  if(!result.rows.length) return res.status(409).json({error:"This reservation cannot be cancelled. It may have expired, already been cancelled, or belong to another account."});
  const booking=result.rows[0];
  const released=await db.query(
    "UPDATE seat_inventory SET status='available',hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE booking_id=$1 AND status='held' RETURNING id",
    [booking.id]
  );
  try { const b=await db.query("SELECT customer_user_id,passenger_email,passenger_phone,passenger_name,pnr,total_amount,currency FROM bookings WHERE id=$1",[booking.id]); if(b.rows.length){const x=b.rows[0];await notifyBooking({userId:x.customer_user_id,bookingType:"bus",bookingId:booking.id,bookingRef:x.pnr,eventType:"bus_cancelled",to:x.passenger_email,phone:x.passenger_phone,name:x.passenger_name,service:"Bus journey",amount:x.total_amount,currency:x.currency});} } catch(e) { console.error("Bus cancellation notification could not be recorded."); }
  return res.json({booking:{id:booking.id,pnr:booking.pnr,status:"cancelled"},released_seats:released.rows.length,message:"Reservation cancelled. Its held seats have been released. No payment was collected."});
}
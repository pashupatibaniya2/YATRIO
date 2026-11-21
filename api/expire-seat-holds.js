import { db } from "hatchable";
import { notifyBooking } from "lib/booking-notifications.js";
export const access = "scheduler";
export const methods = ["POST"];
export default async function(req,res) {
  const expiredBookings=await db.query(
    "UPDATE bookings SET status='expired' WHERE status='awaiting_payment' AND hold_expires_at IS NOT NULL AND hold_expires_at <= now() RETURNING id,pnr,customer_user_id,passenger_email,passenger_name,total_amount,currency"
  );
  for(const booking of expiredBookings.rows){try{await notifyBooking({userId:String(booking.customer_user_id||""),bookingType:"bus",bookingId:booking.id,bookingRef:booking.pnr,eventType:"bus_expired",to:booking.passenger_email,name:booking.passenger_name,service:"Bus journey",amount:booking.total_amount,currency:booking.currency});}catch(e){console.error("Expired seat hold notification could not be recorded.");}}
  const released=await db.query(
    "UPDATE seat_inventory SET status='available',hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE status='held' AND hold_expires_at <= now() RETURNING id"
  );
  return res.json({expired_bookings:expiredBookings.rows.length,released_seats:released.rows.length,checked_at:new Date().toISOString()});
}
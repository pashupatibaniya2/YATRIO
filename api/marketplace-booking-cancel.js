import { db } from "hatchable";
import { notifyBooking } from "lib/booking-notifications.js";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
  const userId=String(req.user.id);
  const id=String(req.body.booking_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({error:"A valid booking_id is required."});
  const result=await db.query("UPDATE marketplace_bookings SET status='cancelled',updated_at=now() WHERE id=$1 AND user_id=$2 AND status='pending_provider_confirmation' RETURNING id,booking_ref,status",[id,userId]);
  if(!result.rows.length) return res.status(409).json({error:"Only your pending booking requests can be cancelled in this version. Contact YATRIO support for a provider-confirmed request."});
  try {
    const info=await db.query("SELECT user_id,traveler_email,traveler_phone,traveler_name,total_amount,currency,l.title,a.starts_at FROM marketplace_bookings b JOIN marketplace_listings l ON l.id=b.listing_id JOIN marketplace_availability a ON a.id=b.availability_id WHERE b.id=$1",[id]);
    if(info.rows.length){const x=info.rows[0];await notifyBooking({userId:x.user_id,bookingType:"marketplace",bookingId:id,bookingRef:result.rows[0].booking_ref,eventType:"marketplace_cancelled",to:x.traveler_email,phone:x.traveler_phone,name:x.traveler_name,service:x.title,amount:x.total_amount,currency:x.currency,when:x.starts_at});}
  } catch(e) { console.error("Marketplace cancellation notification could not be recorded."); }
  res.json({booking:result.rows[0],message:"Booking request cancelled. Reserved availability has been released. No refund was needed because no payment was collected."});
}
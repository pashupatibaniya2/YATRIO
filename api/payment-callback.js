import { db, config } from "hatchable";
import { notifyBooking } from "lib/booking-notifications.js";
export const access = "public";
export const methods = ["GET"];
const BASE = "https://dev.khalti.com/api/v2";
export default async function(req,res) {
  const pidx = String(req.query.pidx || "");
  if (!pidx || pidx.length > 100) return res.status(400).json({error:"Missing or invalid payment reference."});
  const { rows } = await db.query(
    "SELECT id,booking_id,booking_ref,user_id,amount_paisa,purchase_order_id,status FROM payment_transactions WHERE booking_type='marketplace' AND provider='khalti' AND mode='sandbox' AND provider_payment_id=$1 LIMIT 1",
    [pidx]
  );
  if (!rows.length) return res.status(404).json({error:"Payment reference not found."});
  const payment = rows[0];
  const userId=String(payment.user_id);
  if (payment.status === "succeeded") return res.json({status:"succeeded",booking_ref:payment.booking_ref,message:"Payment was already verified."});
  const secret = await config.get("KHALTI_SECRET_KEY");
  if (!secret) return res.status(503).json({error:"Payment verification is temporarily unavailable. Sign in and retry from your bookings page."});
  let verification;
  try {
    const response = await fetch(BASE + "/epayment/lookup/", {
      method:"POST",
      headers:{"Authorization":"Key " + secret,"Content-Type":"application/json"},
      body:JSON.stringify({pidx:pidx})
    });
    verification = await response.json();
    // Khalti documents Expired and User canceled as HTTP 400 lookup responses.
    if (!response.ok && !verification.status) return res.status(502).json({error:"Khalti lookup did not complete. Booking remains unpaid."});
  } catch (e) {
    return res.status(502).json({error:"Could not verify payment with Khalti. Booking remains unpaid."});
  }
  if (verification.pidx !== pidx || String(verification.purchase_order_id || "") !== String(payment.purchase_order_id) || Number(verification.total_amount) !== Number(payment.amount_paisa)) {
    await db.query(
      "UPDATE payment_transactions SET status='failed',failure_reason='Khalti reference or amount mismatch',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND user_id=$3 AND status <> 'succeeded'",
      [JSON.stringify(verification),payment.id,userId]
    );
    return res.status(409).json({error:"Payment verification mismatch. Booking remains unpaid; contact support."});
  }
  const status = String(verification.status || "").toLowerCase();
  if (status === "completed") {
    const result=await db.transaction([
      {
        sql:"UPDATE payment_transactions SET status='succeeded',failure_reason=NULL,provider_payload=$1::jsonb,verified_at=now(),updated_at=now() WHERE id=$2 AND user_id=$3 AND status <> 'succeeded' AND EXISTS (SELECT 1 FROM marketplace_bookings b WHERE b.id=$4 AND b.user_id=$3 AND b.status='provider_confirmed')",
        params:[JSON.stringify(verification),payment.id,userId,payment.booking_id]
      },
      {
        sql:"UPDATE marketplace_bookings SET payment_status='paid',updated_at=now() WHERE id=$1 AND user_id=$2 AND status='provider_confirmed' AND EXISTS (SELECT 1 FROM payment_transactions p WHERE p.id=$3 AND p.user_id=$2 AND p.status='succeeded')",
        params:[payment.booking_id,userId,payment.id]
      }
    ]);
    if (!result.results[1].rowCount) return res.status(409).json({error:"Payment was verified, but the booking is no longer eligible for confirmation. Contact YATRIO support before retrying."});
    try { const b=await db.query("SELECT user_id,traveler_email,traveler_phone,traveler_name,booking_ref,total_amount,currency,l.title,a.starts_at FROM marketplace_bookings JOIN marketplace_listings l ON l.id=marketplace_bookings.listing_id JOIN marketplace_availability a ON a.id=marketplace_bookings.availability_id WHERE marketplace_bookings.id=$1",[payment.booking_id]); if(b.rows.length){const x=b.rows[0];await notifyBooking({userId:x.user_id,bookingType:"marketplace",bookingId:payment.booking_id,bookingRef:x.booking_ref,eventType:"marketplace_paid",to:x.traveler_email,phone:x.traveler_phone,name:x.traveler_name,service:x.title,amount:x.total_amount,currency:x.currency,when:x.starts_at});} } catch(e) { console.error("Verified marketplace payment notification could not be recorded."); }
    return res.json({status:"succeeded",booking_ref:payment.booking_ref,message:"Khalti confirmed the payment and YATRIO updated your booking."});
  }
  if (status === "refunded") {
    await db.transaction([
      {sql:"UPDATE payment_transactions SET status='refunded',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND user_id=$3",params:[JSON.stringify(verification),payment.id,userId]},
      {sql:"UPDATE marketplace_bookings SET payment_status='refunded',updated_at=now() WHERE id=$1 AND user_id=$2",params:[payment.booking_id,userId]}
    ]);
    return res.json({status:"refunded",booking_ref:payment.booking_ref,message:"Khalti reports this payment as refunded."});
  }
  if (status === "partially refunded") {
    await db.query(
      "UPDATE payment_transactions SET failure_reason='Partially refunded - manual reconciliation required',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND user_id=$3",
      [JSON.stringify(verification),payment.id,userId]
    );
    return res.status(202).json({status:"review_required",booking_ref:payment.booking_ref,message:"Khalti reports a partial refund. YATRIO has flagged this for manual reconciliation; the booking remains marked paid pending review."});
  }
  if (status === "expired" || status === "user canceled") {
    const nextStatus=status==="expired"?"failed":"cancelled";
    await db.transaction([
      {sql:"UPDATE payment_transactions SET status=$1,failure_reason=$2,provider_payload=$3::jsonb,updated_at=now() WHERE id=$4 AND user_id=$5 AND status <> 'succeeded'",params:[nextStatus,status,JSON.stringify(verification),payment.id,userId]},
      {sql:"UPDATE marketplace_bookings SET payment_status='failed',updated_at=now() WHERE id=$1 AND user_id=$2 AND status='provider_confirmed' AND payment_status <> 'paid'",params:[payment.booking_id,userId]}
    ]);
    return res.json({status:nextStatus,booking_ref:payment.booking_ref,message:"Khalti did not complete this payment. Your booking remains unpaid; you may retry checkout."});
  }
  await db.query(
    "UPDATE payment_transactions SET status='pending',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND user_id=$3 AND status <> 'succeeded'",
    [JSON.stringify(verification),payment.id,userId]
  );
  return res.status(202).json({status:"pending",booking_ref:payment.booking_ref,message:"Khalti has not confirmed payment yet. Do not consider the booking paid."});
}
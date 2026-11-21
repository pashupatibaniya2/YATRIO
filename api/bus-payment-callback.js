import { db, config } from "hatchable";
export const access = "public";
export const methods = ["GET"];
const BASE="https://dev.khalti.com/api/v2";
const SITE="https://yatrio-nepal-bus.hatchable.site";

export default async function(req,res) {
  const pidx=String(req.query?.pidx||"");
  if(!pidx||pidx.length>100) return res.redirect(SITE+"/my-trips.html?payment=invalid");
  const found=await db.query(
    "SELECT id,booking_id,booking_ref,user_id,amount_paisa,purchase_order_id,status FROM payment_transactions WHERE booking_type='bus' AND provider='khalti' AND provider_payment_id=$1 LIMIT 1",
    [pidx]
  );
  if(!found.rows.length) return res.redirect(SITE+"/my-trips.html?payment=not-found");
  const payment=found.rows[0];
  if(payment.status==="succeeded") return res.redirect(SITE+"/my-trips.html?payment=success&ref="+encodeURIComponent(payment.booking_ref));
  const secret=await config.get("KHALTI_SECRET_KEY");
  if(!secret) return res.redirect(SITE+"/my-trips.html?payment=verify-later&ref="+encodeURIComponent(payment.booking_ref));
  let verification;
  try {
    const response=await fetch(BASE+"/epayment/lookup/",{
      method:"POST",headers:{"Authorization":"Key "+secret,"Content-Type":"application/json"},
      body:JSON.stringify({pidx})
    });
    verification=await response.json();
    if(!response.ok&&!verification.status) return res.redirect(SITE+"/my-trips.html?payment=pending&ref="+encodeURIComponent(payment.booking_ref));
  } catch(e) {
    return res.redirect(SITE+"/my-trips.html?payment=pending&ref="+encodeURIComponent(payment.booking_ref));
  }
  if(verification.pidx!==pidx||Number(verification.total_amount)!==Number(payment.amount_paisa)) {
    await db.query("UPDATE payment_transactions SET status='failed',failure_reason='Khalti reference or amount mismatch',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND status<>'succeeded'",[JSON.stringify(verification),payment.id]);
    return res.redirect(SITE+"/my-trips.html?payment=review&ref="+encodeURIComponent(payment.booking_ref));
  }
  const status=String(verification.status||"").toLowerCase();
  if(status==="completed") {
    const tx=await db.transaction([
      {sql:"UPDATE bookings SET status=CASE WHEN hold_expires_at>now() AND (SELECT count(*) FROM seat_inventory WHERE booking_id=$1 AND status='held' AND hold_expires_at>now())=cardinality(seat_numbers) THEN 'confirmed' ELSE 'payment_review' END,payment_mode='khalti',hold_expires_at=NULL WHERE id=$1 AND status IN ('awaiting_payment','expired','cancelled') RETURNING status",params:[payment.booking_id]},
      {sql:"UPDATE seat_inventory SET status='booked',hold_token=NULL,hold_expires_at=NULL WHERE booking_id=$1 AND status='held' AND EXISTS (SELECT 1 FROM bookings WHERE id=$1 AND status='confirmed')",params:[payment.booking_id]},
      {sql:"UPDATE payment_transactions SET status='succeeded',failure_reason=NULL,provider_payload=$1::jsonb,verified_at=now(),updated_at=now() WHERE id=$2 AND status<>'succeeded'",params:[JSON.stringify(verification),payment.id]}
    ]);
    const bookingState=tx.results?.[0]?.rows?.[0]?.status||"payment_review";
    return res.redirect(SITE+"/my-trips.html?payment="+(bookingState==="confirmed"?"success":"review")+"&ref="+encodeURIComponent(payment.booking_ref));
  }
  if(status==="refunded") {
    await db.transaction([
      {sql:"UPDATE payment_transactions SET status='refunded',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2",params:[JSON.stringify(verification),payment.id]},
      {sql:"UPDATE bookings SET status='payment_review' WHERE id=$1 AND status='confirmed'",params:[payment.booking_id]}
    ]);
    return res.redirect(SITE+"/my-trips.html?payment=refunded&ref="+encodeURIComponent(payment.booking_ref));
  }
  if(status==="expired"||status==="user canceled") {
    await db.query("UPDATE payment_transactions SET status=$1,failure_reason=$2,provider_payload=$3::jsonb,updated_at=now() WHERE id=$4 AND status<>'succeeded'",[status==="expired"?"failed":"cancelled",status,JSON.stringify(verification),payment.id]);
    return res.redirect(SITE+"/my-trips.html?payment=cancelled&ref="+encodeURIComponent(payment.booking_ref));
  }
  await db.query("UPDATE payment_transactions SET status='pending',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND status<>'succeeded'",[JSON.stringify(verification),payment.id]);
  return res.redirect(SITE+"/my-trips.html?payment=pending&ref="+encodeURIComponent(payment.booking_ref));
}
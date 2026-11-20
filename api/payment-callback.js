import { db, config } from "hatchable";
export const access = "public";
export const methods = ["GET"];
const BASE = "https://dev.khalti.com/api/v2";
export default async function(req,res) {
  const pidx = String(req.query.pidx || "");
  if (!pidx || pidx.length > 100) return res.status(400).json({error:"Missing or invalid payment reference."});
  const { rows } = await db.query("SELECT id,booking_id,booking_ref,amount_paisa,status FROM payment_transactions WHERE provider='khalti' AND provider_payment_id=$1 LIMIT 1",[pidx]);
  if (!rows.length) return res.status(404).json({error:"Payment reference not found."});
  const payment = rows[0];
  if (payment.status === "succeeded") return res.json({status:"succeeded",booking_ref:payment.booking_ref,message:"Payment was already verified."});
  const secret = await config.get("KHALTI_SECRET_KEY");
  if (!secret) return res.status(503).json({error:"Payment verification is temporarily unavailable. Do not retry payment; contact YATRIO support."});
  let verification;
  try {
    const response = await fetch(BASE + "/epayment/lookup/", {
      method:"POST",
      headers:{"Authorization":"Key " + secret,"Content-Type":"application/json"},
      body:JSON.stringify({pidx:pidx})
    });
    verification = await response.json();
    if (!response.ok) return res.status(502).json({error:"Khalti lookup did not complete. Booking remains unpaid."});
  } catch (e) {
    return res.status(502).json({error:"Could not verify payment with Khalti. Booking remains unpaid."});
  }
  if (verification.pidx !== pidx || Number(verification.total_amount) !== Number(payment.amount_paisa)) {
    await db.query("UPDATE payment_transactions SET status='failed',failure_reason='Khalti reference or amount mismatch',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND status <> 'succeeded'",[JSON.stringify(verification),payment.id]);
    return res.status(409).json({error:"Payment verification mismatch. Booking remains unpaid; contact support."});
  }
  const status = String(verification.status || "");
  if (status === "Completed") {
    await db.query("UPDATE payment_transactions SET status='succeeded',failure_reason=NULL,provider_payload=$1::jsonb,verified_at=now(),updated_at=now() WHERE id=$2 AND status <> 'succeeded'",[JSON.stringify(verification),payment.id]);
    await db.query("UPDATE marketplace_bookings SET payment_status='paid',updated_at=now() WHERE id=$1 AND status='provider_confirmed' AND payment_status <> 'paid'",[payment.booking_id]);
    return res.json({status:"succeeded",booking_ref:payment.booking_ref,message:"Khalti confirmed the payment. Your booking payment status has been updated."});
  }
  if (status === "Refunded" || status === "Partially Refunded") {
    await db.query("UPDATE payment_transactions SET status='refunded',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2",[JSON.stringify(verification),payment.id]);
    await db.query("UPDATE marketplace_bookings SET payment_status='refunded',updated_at=now() WHERE id=$1",[payment.booking_id]);
    return res.json({status:"refunded",booking_ref:payment.booking_ref,message:"Khalti reports this payment as refunded."});
  }
  if (status === "Expired" || status === "User canceled") {
    await db.query("UPDATE payment_transactions SET status=$1,failure_reason=$2,provider_payload=$3::jsonb,updated_at=now() WHERE id=$4 AND status <> 'succeeded'",[status === "Expired" ? "failed" : "cancelled",status,JSON.stringify(verification),payment.id]);
    return res.json({status:status === "Expired" ? "failed" : "cancelled",booking_ref:payment.booking_ref,message:"Khalti did not complete this payment. Your booking remains unpaid."});
  }
  await db.query("UPDATE payment_transactions SET status='pending',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND status <> 'succeeded'",[JSON.stringify(verification),payment.id]);
  return res.status(202).json({status:"pending",booking_ref:payment.booking_ref,message:"Khalti has not confirmed payment yet. Do not consider the booking paid."});
}
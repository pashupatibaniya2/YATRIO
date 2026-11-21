import { db, config } from "hatchable";
import { notifyBooking } from "lib/booking-notifications.js";
export const access = "user";
export const methods = ["POST"];

const STATUS_URL = "https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus";

async function hmacHex(secret,message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-512"},false,["sign"]);
  const sig = await crypto.subtle.sign("HMAC",key,enc.encode(message));
  return Array.from(new Uint8Array(sig),b=>b.toString(16).padStart(2,"0")).join("");
}

export default async function(req,res) {
  const paymentId=String(req.body?.payment_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(paymentId)) return res.status(400).json({error:"A valid payment ID is required."});
  const userId=String(req.user.id);
  const found=await db.query(
    "SELECT id,booking_id,booking_ref,user_id,provider,provider_payment_id,status,amount,amount_paisa,(SELECT status FROM bookings WHERE id=payment_transactions.booking_id) AS booking_status FROM payment_transactions WHERE id=$1 AND user_id=$2 AND booking_type='bus' AND provider='fonepay' AND mode='production' LIMIT 1",
    [paymentId,userId]
  );
  if(!found.rows.length) return res.status(404).json({error:"Fonepay payment was not found."});
  const payment=found.rows[0];
  if(payment.status==="succeeded") return res.json({status:"succeeded",booking_status:payment.booking_status,booking_ref:payment.booking_ref,verified:true});
  if(["failed","cancelled","refunded"].includes(payment.status)) return res.json({status:payment.status,booking_ref:payment.booking_ref,verified:false});
  if(!payment.provider_payment_id) return res.status(409).json({error:"Fonepay payment reference is missing."});

  const merchant=await config.get("FONEPAY_MERCHANT_CODE");
  const secret=await config.get("FONEPAY_SECRET_KEY");
  const username=await config.get("FONEPAY_USERNAME");
  const password=await config.get("FONEPAY_PASSWORD");
  if(!merchant||!secret||!username||!password) return res.status(503).json({error:"Fonepay live merchant credentials are not configured."});

  const prn=String(payment.provider_payment_id);
  const dataValidation=await hmacHex(secret,[prn,String(merchant)].join(","));
  let response,data;
  try {
    response=await fetch(STATUS_URL,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({prn,merchantCode:String(merchant),dataValidation,username:String(username),password:String(password)})});
    data=await response.json();
  } catch(e) {
    return res.status(502).json({error:"Could not reach Fonepay status verification. Payment remains pending."});
  }
  if(!response.ok||String(data.prn||"")!==prn||String(data.merchantCode||"")!==String(merchant)) {
    return res.status(502).json({error:"Fonepay returned an invalid status response. Payment remains pending."});
  }
  const providerStatus=String(data.paymentStatus||"").toLowerCase();
  if(providerStatus==="success"&&data.fonepayTraceId!==undefined&&data.fonepayTraceId!==null) {
    const verification={provider:"fonepay",payment_status:providerStatus,prn,merchant_code:String(merchant),trace_id:String(data.fonepayTraceId),verified_at:new Date().toISOString()};
    const tx=await db.transaction([
      {sql:"UPDATE bookings SET status=CASE WHEN hold_expires_at>now() AND (SELECT count(*) FROM seat_inventory WHERE booking_id=$1 AND status='held' AND hold_expires_at>now())=cardinality(seat_numbers) THEN 'confirmed' ELSE 'payment_review' END,payment_mode='fonepay',hold_expires_at=NULL WHERE id=$1 AND status='awaiting_payment' RETURNING status",params:[payment.booking_id]},
      {sql:"UPDATE seat_inventory SET status='booked',hold_token=NULL,hold_expires_at=NULL WHERE booking_id=$1 AND status='held' AND EXISTS (SELECT 1 FROM bookings WHERE id=$1 AND status='confirmed')",params:[payment.booking_id]},
      {sql:"UPDATE payment_transactions SET status='succeeded',provider_payment_id=$1,failure_reason=NULL,provider_payload=COALESCE(provider_payload,'{}'::jsonb)||$2::jsonb,verified_at=now(),updated_at=now() WHERE id=$3 AND status<>'succeeded'",params:[prn,JSON.stringify(verification),payment.id]}
    ]);
    const bookingStatus=tx.results?.[0]?.rows?.[0]?.status||"payment_review";
    try { const b=await db.query("SELECT customer_user_id,passenger_email,passenger_name,pnr,total_amount,currency,s.departure_at,b.name AS service_name FROM bookings JOIN schedules s ON s.id=bookings.schedule_id JOIN buses b ON b.id=s.bus_id WHERE bookings.id=$1",[payment.booking_id]); if(b.rows.length){const x=b.rows[0];await notifyBooking({userId:String(payment.user_id),bookingType:"bus",bookingId:payment.booking_id,bookingRef:x.pnr,eventType:bookingStatus==="confirmed"?"bus_paid":"bus_review",to:x.passenger_email,name:x.passenger_name,service:x.service_name,amount:x.total_amount,currency:x.currency,when:x.departure_at});} } catch(e) { console.error("Verified Fonepay notification could not be recorded."); }
    return res.json({status:"succeeded",booking_status:bookingStatus,booking_ref:payment.booking_ref,verified:true,trace_id:String(data.fonepayTraceId)});
  }
  if(providerStatus==="failed") {
    await db.query("UPDATE payment_transactions SET status='failed',failure_reason='Fonepay status inquiry returned failed',provider_payload=COALESCE(provider_payload,'{}'::jsonb)||$1::jsonb,updated_at=now() WHERE id=$2 AND status NOT IN ('succeeded','refunded')",[JSON.stringify({status_response:data}),payment.id]);
    return res.json({status:"failed",booking_ref:payment.booking_ref,verified:false});
  }
  await db.query("UPDATE payment_transactions SET provider_payload=COALESCE(provider_payload,'{}'::jsonb)||$1::jsonb,updated_at=now() WHERE id=$2 AND status IN ('initiated','pending')",[JSON.stringify({last_status_response:data}),payment.id]);
  return res.json({status:"pending",booking_ref:payment.booking_ref,verified:false});
}
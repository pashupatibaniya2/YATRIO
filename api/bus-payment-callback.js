import { db, config } from "hatchable";
import { notifyBooking } from "lib/booking-notifications.js";
export const access = "public";
export const methods = ["GET"];
const SITE="https://yatrio-nepal-bus.hatchable.site";
const KHALTI_URL="https://khalti.com/api/v2";
const ESEWA_STATUS="https://esewa.com.np/api/epay/transaction/status/";
const enc=new TextEncoder();
async function hmacBase64(secret,message){
  const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
function same(a,b){if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
function go(state,ref){return SITE+"/my-trips.html?payment="+encodeURIComponent(state)+"&ref="+encodeURIComponent(ref||"")}
async function finish(payment,verification,providerRef){
  const tx=await db.transaction([
    {sql:"UPDATE bookings SET status=CASE WHEN hold_expires_at>now() AND (SELECT count(*) FROM seat_inventory WHERE booking_id=$1 AND status='held' AND hold_expires_at>now())=cardinality(seat_numbers) THEN 'confirmed' ELSE 'payment_review' END,payment_mode=$2,hold_expires_at=NULL WHERE id=$1 AND status='awaiting_payment' RETURNING status",params:[payment.booking_id,payment.provider]},
    {sql:"UPDATE seat_inventory SET status='booked',hold_token=NULL,hold_expires_at=NULL WHERE booking_id=$1 AND status='held' AND EXISTS (SELECT 1 FROM bookings WHERE id=$1 AND status='confirmed')",params:[payment.booking_id]},
    {sql:"UPDATE payment_transactions SET status='succeeded',provider_payment_id=COALESCE($1,provider_payment_id),failure_reason=NULL,provider_payload=$2::jsonb,verified_at=now(),updated_at=now() WHERE id=$3 AND status<>'succeeded'",params:[providerRef||null,JSON.stringify(verification),payment.id]}
  ]);
  const finalStatus=tx.results?.[0]?.rows?.[0]?.status||"payment_review";
  try {
    const booking=await db.query("SELECT b.customer_user_id,b.passenger_email,b.passenger_name,b.pnr,b.total_amount,b.currency,s.departure_at,bus.name AS service_name FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN buses bus ON bus.id=s.bus_id WHERE b.id=$1",[payment.booking_id]);
    if(booking.rows.length){const b=booking.rows[0];await notifyBooking({userId:String(payment.user_id||b.customer_user_id||""),bookingType:"bus",bookingId:payment.booking_id,bookingRef:b.pnr,eventType:finalStatus==="confirmed"?"bus_paid":"bus_review",to:b.passenger_email,name:b.passenger_name,service:b.service_name,amount:b.total_amount,currency:b.currency,when:b.departure_at});}
  } catch(e) { console.error("Verified bus payment notification could not be recorded."); }
  return finalStatus;
}
export default async function(req,res){
  const provider=String(req.query?.provider||"khalti").toLowerCase();
  if(provider==="esewa"){
    try{
      const failedUuid=String(req.query?.transaction_uuid||"");
      if(req.query?.failed==="1"&&failedUuid){
        const failed=await db.query("UPDATE payment_transactions SET status='cancelled',failure_reason='Provider return failure',updated_at=now() WHERE booking_type='bus' AND provider='esewa' AND provider_payment_id=$1 AND status<>'succeeded' RETURNING booking_ref",[failedUuid]);
        return res.redirect(go("cancelled",failed.rows[0]?.booking_ref||""));
      }
      const encoded=String(req.query?.data||"");
      if(!encoded||encoded.length>12000) return res.redirect(go("invalid",""));
      const raw=atob(encoded.replace(/ /g,"+").replace(/-/g,"+").replace(/_/g,"/"));
      const response=JSON.parse(decodeURIComponent(Array.from(raw,c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join("")));
      const uuid=String(response.transaction_uuid||"");
      const found=await db.query("SELECT id,booking_id,booking_ref,user_id,amount,amount_paisa,purchase_order_id,status,provider FROM payment_transactions WHERE booking_type='bus' AND provider='esewa' AND provider_payment_id=$1 LIMIT 1",[uuid]);
      if(!found.rows.length) return res.redirect(go("not-found",""));
      const payment=found.rows[0];
      if(payment.status==="succeeded") return res.redirect(go("success",payment.booking_ref));
      const secret=await config.get("ESEWA_SECRET_KEY"),product=await config.get("ESEWA_PRODUCT_CODE");
      if(!secret||!product) return res.redirect(go("verify-later",payment.booking_ref));
      if(response.product_code!==product||response.status!=="COMPLETE"||!response.signed_field_names||!response.signature) return res.redirect(go("pending",payment.booking_ref));
      const names=String(response.signed_field_names).split(",");
      const required=["transaction_code","status","total_amount","transaction_uuid","product_code","signed_field_names"];
      if(required.some(name=>!names.includes(name))) return res.redirect(go("review",payment.booking_ref));
      const message=names.map(name=>name+"="+String(response[name]??"")).join(",");
      const expected=await hmacBase64(secret,message);
      if(!same(expected,String(response.signature))) {
        await db.query("UPDATE payment_transactions SET status='failed',failure_reason='eSewa response signature mismatch',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND status<>'succeeded'",[JSON.stringify({status:"signature_mismatch"}),payment.id]);
        return res.redirect(go("review",payment.booking_ref));
      }
      const query=new URLSearchParams({product_code:String(product),total_amount:String(payment.amount),transaction_uuid:uuid});
      const check=await fetch(ESEWA_STATUS+"?"+query.toString(),{method:"GET",headers:{"Accept":"application/json"}});
      const verified=await check.json();
      const verifiedAmount=Number(String(verified.total_amount??"").replace(/,/g,""));
      if(!check.ok||verified.status!=="COMPLETE"||verified.transaction_uuid!==uuid||verified.product_code!==product||Math.abs(verifiedAmount-Number(payment.amount))>0.001||!verified.ref_id){
        const state=["FULL_REFUND","PARTIAL_REFUND"].includes(verified.status)?"refunded":["CANCELED","NOT_FOUND"].includes(verified.status)?"cancelled":"pending";
        await db.query("UPDATE payment_transactions SET status=$1,failure_reason=$2,provider_payload=$3::jsonb,updated_at=now() WHERE id=$4 AND status<>'succeeded'",[state,state==="pending"?"eSewa status is not complete":"eSewa status "+verified.status,JSON.stringify(verified),payment.id]);
        return res.redirect(go(state==="cancelled"?"cancelled":state==="refunded"?"refunded":"pending",payment.booking_ref));
      }
      const state=await finish(payment,{callback:response,status_check:verified},""+verified.ref_id);
      return res.redirect(go(state==="confirmed"?"success":"review",payment.booking_ref));
    }catch(e){return res.redirect(go("pending",""))}
  }
  if(provider!=="khalti") return res.redirect(go("invalid",""));
  const pidx=String(req.query?.pidx||"");
  if(!pidx||pidx.length>100) return res.redirect(go("invalid",""));
  const found=await db.query("SELECT id,booking_id,booking_ref,user_id,amount_paisa,purchase_order_id,status,provider FROM payment_transactions WHERE booking_type='bus' AND provider='khalti' AND provider_payment_id=$1 LIMIT 1",[pidx]);
  if(!found.rows.length) return res.redirect(go("not-found",""));
  const payment=found.rows[0];
  if(payment.status==="succeeded") return res.redirect(go("success",payment.booking_ref));
  const secret=await config.get("KHALTI_LIVE_SECRET_KEY");
  if(!secret) return res.redirect(go("verify-later",payment.booking_ref));
  try{
    const response=await fetch(KHALTI_URL+"/epayment/lookup/",{method:"POST",headers:{"Authorization":"Key "+secret,"Content-Type":"application/json"},body:JSON.stringify({pidx})});
    const verification=await response.json();
    if(!response.ok||verification.pidx!==pidx||String(verification.purchase_order_id||"")!==String(payment.purchase_order_id)||Number(verification.total_amount)!==Number(payment.amount_paisa)) return res.redirect(go("review",payment.booking_ref));
    const status=String(verification.status||"").toLowerCase();
    if(status==="completed"&&verification.refunded===true){
      await db.query("UPDATE payment_transactions SET status='refunded',provider_payload=$1::jsonb,updated_at=now() WHERE id=$2 AND status<>'succeeded'",[JSON.stringify(verification),payment.id]);
      return res.redirect(go("refunded",payment.booking_ref));
    }
    if(status==="completed"&&verification.transaction_id){
      const state=await finish(payment,verification,String(verification.transaction_id));
      return res.redirect(go(state==="confirmed"?"success":"review",payment.booking_ref));
    }
    const mapped=status==="expired"?"failed":status==="user canceled"?"cancelled":"pending";
    await db.query("UPDATE payment_transactions SET status=$1,provider_payload=$2::jsonb,updated_at=now() WHERE id=$3 AND status<>'succeeded'",[mapped,JSON.stringify(verification),payment.id]);
    return res.redirect(go(mapped==="cancelled"?"cancelled":mapped==="failed"?"expired":"pending",payment.booking_ref));
  }catch(e){return res.redirect(go("pending",payment.booking_ref))}
}
import { db, config } from "hatchable";
export const access = "user";
export const methods = ["POST"];
const BASE = "https://dev.khalti.com/api/v2";
const SITE = "https://yatrio-nepal-bus.hatchable.site";

export default async function(req,res) {
  const bookingId=String(req.body?.booking_id||"");
  const provider=String(req.body?.provider||"khalti").toLowerCase();
  if(!/^[0-9a-f-]{36}$/i.test(bookingId)) return res.status(400).json({error:"A valid bus booking ID is required."});
  if(provider!=="khalti") return res.status(400).json({error:"This wallet is not enabled yet. Khalti sandbox is the first supported checkout."});
  const userId=String(req.user.id);
  const found=await db.query(
    "SELECT id,pnr,total_amount,currency,status,customer_user_id,hold_expires_at,passenger_name,passenger_email,passenger_phone FROM bookings b WHERE b.id=$1 AND b.customer_user_id=$2 AND (SELECT count(*) FROM seat_inventory si WHERE si.booking_id=b.id AND si.status='held' AND si.hold_expires_at>now())=cardinality(b.seat_numbers)",
    [bookingId,userId]
  );
  if(!found.rows.length) return res.status(404).json({error:"Bus reservation not found."});
  const booking=found.rows[0];
  if(booking.status!=="awaiting_payment") return res.status(409).json({error:"This reservation is no longer awaiting payment."});
  if(!booking.hold_expires_at || new Date(booking.hold_expires_at).getTime()<=Date.now()) return res.status(409).json({error:"The seat hold has expired. Please select your seats again."});
  const amount=Number(booking.total_amount),amountPaisa=Math.round(amount*100);
  if(!Number.isFinite(amount)||amount<10||Math.abs(amountPaisa/100-amount)>0.001) return res.status(400).json({error:"Khalti checkout requires an exact NPR amount of at least NPR 10."});
  const secret=await config.get("KHALTI_SECRET_KEY");
  if(!secret) return res.status(503).json({error:"Khalti sandbox is not configured yet. Your reservation is unpaid. Add the Khalti sandbox secret in Hatchable Setup before testing wallet checkout."});
  await db.query("UPDATE payment_transactions SET status='failed',failure_reason='Previous checkout attempt expired',updated_at=now() WHERE booking_type='bus' AND booking_id=$1 AND user_id=$2 AND status IN ('initiated','pending') AND (expires_at<=now() OR created_at<now()-interval '30 minutes')",[bookingId,userId]);
  const existing=await db.query(
    "SELECT id,checkout_url,status,expires_at FROM payment_transactions WHERE booking_type='bus' AND booking_id=$1 AND user_id=$2 AND provider='khalti' AND status IN ('initiated','pending') AND expires_at>now() ORDER BY created_at DESC LIMIT 1",
    [bookingId,userId]
  );
  if(existing.rows.length&&existing.rows[0].checkout_url) {
    const url=existing.rows[0].checkout_url;
    return res.json({payment_id:existing.rows[0].id,payment_url:url,qr_url:"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data="+encodeURIComponent(url),amount,currency:"NPR",status:existing.rows[0].status,reused:true,provider:"khalti",mode:"sandbox"});
  }
  const orderId="YTRIO-BUS-"+crypto.randomUUID().replace(/-/g,"").slice(0,18).toUpperCase();
  const inserted=await db.query(
    "INSERT INTO payment_transactions (booking_type,booking_id,booking_ref,user_id,provider,mode,amount,amount_paisa,currency,purchase_order_id,status) VALUES ('bus',$1,$2,$3,'khalti','sandbox',$4,$5,'NPR',$6,'initiated') RETURNING id",
    [booking.id,booking.pnr,userId,amount,amountPaisa,orderId]
  );
  const paymentId=inserted.rows[0].id;
  try {
    const response=await fetch(BASE+"/epayment/initiate/",{
      method:"POST",
      headers:{"Authorization":"Key "+secret,"Content-Type":"application/json"},
      body:JSON.stringify({
        return_url:SITE+"/api/bus-payment-callback",
        website_url:SITE,
        amount:amountPaisa,
        purchase_order_id:orderId,
        purchase_order_name:"YATRIO bus "+booking.pnr,
        customer_info:{name:booking.passenger_name,email:booking.passenger_email||"",phone:booking.passenger_phone}
      })
    });
    const data=await response.json();
    if(!response.ok||!data.pidx||!data.payment_url) {
      await db.query("UPDATE payment_transactions SET status='failed',failure_reason=$1,provider_payload=$2::jsonb,updated_at=now() WHERE id=$3",[String(data.detail||data.error_key||"Khalti initiation failed").slice(0,500),JSON.stringify(data),paymentId]);
      return res.status(502).json({error:"Khalti could not start checkout. No payment was confirmed. Please retry."});
    }
    const expiry=data.expires_at?new Date(data.expires_at):new Date(Date.now()+30*60*1000);
    await db.transaction([
      {sql:"UPDATE payment_transactions SET provider_payment_id=$1,checkout_url=$2,expires_at=$3,status='pending',provider_payload=$4::jsonb,updated_at=now() WHERE id=$5",params:[data.pidx,data.payment_url,expiry.toISOString(),JSON.stringify({expires_in:data.expires_in||null}),paymentId]},
      {sql:"UPDATE bookings SET payment_mode='khalti',hold_expires_at=$1 WHERE id=$2 AND customer_user_id=$3 AND status='awaiting_payment'",params:[expiry.toISOString(),bookingId,userId]},
      {sql:"UPDATE seat_inventory SET hold_expires_at=$1 WHERE booking_id=$2 AND status='held'",params:[expiry.toISOString(),bookingId]}
    ]);
    return res.status(201).json({
      payment_id:paymentId,payment_url:data.payment_url,
      qr_url:"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data="+encodeURIComponent(data.payment_url),
      amount,currency:"NPR",status:"pending",provider:"khalti",mode:"sandbox",
      expires_at:expiry.toISOString(),
      message:"Scan the QR code or open Khalti checkout. YATRIO will confirm the reservation only after server-side payment verification."
    });
  } catch(e) {
    await db.query("UPDATE payment_transactions SET status='failed',failure_reason=$1,updated_at=now() WHERE id=$2",[String(e.message||"Khalti request failed").slice(0,500),paymentId]);
    return res.status(502).json({error:"Unable to reach Khalti sandbox. No payment was confirmed."});
  }
}
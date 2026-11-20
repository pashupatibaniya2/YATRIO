import { db, config } from "hatchable";
export const access = "user";
export const methods = ["POST"];
const BASE = "https://dev.khalti.com/api/v2";
const SITE = "https://yatrio-nepal-bus.hatchable.site";
export default async function(req,res) {
  const bookingId = String(req.body.booking_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return res.status(400).json({error:"A valid marketplace booking_id is required."});
  const userId = String(req.user.id);
  const { rows } = await db.query(
    "SELECT id,booking_ref,total_amount,currency,status,payment_status,traveler_name,traveler_email,traveler_phone FROM marketplace_bookings WHERE id=$1 AND user_id=$2",
    [bookingId,userId]
  );
  if (!rows.length) return res.status(404).json({error:"Booking not found."});
  const booking = rows[0];
  if (booking.status !== "provider_confirmed") return res.status(409).json({error:"The provider must confirm this booking before payment can begin."});
  if (booking.payment_status === "paid") return res.status(409).json({error:"This booking is already marked paid."});
  const amount = Number(booking.total_amount);
  const amountPaisa = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 10 || Math.abs(amountPaisa / 100 - amount) > 0.001) return res.status(400).json({error:"Khalti checkout requires an exact NPR amount of at least NPR 10."});
  const secret = await config.get("KHALTI_SECRET_KEY");
  if (!secret) return res.status(503).json({error:"Khalti sandbox is not configured yet. Add the sandbox secret key in the YATRIO Hatchable Setup page."});
  const existing = await db.query(
    "SELECT id,provider_payment_id,checkout_url,status,expires_at FROM payment_transactions WHERE booking_type='marketplace' AND booking_id=$1 AND user_id=$2 AND status IN ('initiated','pending') AND expires_at > now() ORDER BY created_at DESC LIMIT 1",
    [bookingId,userId]
  );
  if (existing.rows.length && existing.rows[0].checkout_url) return res.json({payment_url:existing.rows[0].checkout_url,payment_id:existing.rows[0].id,status:existing.rows[0].status,reused:true});
  const orderId = "YTRIO-" + crypto.randomUUID().replace(/-/g,"").slice(0,20).toUpperCase();
  const inserted = await db.query(
    "INSERT INTO payment_transactions (booking_type,booking_id,booking_ref,user_id,provider,mode,amount,amount_paisa,currency,purchase_order_id,status) VALUES ('marketplace',$1,$2,$3,'khalti','sandbox',$4,$5,'NPR',$6,'initiated') RETURNING id",
    [booking.id,booking.booking_ref,userId,amount,amountPaisa,orderId]
  );
  const paymentId = inserted.rows[0].id;
  try {
    const response = await fetch(BASE + "/epayment/initiate/", {
      method:"POST",
      headers:{"Authorization":"Key " + secret,"Content-Type":"application/json"},
      body:JSON.stringify({
        return_url:SITE + "/api/payment-callback",
        website_url:SITE,
        amount:amountPaisa,
        purchase_order_id:orderId,
        purchase_order_name:"YATRIO " + booking.booking_ref,
        customer_info:{name:booking.traveler_name,email:booking.traveler_email || "",phone:booking.traveler_phone}
      })
    });
    const data = await response.json();
    if (!response.ok || !data.pidx || !data.payment_url) {
      await db.query("UPDATE payment_transactions SET status='failed',failure_reason=$1,provider_payload=$2::jsonb,updated_at=now() WHERE id=$3",[String(data.detail || data.error_key || "Khalti initiation failed").slice(0,500),JSON.stringify(data),paymentId]);
      return res.status(502).json({error:"Khalti could not start checkout. Please retry or contact support."});
    }
    const expiry = data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 30 * 60 * 1000);
    await db.query(
      "UPDATE payment_transactions SET provider_payment_id=$1,checkout_url=$2,expires_at=$3,status='pending',provider_payload=$4::jsonb,updated_at=now() WHERE id=$5",
      [data.pidx,data.payment_url,expiry.toISOString(),JSON.stringify({expires_in:data.expires_in || null}),paymentId]
    );
    return res.status(201).json({payment_id:paymentId,payment_url:data.payment_url,status:"pending",mode:"sandbox",message:"Continue to Khalti sandbox. YATRIO will verify the result with Khalti before updating your booking."});
  } catch (e) {
    await db.query("UPDATE payment_transactions SET status='failed',failure_reason=$1,updated_at=now() WHERE id=$2",[String(e.message || "Khalti request failed").slice(0,500),paymentId]);
    return res.status(502).json({error:"Unable to reach Khalti sandbox. No payment was confirmed."});
  }
}
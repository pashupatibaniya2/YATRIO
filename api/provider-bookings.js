import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","PATCH"];
export default async function(req,res) {
  const userId=String(req.user.id);
  if(req.method==="GET") {
    const result=await db.query("SELECT b.id,b.booking_ref,b.category_slug,b.quantity,b.traveler_name,b.traveler_email,b.traveler_phone,b.customer_note,b.currency,b.unit_price,b.total_amount,b.commission_rate,b.commission_amount,b.provider_payout_amount,b.status,b.payment_status,b.created_at,l.title,l.city,a.starts_at,a.ends_at FROM marketplace_bookings b JOIN marketplace_listings l ON l.id=b.listing_id WHERE b.provider_user_id=$1 ORDER BY b.created_at DESC LIMIT 200",[userId]);
    return res.json({bookings:result.rows});
  }
  const id=String(req.body.booking_id||"");
  const action=String(req.body.action||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["confirm","reject"].includes(action)) return res.status(400).json({error:"Provide a valid booking and choose confirm or reject."});
  const status=action==="confirm"?"provider_confirmed":"rejected";
  const result=await db.query("UPDATE marketplace_bookings SET status=$1,updated_at=now() WHERE id=$2 AND provider_user_id=$3 AND status='pending_provider_confirmation' RETURNING id,booking_ref,status,total_amount,payment_status",[status,id,userId]);
  if(!result.rows.length) return res.status(409).json({error:"Booking not found, not owned by your business, or already reviewed."});
  res.json({booking:result.rows[0],message:action==="confirm"?"Provider confirmed the request. Payment is still not collected.":"Booking request rejected and availability released."});
}
import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","PUT"];
export default async function(req,res) {
  const userId=String(req.user.id);
  if(req.method==="GET") {
    const result=await db.query(
      "SELECT booking_id AS id,booking_ref,category_slug,quantity,traveler_name,traveler_email,traveler_phone,customer_note,currency,unit_price,total_amount,commission_rate,commission_amount,provider_payout_amount,status,payment_status,created_at,listing_title AS title,city,starts_at,ends_at FROM marketplace_provider_bookings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200",
      [userId]
    );
    return res.json({bookings:result.rows});
  }
  const id=String(req.body.booking_id||"");
  const action=String(req.body.action||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["confirm","reject"].includes(action)) return res.status(400).json({error:"Provide a valid booking and choose confirm or reject."});
  try {
    await db.query(
      "INSERT INTO marketplace_provider_booking_actions (user_id,booking_id,action) VALUES ($1,$2,$3) RETURNING id",
      [userId,id,action]
    );
    const result=await db.query(
      "SELECT booking_id AS id,booking_ref,status,total_amount,payment_status FROM marketplace_provider_bookings WHERE user_id=$1 AND booking_id=$2",
      [userId,id]
    );
    if(!result.rows.length) return res.status(404).json({error:"Booking not found for this provider."});
    return res.json({booking:result.rows[0],message:action==="confirm"?"Provider confirmed the request. Payment is still not collected.":"Booking request rejected and availability released."});
  } catch(e) {
    return res.status(409).json({error:String(e.message||"Booking could not be updated.")});
  }
}
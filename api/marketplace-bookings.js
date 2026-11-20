import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST"];
export default async function(req,res) {
  const userId=String(req.user.id);
  if(req.method==="GET") {
    const result=await db.query("SELECT b.id,b.booking_ref,b.category_slug,b.quantity,b.traveler_name,b.traveler_phone,b.currency,b.unit_price,b.total_amount,b.status,b.payment_status,b.created_at,l.title,l.city,l.price_unit,p.business_name,a.starts_at,a.ends_at FROM marketplace_bookings b JOIN marketplace_listings l ON l.id=b.listing_id JOIN marketplace_providers p ON p.id=b.provider_id JOIN marketplace_availability a ON a.id=b.availability_id WHERE b.user_id=$1 ORDER BY b.created_at DESC LIMIT 100",[userId]);
    return res.json({bookings:result.rows});
  }
  const listingId=String(req.body.listing_id||"");
  const availabilityId=String(req.body.availability_id||"");
  const name=String(req.body.traveler_name||"").trim();
  const phone=String(req.body.traveler_phone||"").trim();
  const email=String(req.body.traveler_email||"").trim();
  const note=String(req.body.customer_note||"").trim().slice(0,1000);
  const quantity=Number(req.body.quantity||1);
  if(!/^[0-9a-f-]{36}$/i.test(listingId)||!/^[0-9a-f-]{36}$/i.test(availabilityId)||name.length<2||phone.length<7||!Number.isInteger(quantity)||quantity<1||quantity>20) return res.status(400).json({error:"Enter a valid service, availability slot, traveller name, phone and quantity (1–20)."});
  try {
    const result=await db.query("INSERT INTO marketplace_bookings (listing_id,availability_id,user_id,quantity,traveler_name,traveler_email,traveler_phone,customer_note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,booking_ref,category_slug,quantity,currency,unit_price,total_amount,commission_amount,provider_payout_amount,status,payment_status,created_at",[listingId,availabilityId,userId,quantity,name,email,phone,note]);
    return res.status(201).json({booking:result.rows[0],message:"Booking request sent to the provider. Payment has not been collected; this is not a paid ticket or final voucher."});
  } catch(e) {
    return res.status(409).json({error:String(e.message||"This service or availability is no longer bookable.")});
  }
}
import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 const uid=String(req.user.id);
 if(req.method==="GET"){
  const rows=await db.query("SELECT b.id AS booking_id,b.pnr,b.seat_numbers,b.status,s.departure_at,s.arrival_at,o.name AS operator_name,o.slug AS operator_slug,r.id AS review_id,r.rating AS review_rating,r.title AS review_title,r.body AS review_body,r.status AS review_status,r.created_at AS review_created_at FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN buses bus ON bus.id=s.bus_id JOIN operators o ON o.id=bus.operator_id LEFT JOIN operator_reviews r ON r.booking_id=b.id WHERE b.customer_user_id=$1 AND b.status='completed' ORDER BY s.arrival_at DESC LIMIT 100",[uid]);
  return res.json({journeys:rows.rows});
 }
 const bookingId=String(req.body?.booking_id||"");
 const rating=Number(req.body?.rating);
 const title=String(req.body?.title||"").trim().slice(0,100);
 const body=String(req.body?.body||"").trim().slice(0,1500);
 if(!/^[0-9a-f-]{36}$/i.test(bookingId)||!Number.isInteger(rating)||rating<1||rating>5||body.length<20)return res.status(400).json({error:"Select 1–5 stars and write at least 20 characters about your journey."});
 const booking=await db.query("SELECT b.id,b.operator_id FROM bookings b WHERE b.id=$1 AND b.customer_user_id=$2 AND b.status='completed' LIMIT 1",[bookingId,uid]);
 if(!booking.rows.length)return res.status(403).json({error:"Reviews are available only for your completed, operator-confirmed journeys."});
 const inserted=await db.query("INSERT INTO operator_reviews(booking_id,operator_id,user_id,rating,title,body,status) VALUES($1,$2,$3,$4,$5,$6,'pending') ON CONFLICT(booking_id) DO NOTHING RETURNING id,rating,title,body,status,created_at",[bookingId,booking.rows[0].operator_id,uid,rating,title,body]);
 if(!inserted.rows.length)return res.status(409).json({error:"A review has already been submitted for this journey."});
 return res.status(201).json({review:inserted.rows[0],message:"Thank you. Your verified journey review has been submitted for moderation."});
}
import { db } from "hatchable";
export const access="admin";
export const methods=["GET","PUT"];
export default async function(req,res){
 if(req.method==="GET"){
  const rows=await db.query("SELECT r.id,r.booking_id,r.rating,r.title,r.body,r.created_at,b.pnr,b.passenger_name,o.name AS operator_name,o.slug AS operator_slug FROM operator_reviews r JOIN bookings b ON b.id=r.booking_id JOIN operators o ON o.id=r.operator_id WHERE r.status='pending' ORDER BY r.created_at LIMIT 200");
  return res.json({reviews:rows.rows,count:rows.rows.length});
 }
 const id=String(req.body?.review_id||""),status=String(req.body?.status||""),note=String(req.body?.moderation_note||"").trim().slice(0,300);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!['published','rejected'].includes(status))return res.status(400).json({error:"Choose a valid review and moderation decision."});
 const updated=await db.query("UPDATE operator_reviews SET status=$1,moderation_note=$2,moderated_at=now() WHERE id=$3 AND status='pending' RETURNING id,status",[status,note,id]);
 if(!updated.rows.length)return res.status(404).json({error:"Pending review not found."});
 return res.json({review:updated.rows[0],message:status==='published'?"Review published on the operator profile.":"Review rejected and kept hidden."});
}
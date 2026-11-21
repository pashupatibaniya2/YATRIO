import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","PUT","DELETE"];
const safeJson=(value,fallback)=>{try{const s=JSON.stringify(value??fallback);if(s.length>50000)throw new Error("too large");return s;}catch{return null;}};
export default async function(req,res) {
 const userId=String(req.user?.id||"");
 if(!userId)return res.status(401).json({error:"Please sign in to save trips."});
 if(req.method==="GET"){
  const id=String(req.query.id||"");
  if(id){if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid trip is required."});const one=await db.query("SELECT id,title,origin,destination,trip_days,travel_style,itinerary,budget,wishlist,actual_spend,is_shared,created_at,updated_at FROM saved_trips WHERE id=$1 AND user_id=$2",[id,userId]);return one.rows.length?res.json({trip:one.rows[0]}):res.status(404).json({error:"Trip not found."});}
  const r=await db.query("SELECT id,title,origin,destination,trip_days,travel_style,is_shared,created_at,updated_at FROM saved_trips WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100",[userId]);
  return res.json({trips:r.rows});
 }
 if(req.method==="DELETE"){
  const id=String(req.query.id||req.body?.id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid trip is required."});
  const r=await db.query("DELETE FROM saved_trips WHERE id=$1 AND user_id=$2 RETURNING id",[id,userId]);
  return r.rows.length?res.json({deleted:true}):res.status(404).json({error:"Trip not found."});
 }
 const body=req.body||{};
 const title=String(body.title||"").trim().slice(0,100);
 const origin=String(body.origin||"").trim().slice(0,80);
 const destination=String(body.destination||"").trim().slice(0,100);
 const days=Math.max(2,Math.min(14,Number(body.trip_days)||3));
 const style=String(body.travel_style||"balanced").slice(0,30);
 const itinerary=safeJson(body.itinerary,[]);
 const budget=safeJson(body.budget,{});
 const wishlist=safeJson(body.wishlist,[]);
 const actual=safeJson(body.actual_spend,{});
 if(!title||!origin||!destination||!itinerary||!budget||!wishlist||!actual)return res.status(400).json({error:"Trip details are incomplete or too large."});
 if(req.method==="POST"){
  const r=await db.query("INSERT INTO saved_trips(user_id,title,origin,destination,trip_days,travel_style,itinerary,budget,wishlist,actual_spend) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb) RETURNING id,title,origin,destination,trip_days,travel_style,is_shared,created_at,updated_at",[userId,title,origin,destination,days,style,itinerary,budget,wishlist,actual]);
  return res.status(201).json({trip:r.rows[0]});
 }
 const id=String(body.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid saved trip is required."});
 await db.query("DELETE FROM shared_trip_views WHERE trip_id=$1 AND user_id=$2",[id,userId]);
 const r=await db.query("UPDATE saved_trips SET title=$3,origin=$4,destination=$5,trip_days=$6,travel_style=$7,itinerary=$8::jsonb,budget=$9::jsonb,wishlist=$10::jsonb,actual_spend=$11::jsonb,is_shared=FALSE,share_token=NULL,updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING id,title,origin,destination,trip_days,travel_style,is_shared,created_at,updated_at",[id,userId,title,origin,destination,days,style,itinerary,budget,wishlist,actual]);
 return r.rows.length?res.json({trip:r.rows[0]}):res.status(404).json({error:"Trip not found."});
}
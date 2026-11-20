import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST"];
export default async function(req,res) {
  const userId=String(req.user.id);
  if(req.method==="GET") {
    const listingId=String(req.query.listing_id||"");
    if(!/^[0-9a-f-]{36}$/i.test(listingId)) return res.status(400).json({error:"A valid listing_id is required."});
    const result=await db.query("SELECT a.id,a.listing_id,a.starts_at,a.ends_at,a.capacity,a.reserved_quantity,a.price_override,a.status,a.notes FROM marketplace_availability a JOIN marketplace_listings l ON l.id=a.listing_id WHERE a.listing_id=$1 AND l.user_id=$2 ORDER BY a.starts_at",[listingId,userId]);
    return res.json({availability:result.rows});
  }
  const listingId=String(req.body.listing_id||"");
  const starts=String(req.body.starts_at||"");
  const ends=String(req.body.ends_at||"");
  const capacity=Number(req.body.capacity);
  const priceRaw=req.body.price_override;
  const price=priceRaw==null||priceRaw===""?null:Number(priceRaw);
  const notes=String(req.body.notes||"").trim().slice(0,500);
  const startDate=new Date(starts),endDate=new Date(ends);
  if(!/^[0-9a-f-]{36}$/i.test(listingId)||!Number.isFinite(startDate.getTime())||!Number.isFinite(endDate.getTime())||endDate<=startDate||startDate<=new Date()||!Number.isInteger(capacity)||capacity<1||capacity>1000||(price!==null&&(!Number.isFinite(price)||price<=0))) return res.status(400).json({error:"Enter a future start/end time, positive capacity (max 1,000) and an optional positive price."});
  const listing=await db.query("SELECT l.id,p.status FROM marketplace_listings l JOIN marketplace_providers p ON p.id=l.provider_id WHERE l.id=$1 AND l.user_id=$2 AND p.user_id=$2 AND p.status='approved'",[listingId,userId]);
  if(!listing.rows.length) return res.status(403).json({error:"An approved provider must own this listing."});
  const result=await db.query("INSERT INTO marketplace_availability (listing_id,user_id,starts_at,ends_at,capacity,price_override,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,listing_id,starts_at,ends_at,capacity,reserved_quantity,status,price_override",[listingId,userId,startDate.toISOString(),endDate.toISOString(),capacity,price,notes]);
  res.status(201).json({slot:result.rows[0],message:"Availability slot created."});
}
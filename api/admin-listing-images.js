import { db, storage } from "hatchable";
export const access = "admin";
export const methods = ["GET","PUT"];
export default async function(req,res){
 if(req.method==="GET"){
  const rows=await db.query("SELECT i.id,i.listing_id,i.provider_id,i.user_id,i.storage_key,i.alt_text,i.content_type,i.bytes,i.review_status,i.review_note,i.created_at,l.title AS listing_title,l.city,p.business_name FROM marketplace_listing_images i JOIN marketplace_listings l ON l.id=i.listing_id JOIN marketplace_providers p ON p.id=i.provider_id WHERE i.review_status='pending' ORDER BY i.created_at ASC LIMIT 100");
  const images=await Promise.all(rows.rows.map(async x=>({...x,url:await storage.url(x.storage_key)})));
  return res.json({images,count:images.length});
 }
 const id=String(req.body?.image_id||"");
 const status=String(req.body?.review_status||"");
 const note=String(req.body?.review_note||"").trim().slice(0,300);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected"].includes(status))return res.status(400).json({error:"Choose a valid image and review decision."});
 const r=await db.query("UPDATE marketplace_listing_images SET review_status=$1,review_note=$2,reviewed_at=now() WHERE id=$3 AND review_status='pending' RETURNING id,review_status",[status,note,id]);
 if(!r.rows.length)return res.status(404).json({error:"Pending photo not found."});
 return res.json({image:r.rows[0],message:status==="approved"?"Photo approved and visible in the marketplace.":"Photo rejected and hidden from travellers."});
}
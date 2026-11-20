import { db, storage } from "hatchable";
import crypto from "node:crypto";
export const access = "user";
export const methods = ["GET","POST","DELETE"];
const MAX_BYTES=4*1024*1024;
function validImage(file){
  const b=file.buffer;
  if(!b||b.length<12||b.length>MAX_BYTES)return false;
  const jpeg=b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;
  const png=b[0]===0x89&&b.toString("ascii",1,4)==="PNG";
  const webp=b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP";
  return (jpeg&&file.contentType==="image/jpeg")||(png&&file.contentType==="image/png")||(webp&&file.contentType==="image/webp");
}
export default async function(req,res){
 const userId=String(req.user.id);
 if(req.method==="GET"){
  const listingId=String(req.query.listing_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(listingId))return res.status(400).json({error:"A valid listing id is required."});
  const owner=await db.query("SELECT l.id FROM marketplace_listings l JOIN marketplace_providers p ON p.id=l.provider_id WHERE l.id=$1 AND l.user_id=$2 AND p.user_id=$2",[listingId,userId]);
  if(!owner.rows.length)return res.status(404).json({error:"Listing not found."});
  const rows=await db.query("SELECT id,storage_key,content_type,bytes,alt_text,sort_order,review_status,review_note,created_at FROM marketplace_listing_images WHERE listing_id=$1 ORDER BY sort_order,created_at",[listingId]);
  const images=await Promise.all(rows.rows.map(async x=>({...x,url:await storage.url(x.storage_key)})));
  return res.json({images,max_images:8});
 }
 if(req.method==="POST"){
  const listingId=String(req.body?.listing_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(listingId))return res.status(400).json({error:"A valid listing id is required."});
  const owner=await db.query("SELECT l.id,l.provider_id FROM marketplace_listings l JOIN marketplace_providers p ON p.id=l.provider_id WHERE l.id=$1 AND l.user_id=$2 AND p.user_id=$2 AND p.status='approved'",[listingId,userId]);
  if(!owner.rows.length)return res.status(403).json({error:"Only approved partners can upload photos for their own listings."});
  const file=(req.files||[]).find(f=>f.field==="file");
  if(!file)return res.status(400).json({error:"Choose an image to upload."});
  if(file.buffer?.length>MAX_BYTES)return res.status(413).json({error:"Each photo must be 4 MB or smaller."});
  if(!validImage(file))return res.status(415).json({error:"Use a valid JPEG, PNG or WebP image."});
  const count=await db.query("SELECT count(*)::int AS n FROM marketplace_listing_images WHERE listing_id=$1",[listingId]);
  if(count.rows[0].n>=8)return res.status(409).json({error:"A listing can have up to 8 photos."});
  const ext=file.contentType==="image/jpeg"?"jpg":file.contentType==="image/png"?"png":"webp";
  const key="marketplace/listings/"+listingId+"/"+crypto.randomUUID()+"."+ext;
  await storage.put(key,file.buffer,file.contentType);
  try{
   const inserted=await db.query("INSERT INTO marketplace_listing_images (listing_id,provider_id,user_id,storage_key,content_type,bytes,alt_text,sort_order,review_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id,review_status,created_at",[listingId,owner.rows[0].provider_id,userId,key,file.contentType,file.buffer.length,String(req.body?.alt_text||"").trim().slice(0,180),count.rows[0].n]);
   return res.status(201).json({image:{...inserted.rows[0],url:await storage.url(key)},message:"Photo uploaded and sent for review. It will appear publicly after approval."});
  }catch(e){await storage.del(key);throw e;}
 }
 const imageId=String(req.body?.image_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(imageId))return res.status(400).json({error:"A valid image id is required."});
 const row=await db.query("DELETE FROM marketplace_listing_images i USING marketplace_listings l,marketplace_providers p WHERE i.listing_id=l.id AND l.provider_id=p.id AND i.id=$1 AND i.user_id=$2 AND l.user_id=$2 AND p.user_id=$2 RETURNING i.storage_key",[imageId,userId]);
 if(!row.rows.length)return res.status(404).json({error:"Photo not found or not owned by this partner."});
 await storage.del(row.rows[0].storage_key);
 return res.json({message:"Photo deleted."});
}
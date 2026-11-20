import { db, storage } from "hatchable";
import crypto from "node:crypto";
export const access="user";
export const methods=["GET","POST","DELETE"];
const MAX_BYTES=5*1024*1024;
const TYPES=new Set(["exterior","interior","amenities","seat_layout"]);
function validImage(file){
 const b=file.buffer,t=file.contentType;
 if(!b||b.length<12||b.length>MAX_BYTES)return false;
 return (t==="image/jpeg"&&b[0]===255&&b[1]===216&&b[2]===255)||(t==="image/png"&&b[0]===137&&b.toString("ascii",1,4)==="PNG")||(t==="image/webp"&&b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP");
}
async function busOwner(busId,uid){
 return (await db.query("SELECT b.id,b.operator_id,o.status FROM buses b JOIN operators o ON o.id=b.operator_id JOIN operator_users ou ON ou.operator_id=o.id WHERE b.id=$1 AND ou.user_id=$2 LIMIT 1",[busId,uid])).rows[0];
}
export default async function(req,res){
 const uid=String(req.user.id);
 if(req.method==="GET"){
  const busId=String(req.query.bus_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(busId))return res.status(400).json({error:"A valid bus id is required."});
  const owner=await busOwner(busId,uid);
  if(!owner)return res.status(404).json({error:"Bus not found in your operator account."});
  const rows=await db.query("SELECT id,image_type,alt_text,bytes,content_type,review_status,review_note,sort_order,created_at,storage_key FROM bus_fleet_images WHERE bus_id=$1 AND user_id=$2 ORDER BY image_type,sort_order,created_at",[busId,uid]);
  const images=await Promise.all(rows.rows.map(async x=>({...x,url:await storage.url(x.storage_key)})));
  return res.json({images,max_images:12,allowed_types:[...TYPES]});
 }
 const imageId=String(req.body?.image_id||"");
 if(req.method==="DELETE"){
  if(!/^[0-9a-f-]{36}$/i.test(imageId))return res.status(400).json({error:"A valid image id is required."});
  const deleted=await db.query("DELETE FROM bus_fleet_images i USING buses b,operator_users ou WHERE i.bus_id=b.id AND b.operator_id=ou.operator_id AND i.id=$1 AND i.user_id=$2 AND ou.user_id=$2 RETURNING i.storage_key",[imageId,uid]);
  if(!deleted.rows.length)return res.status(404).json({error:"Photo not found or not owned by your operator account."});
  await storage.del(deleted.rows[0].storage_key);
  return res.json({message:"Bus photo removed."});
 }
 const busId=String(req.body?.bus_id||""),imageType=String(req.body?.image_type||"");
 if(!/^[0-9a-f-]{36}$/i.test(busId)||!TYPES.has(imageType))return res.status(400).json({error:"Choose a bus and a valid photo category."});
 const owner=await busOwner(busId,uid);
 if(!owner)return res.status(404).json({error:"Bus not found in your operator account."});
 if(owner.status!=="approved")return res.status(403).json({error:"Only approved operators can upload fleet photos."});
 const file=(req.files||[]).find(f=>f.field==="file");
 if(!file)return res.status(400).json({error:"Choose an image to upload."});
 if(file.buffer?.length>MAX_BYTES)return res.status(413).json({error:"Each photo must be 5 MB or smaller."});
 if(!validImage(file))return res.status(415).json({error:"Use a valid JPEG, PNG or WebP image."});
 const count=await db.query("SELECT count(*)::int AS n FROM bus_fleet_images WHERE bus_id=$1",[busId]);
 if(count.rows[0].n>=12)return res.status(409).json({error:"A bus can have up to 12 photos."});
 const ext=file.contentType==="image/jpeg"?"jpg":file.contentType==="image/png"?"png":"webp";
 const key="bus-fleet/"+busId+"/"+crypto.randomUUID()+"."+ext;
 await storage.put(key,file.buffer,file.contentType);
 try{
  const saved=await db.query("INSERT INTO bus_fleet_images(bus_id,operator_id,user_id,storage_key,content_type,bytes,image_type,alt_text,sort_order,review_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING id,image_type,alt_text,bytes,review_status,created_at",[busId,owner.operator_id,uid,key,file.contentType,file.buffer.length,imageType,String(req.body?.alt_text||"").trim().slice(0,180),count.rows[0].n]);
  return res.status(201).json({image:{...saved.rows[0],url:await storage.url(key)},message:"Fleet photo uploaded and queued for YATRIO review. It will appear to travellers after approval."});
 }catch(e){await storage.del(key);throw e;}
}
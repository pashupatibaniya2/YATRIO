import { db, storage } from "hatchable";
import crypto from "node:crypto";
export const access="user";
export const methods=["GET","POST","DELETE"];
const MAX=5*1024*1024;
function valid(f){const b=f?.buffer,t=f?.contentType;if(!b||b.length<12||b.length>MAX)return false;return(t==="image/jpeg"&&b[0]===255&&b[1]===216&&b[2]===255)||(t==="image/png"&&b[0]===137&&b.toString("ascii",1,4)==="PNG")||(t==="image/webp"&&b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP");}
const clean=(v,n)=>String(v||"").trim().slice(0,n);
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in to share a journey."});
 if(req.method==="GET"){
  const rows=await db.query("SELECT id,title,destination,story,moderation_status,moderation_note,verified_journey,created_at FROM community_journeys WHERE user_id=$1 AND moderation_status IN ('pending','published','rejected') ORDER BY created_at DESC LIMIT 30",[uid]);
  return res.json({journeys:rows.rows});
 }
 const id=String(req.body?.journey_id||"");
 if(req.method==="DELETE"){
  if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid journey is required."});
  const deleted=await db.query("DELETE FROM community_journeys WHERE id=$1 AND user_id=$2 AND moderation_status IN ('pending','published','rejected') RETURNING storage_key",[id,uid]);
  if(!deleted.rows.length)return res.status(404).json({error:"Only your pending or rejected posts can be deleted here."});
  await storage.del(deleted.rows[0].storage_key);
  return res.json({message:"Journey post deleted."});
 }
 const title=clean(req.body?.title,100),destination=clean(req.body?.destination,100),story=clean(req.body?.story,1800),displayName=clean(req.body?.display_name,40)||'YATRIO traveller';
 if(title.length<3||destination.length<2||story.length<30||displayName.length<2)return res.status(400).json({error:"Add a title, destination, public display name and at least 30 characters about your journey."});
 if(/[+]?\d[\d ()-]{7,}/.test(title+' '+story+' '+displayName)||/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(title+' '+story+' '+displayName))return res.status(400).json({error:"For your privacy, do not include phone numbers or email addresses in a public journey story."});
 if(req.body?.share_consent!==true&&req.body?.share_consent!=="true")return res.status(400).json({error:"Please confirm that you own this photo or have permission to share it."});
 const file=(req.files||[]).find(f=>f.field==="file");
 if(!file)return res.status(400).json({error:"Choose one journey photo to upload."});
 if(file.buffer?.length>MAX)return res.status(413).json({error:"Photo must be 5 MB or smaller."});
 if(!valid(file))return res.status(415).json({error:"Use a valid JPEG, PNG or WebP photo."});
 const ext=file.contentType==="image/jpeg"?"jpg":file.contentType==="image/png"?"png":"webp";
 const key="community-journeys/"+uid+"/"+crypto.randomUUID()+"."+ext;
 await storage.put(key,file.buffer,file.contentType);
 try{
  const verified=await db.query("SELECT 1 FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN routes r ON r.id=s.route_id JOIN terminals a ON a.id=r.origin_terminal_id JOIN terminals z ON z.id=r.destination_terminal_id JOIN cities ca ON ca.id=a.city_id JOIN cities cz ON cz.id=z.city_id WHERE b.customer_user_id=$1 AND b.status='completed' AND (lower(ca.name)=lower($2) OR lower(cz.name)=lower($2)) LIMIT 1",[uid,destination]);
  const saved=await db.query("INSERT INTO community_journeys(user_id,display_name,title,destination,story,storage_key,content_type,image_bytes,verified_journey) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,title,destination,moderation_status,verified_journey,created_at",[uid,displayName,title,destination,story,key,file.contentType,file.buffer.length,!!verified.rows.length]);
  return res.status(201).json({journey:saved.rows[0],message:"Your journey has been submitted for review. It will appear publicly after approval."});
 }catch(e){await storage.del(key);throw e;}
}
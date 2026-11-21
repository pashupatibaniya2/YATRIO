import { db, storage } from "hatchable";
import crypto from "node:crypto";
export const access="user";
export const methods=["POST","DELETE"];
const MAX=2*1024*1024;
function valid(f){const b=f.buffer,t=f.contentType;if(!b||b.length<12||b.length>MAX)return false;return(t==="image/jpeg"&&b[0]===255&&b[1]===216&&b[2]===255)||(t==="image/png"&&b[0]===137&&b.toString("ascii",1,4)==="PNG")||(t==="image/webp"&&b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP");}
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 const old=await db.query("SELECT avatar_storage_key FROM traveller_profiles WHERE user_id=$1",[uid]);
 if(req.method==="DELETE"){
  if(old.rows[0]?.avatar_storage_key)await storage.del(old.rows[0].avatar_storage_key);
  await db.query("INSERT INTO traveller_profiles(user_id,avatar_storage_key) VALUES($1,'') ON CONFLICT(user_id) DO UPDATE SET avatar_storage_key='',updated_at=now()",[uid]);
  return res.json({message:"Profile photo removed.",avatar_url:""});
 }
 const file=(req.files||[]).find(f=>f.field==="file");
 if(!file)return res.status(400).json({error:"Choose a profile photo."});
 if(file.buffer?.length>MAX)return res.status(413).json({error:"Profile photo must be 2 MB or smaller."});
 if(!valid(file))return res.status(415).json({error:"Use a valid JPEG, PNG or WebP image."});
 const ext=file.contentType==="image/jpeg"?"jpg":file.contentType==="image/png"?"png":"webp";
 const key="traveller-avatars/"+crypto.randomUUID()+"/"+uid+"."+ext;
 await storage.put(key,file.buffer,file.contentType);
 try{
  await db.query("INSERT INTO traveller_profiles(user_id,avatar_storage_key) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET avatar_storage_key=EXCLUDED.avatar_storage_key,updated_at=now()",[uid,key]);
  if(old.rows[0]?.avatar_storage_key){try{await storage.del(old.rows[0].avatar_storage_key);}catch(cleanupError){console.warn("Previous avatar cleanup deferred.");}}
  return res.status(201).json({avatar_url:await storage.url(key),message:"Profile photo updated."});
 }catch(e){await storage.del(key);throw e;}
}
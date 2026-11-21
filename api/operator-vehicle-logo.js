import { db, storage } from "hatchable";
import crypto from "node:crypto";
export const access="user";
export const methods=["POST","DELETE"];
const MAX=1024*1024;
function valid(file){
 const b=file?.buffer,t=file?.contentType;
 if(!b||b.length<16||b.length>MAX)return false;
 if(t==="image/jpeg")return b[0]===255&&b[1]===216&&b[2]===255;
 if(t==="image/png")return b[0]===137&&b.toString("ascii",1,4)==="PNG"&&b.toString("ascii",4,8)==="\r\n\x1a\n";
 if(t==="image/webp")return b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP";
 return false;
}
async function getBus(uid,busId){
 const op=(await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0];
 if(!op) return {error:"Complete operator registration first.",status:404};
 if(op.status!=="approved")return {error:"Your operator account must be approved and active.",status:403};
 const bus=(await db.query("SELECT id,seat_layout_config FROM buses WHERE id=$1 AND operator_id=$2",[busId,op.id])).rows[0];
 if(!bus)return {error:"Bus not found in your operator account.",status:404};
 return {op,bus};
}
export default async function(req,res){
 const uid=String(req.user?.id||"");if(!uid)return res.status(401).json({error:"Please sign in."});
 const busId=String(req.body?.bus_id||req.query?.bus_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(busId))return res.status(400).json({error:"A valid bus_id is required."});
 const owned=await getBus(uid,busId);if(owned.error)return res.status(owned.status).json({error:owned.error});
 const config=owned.bus.seat_layout_config||{},vehicle=config.vehicle||{},exterior=vehicle.exterior||{};
 if(req.method==="DELETE"){
  if(exterior.logo_storage_key){try{await storage.del(exterior.logo_storage_key)}catch(e){console.warn("Old vehicle logo cleanup deferred.")}}
  const next={...config,vehicle:{...vehicle,exterior:{...exterior,logo_storage_key:null}}};
  await db.query("UPDATE buses SET seat_layout_config=$1::jsonb WHERE id=$2 AND operator_id=$3",[JSON.stringify(next),owned.op.id,busId]);
  return res.json({message:"Vehicle logo removed.",logo_url:null});
 }
 const file=(req.files||[]).find(f=>f.field==="logo"||f.field==="file");
 if(!file)return res.status(400).json({error:"Choose a logo image to upload."});
 if(file.buffer?.length>MAX)return res.status(413).json({error:"Logo must be 1 MB or smaller."});
 if(!valid(file))return res.status(415).json({error:"Use a valid JPEG, PNG or WebP logo image."});
 const ext=file.contentType==="image/jpeg"?"jpg":file.contentType==="image/png"?"png":"webp";
 const key="operator-vehicle-logos/"+crypto.randomUUID()+"/"+owned.op.id+"/"+busId+"."+ext;
 await storage.put(key,file.buffer,file.contentType);
 try{
  const logoUrl=await storage.url(key);
  const next={...config,vehicle:{...vehicle,exterior:{...exterior,logo_storage_key:key}}};
  await db.query("UPDATE buses SET seat_layout_config=$1::jsonb WHERE id=$2 AND operator_id=$3",[JSON.stringify(next),owned.op.id,busId]);
  if(exterior.logo_storage_key){try{await storage.del(exterior.logo_storage_key)}catch(e){console.warn("Previous vehicle logo cleanup deferred.")}}
  return res.status(201).json({message:"Vehicle logo uploaded.",logo_url:logoUrl});
 }catch(e){try{await storage.del(key)}catch(cleanupError){}throw e}
}
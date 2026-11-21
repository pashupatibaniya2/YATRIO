import { db, storage } from "hatchable";
export const access="admin";
export const methods=["GET","PUT"];
export default async function(req,res){
 if(req.method==="GET"){
  const rows=await db.query("SELECT i.id,i.bus_id,i.operator_id,i.storage_key,i.image_type,i.alt_text,i.content_type,i.bytes,i.created_at,b.name AS bus_name,b.registration_no,o.name AS operator_name FROM bus_fleet_images i JOIN buses b ON b.id=i.bus_id JOIN operators o ON o.id=i.operator_id WHERE i.review_status='pending' ORDER BY i.created_at LIMIT 150");
  const images=await Promise.all(rows.rows.map(async x=>({...x,url:await storage.url(x.storage_key)})));
  return res.json({images,count:images.length});
 }
 const id=String(req.body?.image_id||""),status=String(req.body?.review_status||""),note=String(req.body?.review_note||"").trim().slice(0,300);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected"].includes(status))return res.status(400).json({error:"Choose a valid image and review decision."});
 const result=await db.query("UPDATE bus_fleet_images SET review_status=$1,review_note=$2,reviewed_at=now() WHERE id=$3 AND review_status='pending' RETURNING id,operator_id,review_status",[status,note,id]);
 if(!result.rows.length)return res.status(404).json({error:"Pending bus photo not found."});
 await db.query("INSERT INTO operator_admin_audit(actor_user_id,action,target_type,target_id,operator_id,reason,details) VALUES($1,$2,'fleet_photo',$3,$4,$5,$6::jsonb)",[String(req.user?.id||"admin"),"photo_"+status,id,result.rows[0].operator_id,note,JSON.stringify({review_status:status})]);
 return res.json({image:result.rows[0],message:status==="approved"?"Bus photo approved and visible to travellers.":"Bus photo rejected and hidden from travellers."});
}
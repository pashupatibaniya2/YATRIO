import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 if(req.method==="GET"){
  const result=await db.query("SELECT id,booking_type,booking_id,booking_ref,event_type,title,message,email_status,is_read,created_at FROM booking_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",[uid]);
  return res.json({notifications:result.rows,unread_count:result.rows.filter(x=>!x.is_read).length});
 }
 const id=String(req.body?.notification_id||"");
 if(req.body?.mark_all===true){
  const result=await db.query("UPDATE booking_notifications SET is_read=true,read_at=now() WHERE user_id=$1 AND is_read=false RETURNING id",[uid]);
  return res.json({marked_read:result.rows.length});
 }
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid notification ID is required."});
 const result=await db.query("UPDATE booking_notifications SET is_read=true,read_at=now() WHERE id=$1 AND user_id=$2 RETURNING id,is_read",[id,uid]);
 if(!result.rows.length)return res.status(404).json({error:"Notification not found."});
 return res.json({notification:result.rows[0]});
}
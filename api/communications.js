import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const uuid=v=>/^[0-9a-f-]{36}$/i.test(String(v||""));
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 if(req.method==="GET"){
  const threadId=String(req.query.thread_id||"");
  if(threadId){
   if(!uuid(threadId))return res.status(400).json({error:"Invalid conversation."});
   const member=await db.query("SELECT participant_role FROM communication_threads WHERE id=$1 AND user_id=$2",[threadId,uid]);
   if(!member.rows.length)return res.status(404).json({error:"Conversation not found."});
   const messages=await db.query("SELECT id,message_group_id,sender_user_id,sender_role,body,created_at FROM communication_messages WHERE thread_id=$1 AND user_id=$2 ORDER BY created_at ASC LIMIT 200",[threadId,uid]);
   return res.json({messages:messages.rows,role:member.rows[0].participant_role,current_user_id:uid});
  }
  const rows=await db.query("SELECT t.id,t.booking_type,t.booking_id,t.booking_ref,t.updated_at,t.participant_role,(SELECT body FROM communication_messages x WHERE x.thread_id=t.id AND x.user_id=$1 ORDER BY x.created_at DESC LIMIT 1) AS last_message,(SELECT created_at FROM communication_messages x WHERE x.thread_id=t.id AND x.user_id=$1 ORDER BY x.created_at DESC LIMIT 1) AS last_message_at FROM communication_threads t WHERE t.user_id=$1 ORDER BY t.updated_at DESC LIMIT 100",[uid]);
  return res.json({threads:rows.rows});
 }
 const action=String(req.body?.action||"");
 if(action==="open_booking"){
  const type=String(req.body.booking_type||""),bookingId=String(req.body.booking_id||"");
  if(!["bus","marketplace"].includes(type)||!uuid(bookingId))return res.status(400).json({error:"Choose a valid booking."});
  let ref="",participants=[];
  if(type==="bus"){
   const q=await db.query("SELECT id,pnr,customer_user_id,operator_id FROM bookings WHERE id=$1",[bookingId]);
   if(!q.rows.length)return res.status(404).json({error:"Booking not found."});
   const b=q.rows[0],op=await db.query("SELECT user_id FROM operator_users WHERE operator_id=$1",[b.operator_id]);
   const isTraveller=String(b.customer_user_id||"")===uid,isOperator=op.rows.some(x=>String(x.user_id)===uid);
   if(!isTraveller&&!isOperator)return res.status(403).json({error:"You are not a participant in this booking."});
   participants=[...(b.customer_user_id?[{id:String(b.customer_user_id),role:"traveller"}]:[]),...op.rows.map(x=>({id:String(x.user_id),role:"operator"}))];ref=b.pnr;
  }else{
   const q=await db.query("SELECT id,booking_ref,user_id,provider_user_id FROM marketplace_bookings WHERE id=$1",[bookingId]);
   if(!q.rows.length)return res.status(404).json({error:"Booking not found."});
   const b=q.rows[0];if(String(b.user_id)!==uid&&String(b.provider_user_id||"")!==uid)return res.status(403).json({error:"You are not a participant in this booking."});
   participants=[{id:String(b.user_id),role:"traveller"},...(b.provider_user_id?[{id:String(b.provider_user_id),role:"operator"}]:[])];ref=b.booking_ref;
  }
  participants=[...new Map(participants.filter(x=>x.id).map(x=>[x.id,x])).values()];
  if(!participants.some(x=>x.id===uid))return res.status(403).json({error:"You are not a participant in this booking."});
  if(participants.length<2)return res.status(409).json({error:"The provider has not linked an operator account yet. You can still contact YATRIO support."});
  const created=await db.query("SELECT open_communication_thread($1,$2,$3,$4::jsonb) AS thread_id",[type,bookingId,ref,JSON.stringify(participants)]);
  return res.json({thread_id:created.rows[0].thread_id,booking_ref:ref,message:"Secure booking conversation is ready."});
 }
 if(action==="send"){
  const threadId=String(req.body.thread_id||""),body=String(req.body.body||"").trim();
  if(!uuid(threadId)||body.length<1||body.length>2000)return res.status(400).json({error:"Write a message of 1–2,000 characters."});
  try{
   const sent=await db.query("SELECT send_communication_message($1,$2) AS message_id",[threadId,body]);
   return res.status(201).json({message_id:sent.rows[0].message_id,message:"Message sent."});
  }catch(e){return res.status(404).json({error:"Conversation not found or message could not be delivered to its participants."});}
 }
 return res.status(400).json({error:"Unknown communication action."});
}
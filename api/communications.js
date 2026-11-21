import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const uuid=v=>/^[0-9a-f-]{36}$/i.test(String(v||""));
const parseRoles=v=>Array.isArray(v)?v:(typeof v==="string"?JSON.parse(v||"[]"):[]);
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 if(req.method==="GET"){
  const threadId=String(req.query.thread_id||"");
  if(threadId){
   if(!uuid(threadId))return res.status(400).json({error:"Invalid conversation."});
   const member=await db.query("SELECT participant_roles FROM communication_threads WHERE id=$1 AND $2=ANY(participant_user_ids)",[threadId,uid]);
   if(!member.rows.length)return res.status(404).json({error:"Conversation not found."});
   const roles=parseRoles(member.rows[0].participant_roles),mine=roles.find(x=>String(x.id)===uid);
   const messages=await db.query("SELECT id,message_group_id,sender_user_id,sender_role,body,created_at FROM communication_messages WHERE thread_id=$1 ORDER BY created_at ASC LIMIT 200",[threadId]);
   return res.json({messages:messages.rows,role:mine?.role||"participant",current_user_id:uid});
  }
  const rows=await db.query("SELECT t.id,t.booking_type,t.booking_id,t.booking_ref,t.updated_at,(SELECT body FROM communication_messages x WHERE x.thread_id=t.id ORDER BY x.created_at DESC LIMIT 1) AS last_message,(SELECT created_at FROM communication_messages x WHERE x.thread_id=t.id ORDER BY x.created_at DESC LIMIT 1) AS last_message_at FROM communication_threads t WHERE $1=ANY(t.participant_user_ids) ORDER BY t.updated_at DESC LIMIT 100",[uid]);
  return res.json({threads:rows.rows});
 }
 const action=String(req.body?.action||"");
 if(action==="open_booking"){
  const type=String(req.body.booking_type||""),bookingId=String(req.body.booking_id||"");
  if(!["bus","marketplace"].includes(type)||!uuid(bookingId))return res.status(400).json({error:"Choose a valid booking."});
  let ref="",travellerId="",operatorIds=[];
  if(type==="bus"){
   const q=await db.query("SELECT b.id,b.pnr,b.customer_user_id,b.operator_id,o.owner_user_id FROM bookings b LEFT JOIN operators o ON o.id=b.operator_id WHERE b.id=$1",[bookingId]);
   if(!q.rows.length)return res.status(404).json({error:"Booking not found."});
   const b=q.rows[0],isTraveller=String(b.customer_user_id||"")===uid;
   const opMembership=await db.query("SELECT user_id FROM operator_users WHERE operator_id=$1 AND user_id=$2",[b.operator_id,uid]);
   const isOperator=String(b.owner_user_id||"")===uid||opMembership.rows.length>0;
   if(!isTraveller&&!isOperator)return res.status(403).json({error:"You are not a participant in this booking."});
   travellerId=String(b.customer_user_id||"");ref=b.pnr;
   if(b.owner_user_id)operatorIds.push(String(b.owner_user_id));
   if(isOperator)operatorIds.push(uid);
  }else{
   const q=await db.query("SELECT id,booking_ref,user_id,provider_user_id FROM marketplace_bookings WHERE id=$1",[bookingId]);
   if(!q.rows.length)return res.status(404).json({error:"Booking not found."});
   const b=q.rows[0],isTraveller=String(b.user_id)===uid,isOperator=String(b.provider_user_id||"")===uid;
   if(!isTraveller&&!isOperator)return res.status(403).json({error:"You are not a participant in this booking."});
   travellerId=String(b.user_id);if(b.provider_user_id)operatorIds.push(String(b.provider_user_id));ref=b.booking_ref;
  }
  const participants=[{id:travellerId,role:"traveller"},...operatorIds.map(id=>({id,role:"operator"}))].filter(x=>x.id);
  const unique=[...new Map(participants.map(x=>[x.id,x])).values()];
  if(!unique.some(x=>x.id===uid))return res.status(403).json({error:"You are not a participant in this booking."});
  if(unique.length<2)return res.status(409).json({error:"The provider has not linked an operator account yet. You can still contact YATRIO support."});
  const ids=unique.map(x=>x.id),roles=JSON.stringify(unique);
  const created=await db.query("INSERT INTO communication_threads(booking_type,booking_id,booking_ref,created_by,user_id,participant_user_ids,participant_roles) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) ON CONFLICT(booking_type,booking_id) DO UPDATE SET booking_ref=EXCLUDED.booking_ref,participant_user_ids=EXCLUDED.participant_user_ids,participant_roles=EXCLUDED.participant_roles,updated_at=now() RETURNING id",[type,bookingId,ref,uid,travellerId,ids,roles]);
  return res.json({thread_id:created.rows[0].id,booking_ref:ref,message:"Secure booking conversation is ready."});
 }
 if(action==="send"){
  const threadId=String(req.body.thread_id||""),body=String(req.body.body||"").trim();
  if(!uuid(threadId)||body.length<1||body.length>2000)return res.status(400).json({error:"Write a message of 1–2,000 characters."});
  const thread=await db.query("SELECT participant_roles FROM communication_threads WHERE id=$1 AND $2=ANY(participant_user_ids)",[threadId,uid]);
  if(!thread.rows.length)return res.status(404).json({error:"Conversation not found."});
  const roles=parseRoles(thread.rows[0].participant_roles),mine=roles.find(x=>String(x.id)===uid);
  const messageGroupId=crypto.randomUUID();
  const message=await db.query("INSERT INTO communication_messages(message_group_id,thread_id,user_id,sender_user_id,sender_role,body) VALUES($1,$2,$3,$3,$4,$5) RETURNING id",[messageGroupId,threadId,uid,mine?.role||"participant",body]);
  await db.query("UPDATE communication_threads SET updated_at=now() WHERE id=$1",[threadId]);
  return res.status(201).json({message_id:message.rows[0].id,message:"Message sent."});
 }
 return res.status(400).json({error:"Unknown communication action."});
}
import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const uuid=v=>/^[0-9a-f-]{36}$/i.test(String(v||""));
export default async function(req,res){
 const uid=String(req.user?.id||"");if(!uid)return res.status(401).json({error:"Please sign in."});
 if(req.method==="GET"){
  const id=String(req.query.ticket_id||"");
  if(id){if(!uuid(id))return res.status(400).json({error:"Invalid ticket."});const q=await db.query("SELECT id,user_id,subject,category,priority,status,booking_type,booking_id,created_at,updated_at FROM support_tickets WHERE id=$1 AND user_id=$2",[id,uid]);if(!q.rows.length)return res.status(404).json({error:"Ticket not found."});const m=await db.query("SELECT id,sender_user_id,sender_role,body,created_at FROM support_ticket_messages WHERE ticket_id=$1 AND user_id=$2 ORDER BY created_at ASC LIMIT 200",[id,uid]);return res.json({ticket:q.rows[0],messages:m.rows});}
  const q=await db.query("SELECT id,subject,category,priority,status,booking_type,booking_id,created_at,updated_at FROM support_tickets WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100",[uid]);return res.json({tickets:q.rows});
 }
 const action=String(req.body?.action||""),body=String(req.body?.body||"").trim();
 if(action==="create"){
  const subject=String(req.body.subject||"").trim().slice(0,140),category=String(req.body.category||"general");
  const type=req.body.booking_type?String(req.body.booking_type):null,id=req.body.booking_id?String(req.body.booking_id):null;
  if(subject.length<4||body.length<5||body.length>3000)return res.status(400).json({error:"Enter a subject and message (5–3,000 characters)."});
  if(type&&!["bus","marketplace"].includes(type))return res.status(400).json({error:"Invalid booking type."});
  if(id&&!uuid(id))return res.status(400).json({error:"Invalid booking reference."});
  if(type&&id){const q=type==="bus"?await db.query("SELECT id FROM bookings WHERE id=$1 AND customer_user_id=$2",[id,uid]):await db.query("SELECT id FROM marketplace_bookings WHERE id=$1 AND user_id=$2",[id,uid]);if(!q.rows.length)return res.status(404).json({error:"That booking is not in your account."});}
  const t=await db.query("INSERT INTO support_tickets(user_id,subject,category,booking_type,booking_id) VALUES($1,$2,$3,$4,$5) RETURNING id,subject,status,created_at",[uid,subject,category,type,id]);
  await db.query("INSERT INTO support_ticket_messages(ticket_id,user_id,sender_user_id,sender_role,body) VALUES($1,$2,$2,'traveller',$3)",[t.rows[0].id,uid,body]);
  return res.status(201).json({ticket:t.rows[0],message:"Support request created."});
 }
 if(action==="reply"){
  const id=String(req.body.ticket_id||"");if(!uuid(id)||body.length<1||body.length>3000)return res.status(400).json({error:"Write a message of 1–3,000 characters."});
  const t=await db.query("SELECT id,status FROM support_tickets WHERE id=$1 AND user_id=$2",[id,uid]);if(!t.rows.length)return res.status(404).json({error:"Ticket not found."});if(t.rows[0].status==="resolved")return res.status(409).json({error:"This ticket is resolved. Create a new ticket if you need more help."});
  await db.query("INSERT INTO support_ticket_messages(ticket_id,user_id,sender_user_id,sender_role,body) VALUES($1,$2,$2,'traveller',$3)",[id,uid,body]);await db.query("UPDATE support_tickets SET updated_at=now() WHERE id=$1",[id]);return res.status(201).json({message:"Reply added."});
 }
 return res.status(400).json({error:"Unknown support action."});
}
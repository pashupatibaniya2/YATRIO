import { db, email } from "hatchable";
export const access="admin";
export const methods=["GET","POST"];
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export default async function(req,res){
 if(req.method==="GET"){
  const ticketId=String(req.query.ticket_id||"");
  if(ticketId){
   const t=await db.query("SELECT id,user_id,subject,category,priority,status,booking_type,booking_id,assigned_admin,created_at,updated_at FROM support_tickets WHERE id=$1",[ticketId]);
   if(!t.rows.length)return res.status(404).json({error:"Support ticket not found."});
   const m=await db.query("SELECT id,sender_user_id,sender_role,body,created_at FROM support_ticket_messages WHERE ticket_id=$1 ORDER BY created_at ASC LIMIT 300",[ticketId]);
   return res.json({ticket:t.rows[0],messages:m.rows});
  }
  const [tickets,emails]=await Promise.all([
   db.query("SELECT t.id,t.user_id,t.subject,t.category,t.priority,t.status,t.booking_type,t.booking_id,t.created_at,t.updated_at,(SELECT body FROM support_ticket_messages m WHERE m.ticket_id=t.id ORDER BY m.created_at DESC LIMIT 1) AS latest_message,(SELECT sender_role FROM support_ticket_messages m WHERE m.ticket_id=t.id ORDER BY m.created_at DESC LIMIT 1) AS latest_sender FROM support_tickets t ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,t.updated_at DESC LIMIT 150"),
   db.query("SELECT id,booking_ref,event_type,title,recipient_email,email_status,email_error,retry_count,last_retry_at,created_at FROM booking_notifications WHERE email_status='failed' ORDER BY created_at DESC LIMIT 100")
  ]);
  return res.json({tickets:tickets.rows,failed_emails:emails.rows});
 }
 const action=String(req.body?.action||"");
 if(action==="reply_ticket"){
  const id=String(req.body.ticket_id||""),body=String(req.body.body||"").trim();
  if(!/^[0-9a-f-]{36}$/i.test(id)||body.length<1||body.length>3000)return res.status(400).json({error:"Write a reply of 1–3,000 characters."});
  const t=await db.query("SELECT id,user_id,status FROM support_tickets WHERE id=$1",[id]);
  if(!t.rows.length)return res.status(404).json({error:"Support ticket not found."});
  await db.query("INSERT INTO support_ticket_messages(ticket_id,user_id,sender_user_id,sender_role,body) VALUES($1,$2,$3,'admin',$4)",[id,String(t.rows[0].user_id),String(req.user?.id||"admin"),body]);
  await db.query("UPDATE support_tickets SET status=CASE WHEN status='resolved' THEN 'resolved' ELSE 'in_progress' END,assigned_admin=$2,updated_at=now() WHERE id=$1",[id,String(req.user?.id||"admin")]);
  return res.status(201).json({message:"Reply sent to the ticket."});
 }
 if(action==="set_ticket_status"){
  const id=String(req.body.ticket_id||""),status=String(req.body.status||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["open","in_progress","resolved"].includes(status))return res.status(400).json({error:"Choose a valid ticket status."});
  const q=await db.query("UPDATE support_tickets SET status=$2,updated_at=now(),resolved_at=CASE WHEN $2='resolved' THEN now() ELSE NULL END,assigned_admin=$3 WHERE id=$1 RETURNING id,status",[id,status,String(req.user?.id||"admin")]);
  if(!q.rows.length)return res.status(404).json({error:"Support ticket not found."});
  return res.json({ticket:q.rows[0]});
 }
 if(action==="retry_email"){
  const id=String(req.body.notification_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Invalid notification."});
  const claim=await db.query("UPDATE booking_notifications SET retry_count=retry_count+1,last_retry_at=now() WHERE id=$1 AND email_status='failed' AND retry_count<3 AND (last_retry_at IS NULL OR last_retry_at<now()-interval '10 minutes') AND recipient_email<>'' RETURNING id,booking_ref,title,message,recipient_email",[id]);
  if(!claim.rows.length)return res.status(409).json({error:"Email is not retryable, has reached the three-attempt limit, or was retried in the last 10 minutes."});
  const n=claim.rows[0];
  try{
   const html='<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#183247"><h2>'+esc(n.title)+'</h2><p>'+esc(n.message)+'</p><p>Booking reference: <strong>'+esc(n.booking_ref)+'</strong></p><p><a href="https://yatrio-nepal-bus.hatchable.site/traveller-documents.html">View travel documents</a></p><small>YATRIO · One platform. Every journey.</small></div>';
   const result=await email.send({to:n.recipient_email,subject:"YATRIO update · "+n.booking_ref,html,text:n.title+"\n"+n.message+"\nBooking reference: "+n.booking_ref+"\nhttps://yatrio-nepal-bus.hatchable.site/traveller-documents.html"});
   if(!result?.success)throw new Error("Email provider did not confirm delivery acceptance.");
   await db.query("UPDATE booking_notifications SET email_status='sent',email_error=NULL,email_message_id=$1 WHERE id=$2",[String(result.message_id||result.ses_message_id||"").slice(0,500),id]);
   return res.json({message:"Email accepted by the provider."});
  }catch(e){
   await db.query("UPDATE booking_notifications SET email_status='failed',email_error=$1 WHERE id=$2",[String(e?.message||"Email delivery failed").slice(0,500),id]);
   return res.status(502).json({error:"Email retry failed. The in-app notification remains available.",detail:String(e?.message||"").slice(0,180)});
  }
 }
 return res.status(400).json({error:"Unknown admin communications action."});
}
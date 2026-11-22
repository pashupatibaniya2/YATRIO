import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
function quote(hours,rules,amount){
 const rule=rules.find(x=>hours>=Number(x.min_hours) && (x.max_hours===null || hours<Number(x.max_hours)));
 if(!rule) return null;
 const fee=Math.round((amount*Number(rule.fee_percent)/100)*100)/100;
 const refund=Math.round((amount-fee)*100)/100;
 return {label:rule.label,hours_before_departure:Math.round(hours*100)/100,fee_percent:Number(rule.fee_percent),fee_amount:fee,refund_percent:Number(rule.refund_percent),estimated_refund:refund};
}
export default async function(req,res){
 const userId=String(req.user.id);
 if(req.method==="GET"){
  const bookingId=String(req.query?.booking_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(bookingId)) return res.status(400).json({error:"A valid booking_id is required."});
  const r=await db.query("SELECT b.id,b.pnr,b.total_amount,b.currency,b.status,s.departure_at,p.amount AS paid_amount FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN payment_transactions p ON p.booking_type='bus' AND p.booking_id=b.id AND p.status='succeeded' WHERE b.id=$1 AND b.customer_user_id=$2 ORDER BY p.verified_at DESC LIMIT 1",[bookingId,userId]);
  if(!r.rows.length) return res.status(404).json({error:"Paid booking not found for this account."});
  const b=r.rows[0]; if(b.status!=="confirmed") return res.status(409).json({error:"Only confirmed, paid bus bookings can request cancellation."});
  const rules=await db.query("SELECT rules FROM yatrio_cancellation_policy WHERE id=1");
  const hours=(new Date(b.departure_at).getTime()-Date.now())/3600000;
  if(hours<=0) return res.status(409).json({error:"Departure has started or passed. Please contact support."});
  const amount=Number(b.paid_amount);
  const q=quote(hours,rules.rows[0].rules,amount);
  if(!q) return res.status(409).json({error:"No cancellation rule applies to this departure."});
  const existing=await db.query("SELECT id,status,estimated_refund,fee_percent,refund_percent FROM bus_cancellation_requests WHERE booking_id=$1 AND status IN ('pending_review','approved','processing') LIMIT 1",[bookingId]);
  return res.json({booking:{id:b.id,pnr:b.pnr,departure_at:b.departure_at,currency:b.currency,paid_amount:amount},quote:q,existing_request:existing.rows[0]||null,policy:rules.rows[0].rules});
 }
 const bookingId=String(req.body?.booking_id||"");
 const reason=String(req.body?.reason||"").trim().slice(0,1000);
 if(!/^[0-9a-f-]{36}$/i.test(bookingId)) return res.status(400).json({error:"A valid booking_id is required."});
 if(reason.length<5) return res.status(400).json({error:"Please provide a cancellation reason (at least 5 characters)."});
 const r=await db.query("SELECT b.id,b.pnr,b.total_amount,b.currency,b.status,s.departure_at,p.amount AS paid_amount FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN payment_transactions p ON p.booking_type='bus' AND p.booking_id=b.id AND p.status='succeeded' WHERE b.id=$1 AND b.customer_user_id=$2 ORDER BY p.verified_at DESC LIMIT 1",[bookingId,userId]);
 if(!r.rows.length) return res.status(404).json({error:"Paid booking not found for this account."});
 const b=r.rows[0]; if(b.status!=="confirmed") return res.status(409).json({error:"Only confirmed, paid bus bookings can request cancellation."});
 const hours=(new Date(b.departure_at).getTime()-Date.now())/3600000;
 if(hours<=0) return res.status(409).json({error:"Departure has started or passed. Please contact support."});
 const rules=await db.query("SELECT rules FROM yatrio_cancellation_policy WHERE id=1");
 const amount=Number(b.paid_amount),q=quote(hours,rules.rows[0].rules,amount);
 if(!q) return res.status(409).json({error:"No cancellation rule applies."});
 try{
  const created=await db.query("INSERT INTO bus_cancellation_requests(booking_id,user_id,booking_ref,departure_at,hours_before_departure,paid_amount,fee_percent,fee_amount,refund_percent,estimated_refund,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,status,fee_percent,fee_amount,refund_percent,estimated_refund,created_at",[bookingId,userId,b.pnr,b.departure_at,q.hours_before_departure,amount,q.fee_percent,q.fee_amount,q.refund_percent,q.estimated_refund,reason]);
  return res.status(201).json({request:created.rows[0],message:"Cancellation request submitted for review. This is an estimate, not a completed refund. Your booking remains confirmed until the request is reviewed and any refund is recorded."});
 }catch(e){
  if(e.code==="23505") return res.status(409).json({error:"An active cancellation request already exists for this booking."});
  throw e;
 }
}
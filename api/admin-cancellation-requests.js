import { db } from "hatchable";
export const access="admin";
export const methods=["GET","POST"];
export default async function(req,res){
 if(req.method==="GET"){
  const r=await db.query("SELECT id,booking_ref,departure_at,hours_before_departure,paid_amount,fee_percent,fee_amount,refund_percent,estimated_refund,reason,status,admin_note,provider_refund_reference,actual_refund_amount,created_at,updated_at FROM bus_cancellation_requests ORDER BY created_at DESC LIMIT 100");
  return res.json({requests:r.rows,policy:(await db.query("SELECT rules,updated_at FROM yatrio_cancellation_policy WHERE id=1")).rows[0]});
 }
 const id=String(req.body?.request_id||""),status=String(req.body?.status||"");
 const note=String(req.body?.admin_note||"").trim().slice(0,1000);
 const ref=String(req.body?.provider_refund_reference||"").trim().slice(0,200);
 const actual=req.body?.actual_refund_amount==null?null:Number(req.body.actual_refund_amount);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected","processing","refund_recorded"].includes(status)) return res.status(400).json({error:"Valid request_id and status are required."});
 const prior=await db.query("SELECT * FROM bus_cancellation_requests WHERE id=$1",[id]);
 if(!prior.rows.length) return res.status(404).json({error:"Cancellation request not found."});
 const p=prior.rows[0];
 const allowed={pending_review:["approved","rejected"],approved:["processing","rejected"],processing:["refund_recorded","rejected"]};
 if(!(allowed[p.status]||[]).includes(status)) return res.status(409).json({error:"That status transition is not allowed. Review must move pending to approved or rejected, then processing, then refund recorded."});
 if(status==="refund_recorded"&&(!ref||actual===null||!Number.isFinite(actual)||actual<0||actual>Number(p.paid_amount))) return res.status(400).json({error:"A provider refund reference and valid actual refund amount (not above the paid amount) are required to record a refund."});
 if(status==="refund_recorded"&&actual>Number(p.estimated_refund)+0.01) return res.status(409).json({error:"Actual refund cannot exceed the policy estimate without a separately documented admin exception."});
 const r=await db.query("UPDATE bus_cancellation_requests SET status=$2,admin_note=$3,provider_refund_reference=$4,actual_refund_amount=$5,reviewed_by=$6,reviewed_at=now(),updated_at=now() WHERE id=$1 RETURNING id,status,booking_ref,estimated_refund,actual_refund_amount,provider_refund_reference,updated_at",[id,status,note,ref,actual,String(req.member?.id||req.user?.id||"admin")]);
 if(status==="refund_recorded"){
  await db.query("UPDATE bookings SET status='cancelled' WHERE id=$1 AND status='confirmed'",[p.booking_id]);
  await db.query("UPDATE seat_inventory SET status='available',hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE booking_id=$1 AND status IN ('booked','confirmed')",[p.booking_id]);
 }
 return res.json({request:r.rows[0],message:status==="refund_recorded"?"Refund recorded with provider reference. This action records evidence; it does not initiate a wallet transfer.":"Cancellation request status updated."});
}
import { db } from "hatchable";
export const access="admin";
export const methods=["GET","POST"];
export default async function(req,res){
 if(req.method==="GET"){
  const r=await db.query("SELECT id,booking_ref,departure_at,hours_before_departure,paid_amount,fee_percent,fee_amount,refund_percent,estimated_refund,reason,status,admin_note,provider_refund_reference,actual_refund_amount,created_at,updated_at FROM bus_cancellation_requests ORDER BY created_at DESC LIMIT 100");
  const policy=(await db.query("SELECT rules,updated_at FROM yatrio_cancellation_policy WHERE id=1")).rows[0];
  const audit=await db.query("SELECT actor_id,old_rules,new_rules,changed_at FROM yatrio_cancellation_policy_audit ORDER BY changed_at DESC LIMIT 10");
  return res.json({requests:r.rows,policy,audit:audit.rows});
 }
 if(req.body?.action==="update_policy"){
  const input=req.body?.tiers;
  if(!Array.isArray(input)||input.length!==6) return res.status(400).json({error:"Exactly six cancellation tiers are required."});
  const tiers=input.map(x=>({min_hours:Number(x.min_hours),fee_percent:Number(x.fee_percent)}));
  if(tiers.some(x=>!Number.isFinite(x.min_hours)||!Number.isFinite(x.fee_percent)||x.min_hours<0||x.min_hours>8760||x.fee_percent<0||x.fee_percent>100)) return res.status(400).json({error:"Thresholds must be 0–8760 hours and fees 0–100%."});
  if(tiers[tiers.length-1].min_hours!==0||tiers.some((x,i)=>i>0&&tiers[i-1].min_hours<=x.min_hours)) return res.status(400).json({error:"Thresholds must be strictly descending and the final tier must start at 0 hours."});
  const labels=tiers.map((x,i)=>i===0?x.min_hours+" hours or more":(x.min_hours+" to under "+tiers[i-1].min_hours+" hours"));
  const rules=tiers.map((x,i)=>({min_hours:x.min_hours,max_hours:i===0?null:tiers[i-1].min_hours,fee_percent:x.fee_percent,refund_percent:100-x.fee_percent,label:labels[i]}));
  const updated=await db.query("WITH old AS (SELECT rules FROM yatrio_cancellation_policy WHERE id=1), upd AS (UPDATE yatrio_cancellation_policy SET rules=$1::jsonb,updated_at=now() WHERE id=1 RETURNING rules,updated_at), audit AS (INSERT INTO yatrio_cancellation_policy_audit(actor_id,old_rules,new_rules) SELECT $2,old.rules,upd.rules FROM old,upd RETURNING id) SELECT upd.rules,upd.updated_at FROM upd",[JSON.stringify(rules),String(req.member?.id||req.user?.id||"admin")]);
  return res.json({policy:updated.rows[0],message:"Cancellation policy updated. New quotes use these rules; existing requests retain their original estimates."});
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
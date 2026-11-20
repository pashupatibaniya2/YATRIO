import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST"];
async function owner(uid){return (await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0]}
export default async function(req,res){
 const op=await owner(String(req.user.id));
 if(!op)return res.status(404).json({error:"Operator account not found."});
 if(op.status!=="approved")return res.status(403).json({error:"Only active, approved operators can manage seat inventory."});
 const scheduleId=String(req.query?.schedule_id||req.body?.schedule_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(scheduleId))return res.status(400).json({error:"A valid schedule_id is required."});
 const own=(await db.query("SELECT s.id FROM schedules s JOIN buses b ON b.id=s.bus_id WHERE s.id=$1 AND b.operator_id=$2",[scheduleId,op.id])).rows[0];
 if(!own)return res.status(404).json({error:"Schedule not found in your operator account."});
 await db.query("UPDATE bookings SET status='expired' WHERE status='awaiting_payment' AND id IN (SELECT booking_id FROM seat_inventory WHERE schedule_id=$1 AND status='held' AND hold_expires_at<=now() AND booking_id IS NOT NULL)",[scheduleId]);
 await db.query("UPDATE seat_inventory SET status='available',hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE schedule_id=$1 AND status='held' AND hold_expires_at<=now()",[scheduleId]);
 if(req.method==="GET"){
  const rows=await db.query("SELECT si.id AS inventory_id,bs.id AS seat_id,bs.seat_number,bs.seat_type,CASE WHEN si.status='held' AND si.hold_expires_at<=now() THEN 'available' ELSE si.status END AS status FROM seat_inventory si JOIN bus_seats bs ON bs.id=si.seat_id WHERE si.schedule_id=$1 ORDER BY bs.seat_number",[scheduleId]);
  return res.json({schedule_id:scheduleId,seats:rows.rows});
 }
 const inventoryId=String(req.body?.inventory_id||""),action=String(req.body?.action||"");
 if(!/^[0-9a-f-]{36}$/i.test(inventoryId)||!["block","unblock"].includes(action))return res.status(400).json({error:"Provide a seat and choose block or unblock."});
 const from=action==="block"?"available":"blocked",to=action==="block"?"blocked":"available";
 const updated=await db.query("UPDATE seat_inventory SET status=$1,hold_token=NULL,hold_expires_at=NULL,booking_id=NULL WHERE id=$2 AND schedule_id=$3 AND status=$4 RETURNING id,status",[to,inventoryId,scheduleId,from]);
 if(!updated.rows.length)return res.status(409).json({error:"Only available seats can be blocked, and only blocked seats can be reopened. Held or booked seats are protected."});
 return res.json({seat:updated.rows[0],message:"Seat "+(action==="block"?"blocked from sale.":"made available for booking.")});
}
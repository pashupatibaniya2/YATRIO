import { db } from "hatchable";
export const access="user";
export const methods=["GET"];
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 const scheduleId=String(req.query?.schedule_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(scheduleId))return res.status(400).json({error:"Choose a valid scheduled trip."});
 const op=await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 AND ou.role IN ('owner','admin') AND o.status='approved' ORDER BY o.created_at DESC LIMIT 1",[uid]);
 if(!op.rows.length)return res.status(404).json({error:"Approved operator account not found."});
 const rows=await db.query("SELECT p.booking_id,b.pnr AS booking_ref,b.seat_numbers,s.departure_at,s.arrival_at,p.latitude,p.longitude,p.accuracy_m,p.recorded_at,p.expires_at FROM passenger_trip_locations p JOIN bookings b ON b.id=p.booking_id JOIN schedules s ON s.id=p.schedule_id JOIN buses bus ON bus.id=s.bus_id WHERE p.schedule_id=$1 AND p.operator_id=$2 AND bus.operator_id=$2 AND b.schedule_id=s.id AND b.status IN ('confirmed','paid') AND p.revoked_at IS NULL AND p.expires_at>now() AND p.recorded_at>now()-interval '2 minutes' ORDER BY p.recorded_at DESC LIMIT 100",[scheduleId,op.rows[0].id]);
 return res.json({locations:rows.rows,message:rows.rows.length?"Showing current pickup locations shared by passengers.":"No passengers are currently sharing a pickup location for this trip."});
}
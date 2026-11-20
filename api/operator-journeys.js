import { db } from "hatchable";
export const access="user";
export const methods=["GET","PUT"];
async function getOperator(uid){
 const q=await db.query("SELECT o.id,o.name FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 AND ou.role IN ('owner','admin') AND o.status='approved' ORDER BY o.created_at DESC LIMIT 1",[uid]);
 return q.rows[0];
}
export default async function(req,res){
 const op=await getOperator(String(req.user.id));
 if(!op)return res.status(404).json({error:"Approved operator account not found."});
 if(req.method==="GET"){
  const rows=await db.query("SELECT b.id AS booking_id,b.pnr,b.passenger_name,b.seat_numbers,b.status,s.departure_at,s.arrival_at,b.total_amount FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN buses bus ON bus.id=s.bus_id WHERE bus.operator_id=$1 AND b.status IN ('confirmed','paid') AND s.arrival_at<=now() ORDER BY s.arrival_at DESC LIMIT 100",[op.id]);
  return res.json({journeys:rows.rows,operator:op});
 }
 const bookingId=String(req.body?.booking_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(bookingId))return res.status(400).json({error:"A valid booking is required."});
 const updated=await db.query("UPDATE bookings b SET status='completed' FROM schedules s,buses bus WHERE b.id=$1 AND b.schedule_id=s.id AND s.bus_id=bus.id AND bus.operator_id=$2 AND b.status IN ('confirmed','paid') AND s.arrival_at<=now() RETURNING b.id,b.pnr,b.status",[bookingId,op.id]);
 if(!updated.rows.length)return res.status(409).json({error:"Only a paid or confirmed booking can be marked complete, and only after its scheduled arrival."});
 return res.json({booking:updated.rows[0],message:"Journey marked completed. The passenger can now submit a verified review."});
}
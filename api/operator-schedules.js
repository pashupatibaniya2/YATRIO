import { db } from "hatchable";
export const access = "user";
export const methods = ["GET","POST","PUT"];
async function owner(uid){return (await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid])).rows[0]}
export default async function(req,res) {
 const op=await owner(String(req.user.id));
 if(!op)return res.status(404).json({error:"Operator account not found."});
 if(op.status!=="approved")return res.status(403).json({error:"Your operator account must be approved and active to manage schedules."});
 if(req.method==="GET"){
  const rows=await db.query("SELECT s.id,s.bus_id,s.route_id,s.departure_at,s.arrival_at,s.fare,s.status,b.name AS bus_name,ca.name AS origin,cz.name AS destination,(SELECT count(*) FROM seat_inventory si WHERE si.schedule_id=s.id AND si.status='booked') AS booked_seats,(SELECT count(*) FROM seat_inventory si WHERE si.schedule_id=s.id AND (si.status='available' OR (si.status='held' AND si.hold_expires_at<now()))) AS available_seats,(SELECT count(*) FROM seat_inventory si WHERE si.schedule_id=s.id AND si.status='blocked') AS blocked_seats FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN routes r ON r.id=s.route_id JOIN terminals ta ON ta.id=r.origin_terminal_id JOIN terminals tz ON tz.id=r.destination_terminal_id JOIN cities ca ON ca.id=ta.city_id JOIN cities cz ON cz.id=tz.city_id WHERE b.operator_id=$1 ORDER BY s.departure_at DESC LIMIT 100",[op.id]);
  return res.json({schedules:rows.rows});
 }
 const busId=String(req.body?.bus_id||""),routeId=String(req.body?.route_id||"");
 const departure=new Date(req.body?.departure_at),arrival=new Date(req.body?.arrival_at),fare=Number(req.body?.fare);
 if(req.method==="POST"){
  if(!/^[0-9a-f-]{36}$/i.test(busId)||!/^[0-9a-f-]{36}$/i.test(routeId)||!Number.isFinite(departure.getTime())||!Number.isFinite(arrival.getTime())||arrival<=departure||departure<=new Date()||!Number.isFinite(fare)||fare<=0)return res.status(400).json({error:"Provide a bus, route, future departure and arrival, and a positive fare."});
  const bus=await db.query("SELECT id FROM buses WHERE id=$1 AND operator_id=$2 AND status='active'",[busId,op.id]);
  if(!bus.rows.length)return res.status(404).json({error:"Active bus not found in your operator account."});
  const route=await db.query("SELECT id FROM routes WHERE id=$1",[routeId]);
  if(!route.rows.length)return res.status(404).json({error:"Route not found."});
  const scheduleId=crypto.randomUUID();
  const created=await db.transaction([
   {sql:"SELECT id FROM buses WHERE id=$1 AND operator_id=$2 AND status='active' FOR UPDATE",params:[busId,op.id]},
   {sql:"SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM buses WHERE id=$1 AND operator_id=$2 AND status='active') THEN 1/0 ELSE 1 END",params:[busId,op.id]},
   {sql:"INSERT INTO schedules (id,bus_id,route_id,departure_at,arrival_at,fare) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,departure_at,arrival_at,fare,status",params:[scheduleId,busId,routeId,departure.toISOString(),arrival.toISOString(),fare]},
   {sql:"INSERT INTO seat_inventory (schedule_id,seat_id) SELECT $1,id FROM bus_seats WHERE bus_id=$2",params:[scheduleId,busId]},
   {sql:"SELECT CASE WHEN (SELECT count(*) FROM seat_inventory WHERE schedule_id=$1) <> (SELECT capacity FROM buses WHERE id=$2) THEN 1/0 ELSE 1 END",params:[scheduleId,busId]}
  ]);
  return res.status(201).json({schedule:created.results[2].rows[0],message:"Schedule published with live seat inventory."});
 }
 const id=String(req.body?.schedule_id||""),status=String(req.body?.status||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid schedule_id is required."});
 const existing=(await db.query("SELECT s.id,s.bus_id,s.status,s.departure_at FROM schedules s JOIN buses b ON b.id=s.bus_id WHERE s.id=$1 AND b.operator_id=$2",[id,op.id])).rows[0];
 if(!existing)return res.status(404).json({error:"Schedule not found in your operator account."});
 if(status==="scheduled"||status==="cancelled"){
  if(status==="scheduled"&&existing.status==="cancelled"&&new Date(existing.departure_at)<=new Date())return res.status(400).json({error:"A cancelled departure can only be restored if it is still in the future."});
  const changed=await db.query("UPDATE schedules SET status=$1 WHERE id=$2 RETURNING id,status",[status,id]);
  return res.json({schedule:changed.rows[0],message:"Schedule "+status+"."});
 }
 if(!Number.isFinite(departure.getTime())||!Number.isFinite(arrival.getTime())||arrival<=departure||departure<=new Date()||!Number.isFinite(fare)||fare<=0)return res.status(400).json({error:"Provide a future departure, later arrival and positive fare."});
 const booked=await db.query("SELECT count(*) AS n FROM seat_inventory WHERE schedule_id=$1 AND status IN ('held','booked') AND (status='booked' OR hold_expires_at>now())",[id]);
 if(Number(booked.rows[0]?.n)>0)return res.status(409).json({error:"This departure has held or booked seats. Cancel it or contact YATRIO support instead of changing its route or timing."});
 const changed=await db.query("UPDATE schedules SET departure_at=$1,arrival_at=$2,fare=$3 WHERE id=$4 AND NOT EXISTS (SELECT 1 FROM seat_inventory si WHERE si.schedule_id=$4 AND (si.status='booked' OR (si.status='held' AND si.hold_expires_at>now()))) RETURNING id,departure_at,arrival_at,fare,status",[departure.toISOString(),arrival.toISOString(),fare,id]);
 if(!changed.rows.length)return res.status(409).json({error:"This departure has held or booked seats. Cancel it or contact YATRIO support instead of changing its route or timing."});
 return res.json({schedule:changed.rows[0],message:"Schedule details updated."});
}
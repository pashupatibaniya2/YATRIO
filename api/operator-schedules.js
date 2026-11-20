import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
 const uid=String(req.user.id),busId=String(req.body.bus_id||""),routeId=String(req.body.route_id||"");
 const departure=new Date(req.body.departure_at),arrival=new Date(req.body.arrival_at),fare=Number(req.body.fare);
 if(!/^[0-9a-f-]{36}$/i.test(busId)||!/^[0-9a-f-]{36}$/i.test(routeId)||!Number.isFinite(departure.getTime())||!Number.isFinite(arrival.getTime())||arrival<=departure||departure<=new Date()||!Number.isFinite(fare)||fare<=0)return res.status(400).json({error:"Provide a bus, route, future departure and arrival, and a positive fare."});
 const owner=await db.query("SELECT o.id,o.status FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 LIMIT 1",[uid]);
 if(!owner.rows.length)return res.status(404).json({error:"Operator account not found."});
 if(owner.rows[0].status!=="approved")return res.status(403).json({error:"Your operator account must be approved before publishing schedules."});
 const bus=await db.query("SELECT id FROM buses WHERE id=$1 AND operator_id=$2 AND status='active'",[busId,owner.rows[0].id]);
 if(!bus.rows.length)return res.status(404).json({error:"Bus not found in your operator account."});
 const route=await db.query("SELECT id FROM routes WHERE id=$1",[routeId]);
 if(!route.rows.length)return res.status(404).json({error:"Route not found."});
 const created=await db.query("INSERT INTO schedules (bus_id,route_id,departure_at,arrival_at,fare) VALUES ($1,$2,$3,$4,$5) RETURNING id,departure_at,arrival_at,fare,status",[busId,routeId,departure.toISOString(),arrival.toISOString(),fare]);
 await db.query("INSERT INTO seat_inventory (schedule_id,seat_id) SELECT $1,id FROM bus_seats WHERE bus_id=$2",[created.rows[0].id,busId]);
 res.status(201).json({schedule:created.rows[0],message:"Schedule published to your operator inventory."});
}
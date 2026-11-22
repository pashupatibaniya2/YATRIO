import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 if(req.method==="GET"){
  const rows=await db.query("SELECT s.id AS schedule_id,s.departure_at,s.arrival_at,b.name AS bus_name,b.registration_no,r1.name AS origin,r2.name AS destination,o.id AS operator_id,o.name AS operator_name FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id JOIN routes r ON r.id=s.route_id LEFT JOIN terminals r1 ON r1.id=r.origin_terminal_id LEFT JOIN terminals r2 ON r2.id=r.destination_terminal_id WHERE (o.owner_user_id=$1 OR EXISTS(SELECT 1 FROM operator_users ou WHERE ou.operator_id=o.id AND ou.user_id=$1)) AND s.status='scheduled' AND s.departure_at>now()-interval '12 hours' AND s.departure_at<now()+interval '36 hours' ORDER BY s.departure_at LIMIT 100",[uid]);
  return res.json({schedules:rows.rows});
 }
 const scheduleId=String(req.body?.schedule_id||""),lat=Number(req.body?.latitude),lng=Number(req.body?.longitude),accuracy=req.body?.accuracy_m==null?null:Number(req.body.accuracy_m);
 if(!/^[0-9a-f-]{36}$/i.test(scheduleId)||!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lng)||lng < -180||lng>180||accuracy!==null&&(!Number.isFinite(accuracy)||accuracy<0||accuracy>10000))return res.status(400).json({error:"Provide a valid trip and GPS coordinates."});
 const allowed=await db.query("SELECT o.id FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id WHERE s.id=$1 AND (o.owner_user_id=$2 OR EXISTS(SELECT 1 FROM operator_users ou WHERE ou.operator_id=o.id AND ou.user_id=$2)) AND s.status='scheduled' AND s.departure_at>now()-interval '12 hours' AND s.departure_at<now()+interval '36 hours'",[scheduleId,uid]);
 if(!allowed.rows.length)return res.status(403).json({error:"This trip is not assigned to your operator account."});
 const operatorId=allowed.rows[0].id;
 await db.query("INSERT INTO bus_live_locations(schedule_id,operator_id,user_id,latitude,longitude,accuracy_m,recorded_by,updated_at) VALUES($1,$2,$6,$3,$4,$5,$6,now()) ON CONFLICT(schedule_id) DO UPDATE SET operator_id=EXCLUDED.operator_id,user_id=EXCLUDED.user_id,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,accuracy_m=EXCLUDED.accuracy_m,recorded_by=EXCLUDED.recorded_by,updated_at=now()",[scheduleId,operatorId,lat,lng,accuracy,uid]);
 return res.json({ok:true,message:"Trip location updated. Passengers with a valid trip link can now see the latest shared position.",updated_at:new Date().toISOString()});
}
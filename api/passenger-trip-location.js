import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST","DELETE"];
export default async function(req,res){
 const uid=String(req.user?.id||"");
 if(!uid)return res.status(401).json({error:"Please sign in."});
 if(req.method==="GET"){
  const q=await db.query("SELECT b.id AS booking_id,b.pnr AS booking_ref,b.status,s.departure_at,s.arrival_at,r1.name AS origin,r2.name AS destination,ptl.recorded_at,ptl.expires_at,ptl.revoked_at FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN buses bus ON bus.id=s.bus_id JOIN routes r ON r.id=s.route_id LEFT JOIN terminals r1 ON r1.id=r.origin_terminal_id LEFT JOIN terminals r2 ON r2.id=r.destination_terminal_id LEFT JOIN passenger_trip_locations ptl ON ptl.booking_id=b.id AND ptl.user_id=$1 WHERE b.customer_user_id=$1 AND b.status IN ('confirmed','paid') AND s.departure_at>now()-interval '30 minutes' AND s.departure_at<now()+interval '12 hours' ORDER BY s.departure_at LIMIT 50",[uid]);
  return res.json({bookings:q.rows});
 }
 const bookingId=String(req.body?.booking_id||req.query?.booking_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(bookingId))return res.status(400).json({error:"Choose a valid bus booking."});
 if(req.method==="DELETE"){
  const q=await db.query("DELETE FROM passenger_trip_locations WHERE booking_id=$1 AND user_id=$2 RETURNING booking_id",[bookingId,uid]);
  return res.json({ok:true,revoked:q.rows.length>0,message:q.rows.length?"Pickup location sharing stopped and the saved coordinates were deleted.":"No active location share was found."});
 }
 if(req.body?.consent!==true)return res.status(400).json({error:"Explicit consent is required before sharing your location."});
 const lat=Number(req.body?.latitude),lng=Number(req.body?.longitude),accuracy=req.body?.accuracy_m==null?null:Number(req.body.accuracy_m);
 if(!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lng)||lng < -180||lng>180||accuracy!==null&&(!Number.isFinite(accuracy)||accuracy<0||accuracy>10000))return res.status(400).json({error:"Provide valid GPS coordinates and accuracy."});
 const eligible=await db.query("SELECT b.id,s.id AS schedule_id,bus.operator_id,s.departure_at FROM bookings b JOIN schedules s ON s.id=b.schedule_id JOIN buses bus ON bus.id=s.bus_id JOIN operators o ON o.id=bus.operator_id WHERE b.id=$1 AND b.customer_user_id=$2 AND b.status IN ('confirmed','paid') AND s.status='scheduled' AND s.departure_at>now()-interval '30 minutes' AND s.departure_at<now()+interval '12 hours' AND o.status='approved' LIMIT 1",[bookingId,uid]);
 if(!eligible.rows.length)return res.status(403).json({error:"Only your paid or confirmed bus booking for an upcoming trip can share pickup location."});
 const x=eligible.rows[0];
 const saved=await db.query("INSERT INTO passenger_trip_locations(booking_id,schedule_id,operator_id,user_id,latitude,longitude,accuracy_m,recorded_at,expires_at,revoked_at) VALUES($1,$2,$3,$4,$5,$6,$7,now(),$8+interval '30 minutes',NULL) ON CONFLICT(booking_id) DO UPDATE SET schedule_id=EXCLUDED.schedule_id,operator_id=EXCLUDED.operator_id,user_id=EXCLUDED.user_id,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,accuracy_m=EXCLUDED.accuracy_m,recorded_at=now(),expires_at=EXCLUDED.expires_at,revoked_at=NULL RETURNING recorded_at,expires_at",[bookingId,x.schedule_id,x.operator_id,uid,lat,lng,accuracy,x.departure_at]);
 return res.json({ok:true,recorded_at:saved.rows[0].recorded_at,expires_at:saved.rows[0].expires_at,message:"Pickup location shared with the operator for this booking only."});
}
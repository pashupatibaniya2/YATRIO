import { db } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const token=String(req.query?.token||"");
 if(!/^[a-f0-9]{64}$/i.test(token))return res.status(404).json({error:"This trip-sharing link is invalid or expired."});
 const result=await db.query("SELECT bl.booking_ref,bl.status AS booking_status,bl.total_amount,bl.currency,s.departure_at,s.arrival_at,b.name AS bus_name,b.registration_no,b.bus_type,o.name AS operator_name,o.phone AS operator_phone,r1.name AS origin,r2.name AS destination,loc.latitude,loc.longitude,loc.accuracy_m,loc.updated_at AS location_updated_at,l.expires_at FROM bus_trip_share_links l JOIN bookings bl ON bl.id=l.booking_id JOIN schedules s ON s.id=l.schedule_id JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id JOIN routes r ON r.id=s.route_id LEFT JOIN terminals r1 ON r1.id=r.origin_terminal_id LEFT JOIN terminals r2 ON r2.id=r.destination_terminal_id LEFT JOIN bus_live_locations loc ON loc.schedule_id=s.id WHERE l.token=$1 AND l.expires_at>now() LIMIT 1",[token]);
 if(!result.rows.length)return res.status(404).json({error:"This trip-sharing link is invalid or has expired."});
 const x=result.rows[0];
 return res.json({trip:{booking_ref:x.booking_ref,booking_status:x.booking_status,departure_at:x.departure_at,arrival_at:x.arrival_at,origin:x.origin,destination:x.destination,bus_name:x.bus_name,registration_no:x.registration_no,bus_type:x.bus_type,operator_name:x.operator_name,operator_phone:x.operator_phone,live_location:x.latitude==null?null:{latitude:Number(x.latitude),longitude:Number(x.longitude),accuracy_m:x.accuracy_m==null?null:Number(x.accuracy_m),updated_at:x.location_updated_at},expires_at:x.expires_at},message:x.latitude==null?"The operator has not shared a live location yet.":"Showing the latest location shared by the operator."});
}
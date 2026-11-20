import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
export default async function(req,res) {
  const uid=String(req.user.id);
  const found=await db.query("SELECT o.id,o.name,o.slug,o.status,o.phone,o.commission_rate FROM operators o JOIN operator_users ou ON ou.operator_id=o.id WHERE ou.user_id=$1 ORDER BY o.created_at DESC LIMIT 1",[uid]);
  if(!found.rows.length)return res.json({has_operator:false});
  const op=found.rows[0];
  const documents=(await db.query("SELECT id,document_type,original_filename,bytes,review_status,review_note,created_at,updated_at FROM operator_documents WHERE operator_id=$1 ORDER BY document_type",[op.id])).rows;
  const buses=await db.query("SELECT id,name,registration_no,bus_type,capacity,status FROM buses WHERE operator_id=$1 ORDER BY name",[op.id]);
  const schedules=await db.query("SELECT s.id,s.departure_at,s.arrival_at,s.fare,s.status,b.name AS bus_name,ca.name AS origin,cz.name AS destination,(SELECT count(*) FROM seat_inventory si WHERE si.schedule_id=s.id AND si.status='booked') AS booked_seats,(SELECT count(*) FROM seat_inventory si WHERE si.schedule_id=s.id AND (si.status='available' OR (si.status='held' AND si.hold_expires_at<now()))) AS available_seats FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN routes r ON r.id=s.route_id JOIN terminals ta ON ta.id=r.origin_terminal_id JOIN terminals tz ON tz.id=r.destination_terminal_id JOIN cities ca ON ca.id=ta.city_id JOIN cities cz ON cz.id=tz.city_id WHERE b.operator_id=$1 ORDER BY s.departure_at DESC LIMIT 30",[op.id]);
  const bookings=await db.query("SELECT bk.pnr,bk.passenger_name,bk.passenger_phone,bk.seat_numbers,bk.total_amount,bk.commission_rate,bk.commission_amount,bk.provider_payout_amount,bk.status,bk.created_at,s.departure_at,b.name AS bus_name FROM bookings bk JOIN schedules s ON s.id=bk.schedule_id JOIN buses b ON b.id=s.bus_id WHERE b.operator_id=$1 ORDER BY bk.created_at DESC LIMIT 30",[op.id]);
  res.json({has_operator:true,operator:op,documents,buses:buses.rows,schedules:schedules.rows,bookings:bookings.rows});
}
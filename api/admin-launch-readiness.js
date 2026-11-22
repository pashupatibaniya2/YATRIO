import { db } from "hatchable";
export const access="admin";
export const methods=["GET"];
export default async function(req,res){
 const [summary,operators]=await Promise.all([
  db.query(`SELECT
   (SELECT count(*)::int FROM operators) AS operators_total,
   (SELECT count(*)::int FROM operators WHERE status='approved') AS operators_approved,
   (SELECT count(*)::int FROM operator_documents WHERE review_status='pending') AS pending_documents,
   (SELECT count(*)::int FROM buses) AS buses_total,
   (SELECT count(*)::int FROM buses WHERE status='active') AS active_buses,
   (SELECT count(*)::int FROM bus_fleet_images WHERE review_status='pending') AS pending_photos,
   (SELECT count(*)::int FROM bus_fleet_images WHERE review_status='approved') AS approved_photos,
   (SELECT count(*)::int FROM schedules WHERE status='scheduled' AND departure_at>now()) AS future_departures,
   (SELECT count(*)::int FROM bookings) AS bookings_total,
   (SELECT count(*)::int FROM payment_transactions WHERE status='succeeded') AS successful_payments`),
  db.query(`SELECT o.id,o.name,o.phone,o.status,o.created_at,
   (SELECT count(*)::int FROM operator_documents d WHERE d.operator_id=o.id) AS documents_total,
   (SELECT count(*)::int FROM operator_documents d WHERE d.operator_id=o.id AND d.review_status='approved') AS documents_approved,
   (SELECT count(*)::int FROM operator_documents d WHERE d.operator_id=o.id AND d.review_status='pending') AS documents_pending,
   (SELECT count(*)::int FROM operator_documents d WHERE d.operator_id=o.id AND d.review_status='rejected') AS documents_rejected,
   (SELECT count(*)::int FROM buses b WHERE b.operator_id=o.id) AS buses_total,
   (SELECT count(*)::int FROM buses b WHERE b.operator_id=o.id AND b.status='active') AS buses_active,
   (SELECT count(*)::int FROM bus_fleet_images i WHERE i.operator_id=o.id) AS photos_total,
   (SELECT count(*)::int FROM bus_fleet_images i WHERE i.operator_id=o.id AND i.review_status='approved') AS photos_approved,
   (SELECT count(*)::int FROM bus_fleet_images i WHERE i.operator_id=o.id AND i.review_status='pending') AS photos_pending,
   (SELECT count(*)::int FROM schedules s JOIN buses b ON b.id=s.bus_id WHERE b.operator_id=o.id AND s.status='scheduled' AND s.departure_at>now()) AS future_departures,
   (SELECT count(*)::int FROM schedules s JOIN buses b ON b.id=s.bus_id WHERE b.operator_id=o.id AND s.status='scheduled' AND s.departure_at>now() AND EXISTS(SELECT 1 FROM schedule_driver_assignments a WHERE a.schedule_id=s.id)) AS departures_with_driver,
   (SELECT count(*)::int FROM bookings bk JOIN schedules s ON s.id=bk.schedule_id JOIN buses b ON b.id=s.bus_id WHERE b.operator_id=o.id) AS bookings_total,
   (SELECT count(*)::int FROM payment_transactions pt JOIN bookings bk ON pt.booking_id=bk.id WHERE pt.booking_type='bus' AND pt.status='succeeded' AND bk.operator_id=o.id) AS successful_payments
   FROM operators o ORDER BY o.created_at DESC`)
 ]);
 return res.json({generated_at:new Date().toISOString(),summary:summary.rows[0],operators:operators.rows,notes:{approval:"Operators require all four approved documents.",photos:"Fleet photos are hidden from travellers until approved.",publishing:"Only active buses and future scheduled departures can be discoverable.",payments:"Payment readiness is not established by bookings alone; provider credentials and successful live callbacks must be verified."}});
}
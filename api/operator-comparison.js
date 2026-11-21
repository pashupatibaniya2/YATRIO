import { db } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const {rows}=await db.query(`
 SELECT o.id,o.name,o.slug,o.description,o.status,
  (SELECT count(*)::int FROM operator_documents d WHERE d.operator_id=o.id) AS document_count,
  (SELECT count(*)::int FROM operator_documents d WHERE d.operator_id=o.id AND d.review_status='approved') AS approved_document_count,
  (SELECT count(*)::int FROM buses b WHERE b.operator_id=o.id AND b.status='active') AS active_buses,
  (SELECT count(DISTINCT s.route_id)::int FROM schedules s JOIN buses b ON b.id=s.bus_id WHERE b.operator_id=o.id AND b.status='active' AND s.status='scheduled' AND s.departure_at>now()) AS active_routes,
  (SELECT count(*)::int FROM schedules s JOIN buses b ON b.id=s.bus_id WHERE b.operator_id=o.id AND b.status='active' AND s.status='scheduled' AND s.departure_at>now()) AS upcoming_departures,
  -- intentionally no synthetic rating or service-history fields
  (SELECT count(*)::int FROM bookings bk JOIN schedules s ON s.id=bk.schedule_id JOIN buses b ON b.id=s.bus_id WHERE b.operator_id=o.id AND bk.status='completed') AS completed_journeys,
  (SELECT count(*)::int FROM bus_fleet_images im JOIN buses b ON b.id=im.bus_id WHERE b.operator_id=o.id AND im.review_status='approved') AS approved_fleet_photos,
  (SELECT round(avg(r.rating)::numeric,1) FROM operator_reviews r WHERE r.operator_id=o.id AND r.status='published') AS average_rating,
  (SELECT count(*)::int FROM operator_reviews r WHERE r.operator_id=o.id AND r.status='published') AS review_count,
  (SELECT COALESCE(array_agg(DISTINCT a ORDER BY a),ARRAY[]::text[]) FROM buses b CROSS JOIN LATERAL unnest(COALESCE(b.amenities,ARRAY[]::text[])) a WHERE b.operator_id=o.id AND b.status='active') AS amenities
 FROM operators o WHERE o.status='approved' ORDER BY o.name LIMIT 100`);
 const operators=rows.map(o=>({...o,verified:Number(o.document_count)===4&&Number(o.approved_document_count)===4,document_verification_status:Number(o.document_count)===4&&Number(o.approved_document_count)===4?"verified":Number(o.approved_document_count)>0?"partially_verified":"not_verified",average_rating:o.average_rating===null?null:Number(o.average_rating),amenities:o.amenities||[]}));
 res.json({operators,count:operators.length,demo_data:true,notice:"Operator records, fleet listings, and service activity may include demonstration data. Ratings include published reviews from completed journeys only. Document verification reflects documents reviewed by YATRIO; it is not a guarantee of service quality."});
}
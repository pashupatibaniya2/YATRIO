import { db, storage } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
  const slug=String(req.query.slug||"").trim().toLowerCase();
  if(!/^[a-z0-9-]{2,60}$/.test(slug))return res.status(400).json({error:"A valid operator profile link is required."});
  const found=await db.query("SELECT o.id,o.name,o.slug,o.description,o.phone,o.status,o.created_at,(SELECT count(*) FROM operator_documents d WHERE d.operator_id=o.id AND d.review_status='approved') AS approved_documents,(SELECT count(*) FROM operator_documents d WHERE d.operator_id=o.id) AS total_documents FROM operators o WHERE o.slug=$1 AND o.status='approved' LIMIT 1",[slug]);
  if(!found.rows.length)return res.status(404).json({error:"This operator profile is not currently available."});
  const operator=found.rows[0];
  const buses=await db.query("SELECT b.id,b.name,b.bus_type,b.capacity,b.amenities,(SELECT count(*) FROM schedules s WHERE s.bus_id=b.id AND s.status='scheduled' AND s.departure_at>now()) AS upcoming_departures FROM buses b WHERE b.operator_id=$1 AND b.status='active' ORDER BY b.name",[operator.id]);
  const ids=buses.rows.map(x=>x.id);
  const images=ids.length?await db.query("SELECT id,bus_id,image_type,alt_text,storage_key,sort_order FROM bus_fleet_images WHERE bus_id=ANY($1::uuid[]) AND review_status='approved' ORDER BY sort_order,created_at",[ids]):{rows:[]};
  const grouped={};
  for(const item of images.rows){if(!grouped[item.bus_id])grouped[item.bus_id]=[];grouped[item.bus_id].push({id:item.id,type:item.image_type,alt_text:item.alt_text,url:await storage.url(item.storage_key)});}
  const routes=await db.query("SELECT DISTINCT ca.name AS origin,cz.name AS destination FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN routes r ON r.id=s.route_id JOIN terminals ta ON ta.id=r.origin_terminal_id JOIN terminals tz ON tz.id=r.destination_terminal_id JOIN cities ca ON ca.id=ta.city_id JOIN cities cz ON cz.id=tz.city_id WHERE b.operator_id=$1 AND b.status='active' AND s.status='scheduled' AND s.departure_at>now() ORDER BY ca.name,cz.name",[operator.id]);
  return res.json({operator:{name:operator.name,slug:operator.slug,description:operator.description,phone:operator.phone,verified:Number(operator.approved_documents)===4&&Number(operator.total_documents)===4,approved_documents:Number(operator.approved_documents)},buses:buses.rows.map(b=>({...b,amenities:b.amenities||[],images:grouped[b.id]||[]})),routes:routes.rows,demo_data:true});
}
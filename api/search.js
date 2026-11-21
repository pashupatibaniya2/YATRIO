import { db, storage } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
 const from=String(req.query.from||"").trim(),to=String(req.query.to||"").trim(),date=String(req.query.date||"").trim();
 const {rows}=await db.query(
  "SELECT s.id AS schedule_id,b.id AS bus_id,o.name AS operator_name,o.slug AS operator_slug,b.name AS bus_name,b.bus_type,b.capacity,b.amenities,b.seat_layout_config,r.distance_km,r.duration_label,a.name AS origin_terminal,z.name AS destination_terminal,ca.name AS origin_city,cz.name AS destination_city,s.departure_at,s.arrival_at,s.fare,(SELECT count(*) FROM seat_inventory si WHERE si.schedule_id=s.id AND (si.status='available' OR (si.status='held' AND si.hold_expires_at<now()))) AS available_seats FROM schedules s JOIN buses b ON b.id=s.bus_id JOIN operators o ON o.id=b.operator_id JOIN routes r ON r.id=s.route_id JOIN terminals a ON a.id=r.origin_terminal_id JOIN terminals z ON z.id=r.destination_terminal_id JOIN cities ca ON ca.id=a.city_id JOIN cities cz ON cz.id=z.city_id WHERE o.status='approved' AND b.status='active' AND s.status='scheduled' AND s.departure_at>now() AND ($1='' OR lower(ca.name)=lower($1)) AND ($2='' OR lower(cz.name)=lower($2)) AND ($3='' OR to_char(s.departure_at AT TIME ZONE 'Asia/Kathmandu','YYYY-MM-DD')=$3) ORDER BY s.departure_at ASC",[from,to,date]);
 const ids=[...new Set(rows.map(x=>x.bus_id))];
 const images=ids.length?await db.query("SELECT id,bus_id,image_type,alt_text,storage_key,sort_order FROM bus_fleet_images WHERE bus_id=ANY($1::uuid[]) AND review_status='approved' ORDER BY sort_order,created_at",[ids]):{rows:[]};
 const grouped=new Map();
 for(const image of images.rows){if(!grouped.has(image.bus_id))grouped.set(image.bus_id,[]);grouped.get(image.bus_id).push({...image,url:await storage.url(image.storage_key)});}
 const results=rows.map(x=>({...x,bus_images:(grouped.get(x.bus_id)||[]).map(({id,image_type,alt_text,url})=>({id,image_type,alt_text,url})),seat_layout_image:(grouped.get(x.bus_id)||[]).find(i=>i.image_type==='seat_layout')?.url||null}));
 res.json({results,demo_data:true,message:"Sample operator and schedule data for MVP testing. Approved operator photos are displayed where available."});
}
import { db, storage } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const {rows}=await db.query(
  "SELECT b.id AS bus_id,b.name AS bus_name,b.bus_type,b.capacity,b.amenities,b.seat_layout_config,o.name AS operator_name,o.slug AS operator_slug,(SELECT count(*) FROM schedules s WHERE s.bus_id=b.id AND s.status='scheduled' AND s.departure_at>now())::int AS upcoming_services FROM buses b JOIN operators o ON o.id=b.operator_id WHERE b.status='active' AND o.status='approved' ORDER BY o.name,b.name LIMIT 80");
 const ids=rows.map(x=>x.bus_id);
 const imgs=ids.length?await db.query("SELECT bus_id,id,image_type,alt_text,storage_key,sort_order FROM bus_fleet_images WHERE bus_id=ANY($1::uuid[]) AND review_status='approved' ORDER BY sort_order,created_at",[ids]):{rows:[]};
 const grouped=new Map();
 for(const im of imgs.rows){if(!grouped.has(im.bus_id))grouped.set(im.bus_id,[]);try{grouped.get(im.bus_id).push({id:im.id,image_type:im.image_type,alt_text:im.alt_text,url:await storage.url(im.storage_key)})}catch(e){}}
 const vehicles=await Promise.all(rows.map(async b=>{
  const config=b.seat_layout_config||{},vehicle=config.vehicle||{},exterior=vehicle.exterior||{};let logo_url=null;
  if(exterior.logo_storage_key){try{logo_url=await storage.url(exterior.logo_storage_key)}catch(e){}}
  return {bus_id:b.bus_id,bus_name:b.bus_name,bus_type:b.bus_type,capacity:b.capacity,amenities:Array.isArray(b.amenities)?b.amenities:[],operator_name:b.operator_name,operator_slug:b.operator_slug,upcoming_services:b.upcoming_services,seat_layout_config:config,bus_images:grouped.get(b.bus_id)||[],logo_url};
 }));
 res.json({vehicles,count:vehicles.length,demo_data:true,notice:"Fleet records and schedules may include demonstration data. Only approved operator fleet photos and logos are shown."});
}
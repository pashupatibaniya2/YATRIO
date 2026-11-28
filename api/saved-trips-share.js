import { db } from "hatchable";
export const access = "user";
export const methods = ["POST","DELETE"];
export default async function(req,res) {
 const id=String(req.body?.id||req.query?.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid saved trip is required."});
 const userId=String(req.user?.id||"");
 if(!userId)return res.status(401).json({error:"Please sign in to manage sharing."});
 const owned=await db.query("SELECT id FROM saved_trips WHERE id=$1 AND user_id=$2",[id,userId]);
 if(!owned.rows.length)return res.status(404).json({error:"Trip not found."});
 if(req.method==="DELETE"){
  await db.query("DELETE FROM shared_trip_views WHERE trip_id=$1 AND user_id=$2",[id,userId]);
  await db.query("UPDATE saved_trips SET is_shared=FALSE,share_token=NULL,updated_at=now() WHERE id=$1 AND user_id=$2",[id,userId]);
  return res.json({revoked:true});
 }
 const found=await db.query("SELECT id,title,origin,destination,trip_days,travel_style,itinerary,updated_at FROM saved_trips WHERE id=$1 AND user_id=$2",[id,userId]);
 const trip=found.rows[0],token=crypto.randomUUID();
 const data=JSON.stringify({title:trip.title,origin:trip.origin,destination:trip.destination,trip_days:trip.trip_days,travel_style:trip.travel_style,itinerary:trip.itinerary,updated_at:trip.updated_at});
 await db.query("DELETE FROM shared_trip_views WHERE trip_id=$1 AND user_id=$2",[id,userId]);
 const expiresAt=new Date(Date.now()+30*24*60*60*1000).toISOString();
 await db.query("INSERT INTO shared_trip_views(share_token,trip_id,user_id,trip_data,expires_at) VALUES($1,$2,$3,$4::jsonb,$5)",[token,id,userId,data,expiresAt]);
 await db.query("UPDATE saved_trips SET is_shared=TRUE,share_token=$3,updated_at=now() WHERE id=$1 AND user_id=$2",[id,userId,token]);
 return res.json({url:"https://yatrio-nepal-bus.hatchable.site/shared-trip.html?token="+token,expires_at:expiresAt,expires_in_days:30});
}
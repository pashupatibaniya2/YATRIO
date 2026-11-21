import { db } from "hatchable";
export const access = "user";
export const methods = ["POST"];
export default async function(req,res) {
 const id=String(req.body?.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"A valid saved trip is required."});
 const userId=String(req.user.id),token=crypto.randomUUID();
 const found=await db.query("SELECT id,title,origin,destination,trip_days,travel_style,itinerary,budget,wishlist,updated_at FROM saved_trips WHERE id=$1 AND user_id=$2",[id,userId]);
 if(!found.rows.length)return res.status(404).json({error:"Trip not found."});
 const trip=found.rows[0];
 const data=JSON.stringify({title:trip.title,origin:trip.origin,destination:trip.destination,trip_days:trip.trip_days,travel_style:trip.travel_style,itinerary:trip.itinerary,budget:trip.budget,wishlist:trip.wishlist,updated_at:trip.updated_at});
 await db.query("INSERT INTO shared_trip_views(share_token,trip_id,user_id,trip_data) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(share_token) DO UPDATE SET trip_data=EXCLUDED.trip_data",[token,id,userId,data]);
 await db.query("UPDATE saved_trips SET is_shared=TRUE,share_token=$3,updated_at=now() WHERE id=$1 AND user_id=$2",[id,userId,token]);
 return res.json({url:"https://yatrio-nepal-bus.hatchable.site/shared-trip.html?token="+token});
}
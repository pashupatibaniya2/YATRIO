import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
 const token=String(req.query.token||"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(token))return res.status(400).json({error:"A valid shared trip link is required."});
 const r=await db.query("SELECT title,origin,destination,trip_days,travel_style,itinerary,budget,wishlist,updated_at FROM saved_trips WHERE share_token=$1 AND is_shared=TRUE LIMIT 1",[token]);
 if(!r.rows.length)return res.status(404).json({error:"This trip is private or the share link has expired."});
 return res.json({trip:r.rows[0]});
}
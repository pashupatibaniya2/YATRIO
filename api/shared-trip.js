import { db } from "hatchable";
export const access = "public";
export const methods = ["GET"];
export default async function(req,res) {
 const token=String(req.query.token||"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(token))return res.status(400).json({error:"A valid shared trip link is required."});
 const r=await db.query("SELECT trip_data,expires_at FROM shared_trip_views WHERE share_token=$1 AND expires_at>now() LIMIT 1",[token]);
 if(!r.rows.length)return res.status(404).json({error:"This trip is private or the share link has expired."});
 return res.json({trip:r.rows[0].trip_data,expires_at:r.rows[0].expires_at});
}
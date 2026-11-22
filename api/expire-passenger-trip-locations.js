import { db } from "hatchable";
export const access="scheduler";
export const methods=["POST"];
export default async function(req,res){
 const removed=await db.query("DELETE FROM passenger_trip_locations WHERE expires_at<=now() OR revoked_at IS NOT NULL RETURNING booking_id");
 return res.json({deleted_location_records:removed.rows.length,checked_at:new Date().toISOString()});
}
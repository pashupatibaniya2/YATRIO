import { db } from "hatchable";
export const access = "user";
export const methods = ["GET"];
export default async function(req,res) {
 const {rows}=await db.query("SELECT r.id,ca.name AS origin,cz.name AS destination,ta.name AS origin_terminal,tz.name AS destination_terminal,r.distance_km,r.duration_label FROM routes r JOIN terminals ta ON ta.id=r.origin_terminal_id JOIN terminals tz ON tz.id=r.destination_terminal_id JOIN cities ca ON ca.id=ta.city_id JOIN cities cz ON cz.id=tz.city_id ORDER BY ca.name,cz.name");
 res.json({routes:rows});
}
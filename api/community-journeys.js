import { db, storage } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const rows=await db.query("SELECT j.id,j.title,j.destination,j.story,j.verified_journey,j.created_at,j.display_name,j.storage_key FROM community_journeys j LEFT JOIN traveller_profiles p ON p.user_id=j.user_id LEFT JOIN users u ON u.id=j.user_id WHERE j.moderation_status='published' ORDER BY j.created_at DESC LIMIT 60");
 const journeys=await Promise.all(rows.rows.map(async j=>({id:j.id,title:j.title,destination:j.destination,story:j.story,verified_journey:j.verified_journey,created_at:j.created_at,display_name:j.display_name,image_url:await storage.url(j.storage_key)})));
 return res.json({journeys,count:journeys.length});
}
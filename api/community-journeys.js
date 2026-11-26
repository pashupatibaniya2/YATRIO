import { db, storage } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const destination=String(req.query?.destination||"").trim().slice(0,100)||null;
 const rows=await db.query("SELECT j.id,j.title,j.destination,j.story,j.verified_journey,j.created_at,j.display_name,j.storage_key FROM community_journeys j WHERE j.moderation_status='published' AND ($1::text IS NULL OR lower(j.destination)=lower($1)) ORDER BY j.created_at DESC LIMIT 60",[destination]);
 const journeys=await Promise.all(rows.rows.map(async j=>({id:j.id,title:j.title,destination:j.destination,story:j.story,verified_journey:j.verified_journey,created_at:j.created_at,display_name:j.display_name,image_url:await storage.url(j.storage_key)})));
 return res.json({journeys,count:journeys.length});
}
import { db, storage } from "hatchable";
export const access="admin";
export const methods=["GET","PUT"];
export default async function(req,res){
 if(req.method==="GET"){
  const rows=await db.query("SELECT j.id,j.title,j.destination,j.story,j.created_at,j.moderation_status,j.verified_journey,j.display_name,j.storage_key,(SELECT count(*)::int FROM community_journey_reports r WHERE r.journey_id=j.id AND r.status='open') AS open_reports FROM community_journeys j LEFT JOIN traveller_profiles p ON p.user_id=j.user_id LEFT JOIN users u ON u.id=j.user_id WHERE j.moderation_status='pending' OR EXISTS(SELECT 1 FROM community_journey_reports r WHERE r.journey_id=j.id AND r.status='open') ORDER BY open_reports DESC,j.created_at ASC LIMIT 100");
  const journeys=await Promise.all(rows.rows.map(async j=>({...j,image_url:await storage.url(j.storage_key)})));
  return res.json({journeys,count:journeys.length});
 }
 const id=String(req.body?.journey_id||""),status=String(req.body?.status||""),note=String(req.body?.moderation_note||"").trim().slice(0,300);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["published","rejected","removed"].includes(status))return res.status(400).json({error:"Choose a valid post and moderation decision."});
 const updated=await db.query("UPDATE community_journeys SET moderation_status=$1,moderation_note=$2,moderated_by=$3,moderated_at=now(),updated_at=now() WHERE id=$4 AND moderation_status IN ('pending','published') RETURNING id,storage_key,moderation_status",[status,note,String(req.member?.id||req.user?.id||"admin"),id]);
 if(!updated.rows.length)return res.status(404).json({error:"Journey post not found or already processed."});
 if(status==="removed")await storage.del(updated.rows[0].storage_key);
 await db.query("UPDATE community_journey_reports SET status='reviewed' WHERE journey_id=$1 AND status='open'",[id]);
 return res.json({journey:{id:updated.rows[0].id,status:updated.rows[0].moderation_status},message:"Moderation decision saved."});
}
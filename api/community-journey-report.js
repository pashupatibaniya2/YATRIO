import { db } from "hatchable";
export const access="user";
export const methods=["POST"];
export default async function(req,res){
 const uid=String(req.user?.id||""),id=String(req.body?.journey_id||""),reason=String(req.body?.reason||"");
 const details=String(req.body?.details||"").trim().slice(0,500);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["spam","inappropriate","misleading","privacy","copyright","other"].includes(reason))return res.status(400).json({error:"Choose a post and a valid report reason."});
 const saved=await db.query("INSERT INTO community_journey_reports(journey_id,user_id,reason,details) SELECT j.id,$2,$3,$4 FROM community_journeys j WHERE j.id=$1 AND j.moderation_status='published' ON CONFLICT(journey_id,user_id) DO NOTHING RETURNING id",[id,uid,reason,details]);
 if(!saved.rows.length)return res.status(409).json({error:"This post was already reported or is no longer public."});
 return res.status(201).json({message:"Thank you. The post has been flagged for review."});
}